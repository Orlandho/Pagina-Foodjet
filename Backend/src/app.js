/**
 * Express Application Setup
 * Configuración principal de la aplicación Express
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { PORT, CORS_ORIGIN } = require('./config/constants');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const healthRoutes = require('./routes/health');

const app = express();

// ==========================================
// Middlewares - CORS and JSON Parsing
// ==========================================

/**
 * CORS Middleware
 * Permite solicitudes desde el origen especificado en variables de entorno
 */
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/**
 * JSON Body Parser Middleware
 * Parsea las solicitudes con Content-Type: application/json
 */
app.use(express.json());

/**
 * URL Encoded Body Parser Middleware
 * Parsea las solicitudes con Content-Type: application/x-www-form-urlencoded
 */
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Routes
// ==========================================

/**
 * Health Check Routes
 * Ruta de prueba para verificar que el servidor está funcionando
 */
app.use('/api/health', healthRoutes);

// ==========================================
// Error Handling
// ==========================================

/**
 * 404 Not Found Handler
 * Se ejecuta si ninguna ruta coincide
 */
app.use(notFoundHandler);

/**
 * Global Error Handler
 * Debe ser el último middleware registrado
 */
app.use(errorHandler);

module.exports = app;
