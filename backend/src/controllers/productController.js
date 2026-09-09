const prisma = require('../config/db');

exports.getAllProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: {
                Restaurant: {
                    select: {
                        nombre: true,
                        estado_afiliacion: true,
                        qr_pago: true,
                        tiempo_entrega: true,
                        calificacion_promedio: true
                    }
                }
            }
        });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los productos.' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { restaurante_id, nombre, descripcion, precio, imagen_url, disponibilidad, tipo_comida, descuento_estudiante } = req.body;

        const newProduct = await prisma.product.create({
            data: {
                restaurante_id: parseInt(restaurante_id),
                nombre,
                descripcion,
                precio: parseFloat(precio),
                imagen_url,
                disponibilidad: disponibilidad !== undefined ? disponibilidad : true,
                tipo_comida: tipo_comida || 'General',
                descuento_estudiante: descuento_estudiante !== undefined ? parseFloat(descuento_estudiante) : 0.0
            }
        });

        res.status(201).json({ message: 'Producto creado exitosamente', product: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el producto.' });
    }
};
