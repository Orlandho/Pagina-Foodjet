require('dotenv').config();
const path = require('node:path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');

const reviewRoutes = require('./routes/reviewRoutes');

const userRoutes = require('./routes/userRoutes');
const addressRoutes = require('./routes/addressRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const configRoutes = require('./routes/configRoutes');
const { startJobs } = require('./jobs/orderJobs');
const app = express();
const serveWeb = process.env.FOODJET_SERVE_WEB === 'true';

if (serveWeb) {
    if (!process.env.DATABASE_URL || (process.env.JWT_SECRET?.length ?? 0) < 32) {
        throw new Error('Configura DATABASE_URL y un JWT_SECRET de al menos 32 caracteres.');
    }
    app.disable('x-powered-by');
    app.use((req, res, next) => {
        res.set({
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        });
        next();
    });
}

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);

app.use('/api/users', userRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/config', configRoutes);

if (serveWeb) {
    app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta de API no encontrada.' }));
    app.use(express.static(path.resolve(__dirname, '../../appwrite-web'), {
        setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache')
    }));
}
// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
        startJobs();
    });
}

module.exports = app;
