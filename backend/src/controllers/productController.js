const prisma = require('../config/db');

exports.getAllProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los productos.' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { nombre, descripcion, precio, imagen_url, categoria, disponibilidad } = req.body;

        const newProduct = await prisma.product.create({
            data: {
                nombre,
                descripcion,
                precio: parseFloat(precio),
                imagen_url,
                categoria,
                disponibilidad: disponibilidad !== undefined ? disponibilidad : true,
            }
        });

        res.status(201).json({ message: 'Producto creado exitosamente', product: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el producto.' });
    }
};
