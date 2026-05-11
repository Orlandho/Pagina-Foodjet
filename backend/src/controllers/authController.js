const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

exports.register = async (req, res) => {
    try {
        const { nombre, email, telefono, password, rol } = req.body;

        if (!nombre || !email || !telefono || !password) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        if (!/^\d{9}$/.test(telefono)) {
            return res.status(400).json({ error: 'El teléfono debe tener exactamente 9 dígitos.' });
        }

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'El email ya está registrado.', code: 'EMAIL_ALREADY_EXISTS' });
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Crear el usuario
        const newUser = await prisma.user.create({
            data: {
                nombre,
                email,
                telefono,
                password: hashedPassword,
                rol: rol === 'admin' ? 'admin' : 'cliente', // Por seguridad solo permitimos admin/cliente explícito, pero usualmente admin debería crearse con permisos especiales
            }
        });

        res.status(201).json({ message: 'Usuario registrado exitosamente', userId: newUser.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor al registrar usuario.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar el usuario
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        // Verificar la contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Generar JWT
        const token = jwt.sign(
            { userId: user.id, rol: user.rol, nombre: user.nombre },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ message: 'Inicio de sesión exitoso', token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, telefono: user.telefono } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión.' });
    }
};
