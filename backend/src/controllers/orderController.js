const prisma = require('../config/db');
const {
    normalizeEstado,
    isEstadoValido,
    isCancelable,
    isValidTransition
} = require('../domain/orderStatus');
const {
    METODOS_VALIDOS,
    isMetodoValido,
    resolvePaymentStatus,
    resolveInitialOrderStatus
} = require('../domain/payment');

exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.user.findUnique({ where: { id: userId } });        const { restaurante_id, direccion_entrega_id, cupon_id, metodo_pago, items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'El pedido debe contener al menos un producto.' });
        }

        if (!restaurante_id || !direccion_entrega_id || !metodo_pago) {
            return res.status(400).json({ error: 'Faltan datos requeridos (restaurante_id, direccion_entrega_id, metodo_pago).' });
        }

        if (!isMetodoValido(metodo_pago)) {
            return res.status(400).json({
                error: `Método de pago no soportado. Debe ser uno de: ${METODOS_VALIDOS.join(', ')}.`
            });
        }

        // La dirección debe ser del propio usuario. Antes se aceptaba cualquier
        // id: el frontend enviaba un 1 fijo, que apunta a la dirección de otro
        // usuario, así que todo pedido ajeno se entregaba a esa dirección.
        const direccion = await prisma.deliveryAddress.findUnique({
            where: { id: Number(direccion_entrega_id) }
        });

        if (!direccion || direccion.usuario_id !== userId) {
            return res.status(403).json({ error: 'La dirección de entrega no te pertenece.' });
        }

        let subtotal = 0;
        const orderItemsData = [];

        // Extraer todos los IDs de los productos solicitados
        const productIds = items.map(item => item.productId);

        // Obtener todos los productos en una sola consulta
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } }
        });

        if (products.length !== productIds.length) {
            return res.status(404).json({ error: 'Algunos productos no fueron encontrados.' });
        }

        for (const item of items) {
            const product = products.find(p => p.id === item.productId);

            // Validar que el producto pertenezca al restaurante indicado
            if (product.restaurante_id !== restaurante_id) {
                return res.status(400).json({ error: `El producto ${product.nombre} no pertenece al restaurante especificado.` });
            }

            // Validar disponibilidad
            if (!product.disponibilidad) {
                return res.status(400).json({ error: `El producto ${product.nombre} no está disponible.` });
            }

            let price = product.precio;
            if (user.es_estudiante && product.descuento_estudiante > 0) {
                price = price - (price * (product.descuento_estudiante / 100));
            }
            subtotal += price * item.cantidad;
            orderItemsData.push({
                product_id: product.id,
                cantidad: item.cantidad,
                precio_unitario: price            });
        }

        // Aplicar descuentos
        let descuento = 0;
        if (cupon_id) {
            const cupon = await prisma.discountCoupon.findUnique({ where: { id: cupon_id } });
            if (!cupon || !cupon.estado) {
                return res.status(400).json({ error: 'El cupón no es válido o está inactivo.' });
            }
            descuento = subtotal * (cupon.porcentaje_descuento / 100);
        }

        // Cálculos finales: Impuestos fijos 18% y Costo de Envío fijo
        const subtotalConDescuento = subtotal - descuento;
        const IMPUESTO_PORCENTAJE = 0.18;
        const COSTO_ENVIO = 5.00; // Tarifa fija simulada

        const impuestos = subtotalConDescuento * IMPUESTO_PORCENTAJE;
        const total = subtotalConDescuento + impuestos + COSTO_ENVIO;

        // El efectivo se cobra en la puerta: ese pedido nace pendiente y queda
        // bajo la vigilancia de la auto-cancelación. Tarjeta y billetera se
        // autorizan antes, así que el pedido entra ya confirmado.
        const estadoPago = resolvePaymentStatus(metodo_pago);
        const estadoInicial = resolveInitialOrderStatus(estadoPago);

        // Crear la orden, los items y la transacción de manera atómica
        const result = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    user_id: userId,
                    restaurante_id,
                    direccion_entrega_id,
                    cupon_id,
                    total,
                    impuestos,
                    costo_envio: COSTO_ENVIO,
                    estado: estadoInicial,
                    OrderItem: { create: orderItemsData }
                },
                include: { OrderItem: true }
            });

            const newTransaction = await tx.transaction.create({
                data: {
                    pedido_id: newOrder.id,
                    metodo_pago,
                    monto: total,
                    estado_pago: estadoPago
                }
            });

            return { order: newOrder, transaction: newTransaction };
        });

        res.status(201).json({
            message: 'Pedido creado exitosamente',
            order: result.order,
            transaction: result.transaction
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el pedido.' });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        const orders = await prisma.order.findMany({
            where: { user_id: userId },
            include: {

                Restaurant: { select: {
                        id: true,
                        nombre: true,
                        calificacion_promedio: true
                    }
                },
                Review: true,
                OrderItem: {
                    include: {
                        Product: true
                    }
                }
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        // Se normaliza el estado para que el frontend no tenga que lidiar con
        // los valores heredados ('En preparación') que aún viven en la base.
        res.json(orders.map((o) => ({ ...o, estado: normalizeEstado(o.estado) })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el historial de pedidos.' });
    }
};

/**
 * Todos los pedidos. Lo usa el panel de operaciones para mover los estados.
 * La ruta ya está restringida a admin y repartidor.
 */
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                User_Order_user_idToUser: { select: { id: true, nombre: true, email: true } },
                Restaurant: { select: { id: true, nombre: true } }
            },
            orderBy: { fecha: 'desc' },
            take: 50
        });

        res.json(orders.map((o) => ({
            id: o.id,
            estado: normalizeEstado(o.estado),
            total: o.total,
            fecha: o.fecha,
            cliente: o.User_Order_user_idToUser?.nombre || 'Desconocido',
            restaurante: o.Restaurant?.nombre || '-'
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los pedidos.' });
    }
};

/**
 * Devuelve un pedido concreto. Es el endpoint que consulta la vista de
 * seguimiento cada pocos segundos para saber por dónde va la entrega.
 */
exports.getOrderById = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id, 10);

        if (Number.isNaN(orderId)) {
            return res.status(400).json({ error: 'Identificador de pedido inválido.' });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                Restaurant: {
                    select: { id: true, nombre: true, tiempo_entrega: true, calificacion_promedio: true }
                },
                OrderItem: { include: { Product: true } },
                DeliveryAddress: true,
                Transaction: true,
                Review: true
            }
        });

        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        const rol = String(req.user.rol || '').toLowerCase();
        const esPropietario = order.user_id === req.user.userId;

        if (!esPropietario && !['admin', 'repartidor'].includes(rol)) {
            return res.status(403).json({ error: 'No tienes permiso para ver este pedido.' });
        }

        res.json({ ...order, estado: normalizeEstado(order.estado) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el pedido.' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id, 10);

        if (Number.isNaN(orderId)) {
            return res.status(400).json({ error: 'Identificador de pedido inválido.' });
        }

        const nuevoEstado = normalizeEstado(req.body.nuevo_estado);

        if (!isEstadoValido(nuevoEstado)) {
            return res.status(400).json({ error: 'Estado no válido.' });
        }

        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        const estadoActual = normalizeEstado(order.estado);

        // El estado solo avanza un paso, o salta a cancelado si todavía se
        // puede. Antes se aceptaba cualquier valor, incluido retroceder un
        // pedido ya entregado.
        if (!isValidTransition(estadoActual, nuevoEstado)) {
            return res.status(409).json({
                error: `No se puede pasar de "${estadoActual}" a "${nuevoEstado}".`,
                estado_actual: estadoActual
            });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { estado: nuevoEstado }
        });

        res.json({ message: 'Estado del pedido actualizado', order: updatedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el estado del pedido.' });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.user.findUnique({ where: { id: userId } });        const orderId = parseInt(req.params.id);

        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        if (order.user_id !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para cancelar este pedido.' });
        }

        // REGLA DE NEGOCIO CRÍTICA: Solo se puede cancelar antes de "en_preparacion"
        if (!isCancelable(order.estado)) {
            return res.status(400).json({ error: 'El pedido no puede ser cancelado en su estado actual.' });
        }

        const canceledOrder = await prisma.order.update({
            where: { id: orderId },
            data: { estado: "cancelado" }
        });

        res.json({ message: 'Pedido cancelado exitosamente', order: canceledOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al cancelar el pedido.' });
    }
};

/**
 * Cancela los pedidos que llevan demasiado tiempo sin confirmarse.
 * La invoca el job de src/jobs/orderJobs.js cuando ENABLE_JOBS está activo.
 */
exports.autoCancelUnconfirmedOrders = async (minutos = Number(process.env.AUTO_CANCEL_MINUTES) || 30) => {
    try {
        const timeLimit = new Date();
        timeLimit.setMinutes(timeLimit.getMinutes() - minutos);

        const result = await prisma.order.updateMany({
            where: {
                estado: "pendiente",
                fecha: {
                    lt: timeLimit
                }
            },
            data: {
                estado: "cancelado"
            }
        });

        console.log(`CronJob ejecutado: Se cancelaron automáticamente ${result.count} órdenes por falta de confirmación.`);
    } catch (error) {
        console.error('Error en el CronJob de cancelación automática:', error);
    }
};
