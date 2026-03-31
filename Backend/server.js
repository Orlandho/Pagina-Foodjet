/**
 * Server Entry Point
 * Punto de entrada para inicializar el servidor
 */

require('dotenv').config();
const app = require('./src/app');
const { PORT, HOST } = require('./src/config/constants');

const server = app.listen(PORT, HOST, () => {
  console.log(`✓ Servidor ejecutándose en http://${HOST}:${PORT}`);
  console.log(`✓ Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Prueba la API en: http://${HOST}:${PORT}/api/health`);
});

/**
 * Graceful Shutdown
 * Maneja el cierre elegante del servidor
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT recibido. Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});
