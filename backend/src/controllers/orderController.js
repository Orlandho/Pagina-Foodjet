const prisma = require('../config/db');

exports.createOrder = async (req, res) => {
    try {
        // req.user viene del middleware de autenticación
        const userId = req.user.userId;
        const { items } = req.body; // items: [{ productId: 1, cantidad: 2 }, ...]

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'El pedido debe contener al menos un producto.' });
        }

        // Obtener la información de los productos de la BD para calcular el total
        let total = 0;
        const orderItemsData = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product) {
                return res.status(404).json({ error: `Producto con ID ${item.productId} no encontrado.` });
            }

            total += product.precio * item.cantidad;
            orderItemsData.push({
                product_id: product.id,
                cantidad: item.cantidad,
                precio_unitario: product.precio
            });
        }

        // Crear la orden y los items en una transacción
        const newOrder = await prisma.order.create({
            data: {
                user_id: userId,
                total: total,
                estado: "pendiente",
                orderItems: {
                    create: orderItemsData
                }
            },
            include: {
                orderItems: true
            }
        });

        res.status(201).json({ message: 'Pedido creado exitosamente', order: newOrder });
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
