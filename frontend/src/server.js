const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcrypt');
const { getPool } = require('./db');

dotenv.config({ quiet: true });

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendPath = path.resolve(__dirname, '..');

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

app.get('/api/health', async (_req, res) => {
    try {
        const pool = await getPool();
        await pool.query('SELECT 1 AS ok');
        res.json({ ok: true, message: 'API y MySQL operativos' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'No se pudo conectar a MySQL', error: error.message });
    }
});

app.get('/api/products', async (_req, res) => {
    try {
        const pool = await getPool();
        const [rows] = await pool.query(`
            SELECT
                id,
                name,
                description,
                CAST(price AS DECIMAL(10,2)) AS price,
                image_url AS image,
                category
            FROM products
            ORDER BY id ASC
        `);

        const formattedRows = rows.map(row => ({
            ...row,
            price: Number(row.price)
        }));

        return res.json(formattedRows);
    } catch (error) {
        return res.status(500).json({ message: 'No se pudieron obtener los productos', error: error.message });
    }
});

app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });
    }

    try {
        const pool = await getPool();

        // Verificar si el email ya existe
        const [checkResult] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (checkResult.length > 0) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [insertResult] = await pool.query(`
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        `, [name, email, hashedPassword]);

        return res.status(201).json({
            id: insertResult.insertId,
            name: name,
            email: email,
            role: 'customer'
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error al registrar el usuario', error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    try {
        const pool = await getPool();

        const [rows] = await pool.query(`
            SELECT id, name, email, password
            FROM users
            WHERE email = ?
        `, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        return res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'customer'
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    const { userId, customer, paymentMethod, items, subtotal, deliveryFee, total } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'Debe iniciar sesión para realizar un pedido' });
    }

    if (!customer || !customer.name || !customer.phone || !customer.address) {
        return res.status(400).json({ message: 'Faltan datos de cliente obligatorios' });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'El pedido debe incluir al menos un producto' });
    }

    if (!['cash', 'card'].includes(paymentMethod)) {
        return res.status(400).json({ message: 'Metodo de pago invalido' });
    }

    const orderNumber = `FJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const initialStatus = 'preparing';

    try {
        const pool = await getPool();
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [orderResult] = await connection.query(`
                INSERT INTO orders (
                    order_number,
                    user_id,
                    customer_name,
                    customer_phone,
                    customer_address,
                    customer_reference,
                    payment_method,
                    subtotal,
                    delivery_fee,
                    total,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                orderNumber,
                userId,
                customer.name,
                customer.phone,
                customer.address,
                customer.reference || null,
                paymentMethod,
                subtotal,
                deliveryFee,
                total,
                initialStatus
            ]);

            const orderId = orderResult.insertId;

            for (const item of items) {
                await connection.query(`
                    INSERT INTO order_items (
                        order_id,
                        product_id,
                        product_name,
                        unit_price,
                        quantity,
                        line_total
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    orderId,
                    item.productId,
                    item.name,
                    item.unitPrice,
                    item.quantity,
                    item.lineTotal
                ]);
            }

            await connection.commit();
            connection.release();

            return res.status(201).json({
                id: orderId,
                orderNumber,
                status: initialStatus,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        return res.status(500).json({ message: 'No se pudo guardar el pedido', error: error.message });
    }
});

app.get('/', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(port, () => {
    console.log(`FoodJet app corriendo en http://localhost:${port}`);
});
