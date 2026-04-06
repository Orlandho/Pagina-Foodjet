const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Rutas protegidas (requieren autenticación)
router.post('/', authMiddleware, orderController.createOrder);
router.get('/my-orders', authMiddleware, orderController.getMyOrders);

module.exports = router;
