/**
 * Health Routes
 * Rutas para verificar el estado del servidor
 */

const express = require('express');
const { getHealth } = require('../controllers/healthController');

const router = express.Router();

/**
 * GET /api/health
 * Retorna el estado actual del servidor
 */
router.get('/', getHealth);

module.exports = router;
