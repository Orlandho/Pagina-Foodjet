/**
 * Error Handler Middleware
 * Middleware centralizado para manejo de errores
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    status: 'ERROR',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found Handler
 * Maneja rutas no encontradas
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'ERROR',
    message: `La ruta ${req.method} ${req.originalUrl} no existe`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
