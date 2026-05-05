const prisma = require('../config/db');

exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { restaurante_id, direccion_entrega_id, cupon_id, metodo_pago, items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'El pedido debe contener al menos un producto.' });
        }

        if (!restaurante_id || !direccion_entrega_id || !metodo_pago) {
            return res.status(400).json({ error: 'Faltan datos requeridos (restaurante_id, direccion_entrega_id, metodo_pago).' });
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

            subtotal += product.precio * item.cantidad;
            orderItemsData.push({
                product_id: product.id,
                cantidad: item.cantidad,
                precio_unitario: product.precio
            });
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
                    estado: "pendiente",
                    orderItems: {
                        create: orderItemsData
                    }
                },
                include: {
                    orderItems: true
                }
            });

            const newTransaction = await tx.transaction.create({
                data: {
                    pedido_id: newOrder.id,
                    metodo_pago,
                    monto: total,
                    estado_pago: "completado" // Simulando que el pago se aprueba instantáneamente
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

        const orders = await prisma.order.findMany({
            where: { user_id: userId },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el historial de pedidos.' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { nuevo_estado } = req.body;

        const estadosValidos = ["pendiente", "confirmado", "en_preparacion", "en_camino", "entregado", "cancelado"];

        if (!estadosValidos.includes(nuevo_estado)) {
            return res.status(400).json({ error: 'Estado no válido.' });
        }

        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { estado: nuevo_estado }
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
        const orderId = parseInt(req.params.id);

        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (!order) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        if (order.user_id !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para cancelar este pedido.' });
        }

        // REGLA DE NEGOCIO CRÍTICA: Solo se puede cancelar antes de "en_preparacion"
        const estadosCancelables = ["pendiente", "confirmado"];

        if (!estadosCancelables.includes(order.estado)) {
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
 * TODO: CronJob - Cancelación Automática de Órdenes
 * Esta función está estructurada para ser llamada por un CronJob cada minuto o cada cierto intervalo.
 * Se encarga de buscar todas las órdenes que sigan en estado "pendiente" y cuya fecha de creación
 * sea anterior a hace 30 minutos, y las actualiza a "cancelado".
 */
exports.autoCancelUnconfirmedOrders = async () => {
    try {
        const timeLimit = new Date();
        timeLimit.setMinutes(timeLimit.getMinutes() - 30);

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
