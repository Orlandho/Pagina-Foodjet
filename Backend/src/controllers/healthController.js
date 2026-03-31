/**
 * Health Check Controller
 * Controlador para verificar el estado del servidor
 */

const getHealth = (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      message: 'Servidor está funcionando correctamente',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al verificar el estado del servidor',
      error: error.message,
    });
  }
};

module.exports = {
  getHealth,
};
