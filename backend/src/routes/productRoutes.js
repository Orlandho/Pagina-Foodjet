const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

// Ruta pública
router.get('/', productController.getAllProducts);

// Ruta protegida para admin
router.post('/', authMiddleware, adminMiddleware, productController.createProduct);

module.exports = router;
