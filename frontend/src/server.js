const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { sql, getPool } = require('./db');

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
        await pool.request().query('SELECT 1 AS ok');
        res.json({ ok: true, message: 'API y SQL Server operativos' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'No se pudo conectar a SQL Server', error: error.message });
    }
});

app.get('/api/products', async (_req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT
                id,
                name,
                description,
                CAST(price AS DECIMAL(10,2)) AS price,
                image_url AS image,
                category
            FROM dbo.products
            ORDER BY id ASC
        `);

        return res.json(result.recordset);
    } catch (error) {
        return res.status(500).json({ message: 'No se pudieron obtener los productos', error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    const { customer, paymentMethod, items, subtotal, deliveryFee, total } = req.body;

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
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const orderRequest = new sql.Request(transaction);
            orderRequest.input('order_number', sql.VarChar(50), orderNumber);
            orderRequest.input('customer_name', sql.NVarChar(120), customer.name);
            orderRequest.input('customer_phone', sql.VarChar(30), customer.phone);
            orderRequest.input('customer_address', sql.NVarChar(250), customer.address);
            orderRequest.input('customer_reference', sql.NVarChar(250), customer.reference || null);
            orderRequest.input('payment_method', sql.VarChar(20), paymentMethod);
            orderRequest.input('subtotal', sql.Decimal(10, 2), subtotal);
            orderRequest.input('delivery_fee', sql.Decimal(10, 2), deliveryFee);
            orderRequest.input('total', sql.Decimal(10, 2), total);
            orderRequest.input('status', sql.VarChar(20), initialStatus);

            const orderResult = await orderRequest.query(`
                INSERT INTO dbo.orders (
                    order_number,
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
                OUTPUT INSERTED.id
                VALUES (
                    @order_number,
                    @customer_name,
                    @customer_phone,
                    @customer_address,
                    @customer_reference,
                    @payment_method,
                    @subtotal,
                    @delivery_fee,
                    @total,
                    @status
                )
            `);

            const orderId = orderResult.recordset[0].id;

            for (const item of items) {
                const itemRequest = new sql.Request(transaction);
                itemRequest.input('order_id', sql.Int, orderId);
                itemRequest.input('product_id', sql.Int, item.productId);
                itemRequest.input('product_name', sql.NVarChar(150), item.name);
                itemRequest.input('unit_price', sql.Decimal(10, 2), item.unitPrice);
                itemRequest.input('quantity', sql.Int, item.quantity);
                itemRequest.input('line_total', sql.Decimal(10, 2), item.lineTotal);

                await itemRequest.query(`
                    INSERT INTO dbo.order_items (
                        order_id,
                        product_id,
                        product_name,
                        unit_price,
                        quantity,
                        line_total
                    )
                    VALUES (
                        @order_id,
                        @product_id,
                        @product_name,
                        @unit_price,
                        @quantity,
                        @line_total
                    )
                `);
            }

            await transaction.commit();

            return res.status(201).json({
                id: orderId,
                orderNumber,
                status: initialStatus,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            await transaction.rollback();
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
