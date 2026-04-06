const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Obtener el token del header (formato: "Bearer [token]")
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // ej: { userId: 1, rol: 'cliente' }
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };
