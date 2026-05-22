const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// ==========================================
// 1. SIMULACIÓN DEL ENTORNO BACKEND (Express, Prisma, Bcrypt)
// ==========================================
let req = { body: {} };
let res = {};
let responseStatus = null;
let responseJson = null;

// Mock del objeto 'res' de Express para poder encadenar res.status().json()
res.status = (code) => {
    responseStatus = code;
    return {
        json: (data) => {
            responseJson = data;
        }
    };
};

// Mock de Prisma y Bcrypt globales
global.prisma = {
    user: {
        findUnique: async () => null, // Por defecto no existe
        create: async (data) => ({ id: 'mock-user-id', ...data.data })
    }
};

global.bcrypt = {
    genSalt: async () => 'mock-salt',
    hash: async () => 'mock-hashed-password'
};

// ==========================================
// CÓDIGO REFACTORIZADO
// ==========================================

// Función auxiliar: Aislar la validación de los datos de entrada
const validateRegistrationData = (data) => {
    const { nombre, email, telefono, password } = data;
    
    if (!nombre || !email || !telefono || !password) {
        return { isValid: false, status: 400, error: 'Todos los campos son obligatorios.' };
    }
    
    if (!/^\d{9}$/.test(telefono)) {
        return { isValid: false, status: 400, error: 'El teléfono debe tener exactamente 9 dígitos.' };
    }
    
    return { isValid: true };
};

const authController = {
    register: async (req, res) => {
        try {
            // 1. Validación de formato
            const validation = validateRegistrationData(req.body);
            if (!validation.isValid) {
                return res.status(validation.status).json({ error: validation.error });
            }

            const { nombre, email, telefono, password, rol } = req.body;

            // 2. Validación de reglas de negocio (Duplicidad)
            const existingUser = await global.prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(409).json({ error: 'El email ya está registrado.', code: 'EMAIL_ALREADY_EXISTS' });
            }
            
            // 3. Procesamiento y guardado
            const salt = await global.bcrypt.genSalt(10);
            const hashedPassword = await global.bcrypt.hash(password, salt);

            const newUser = await global.prisma.user.create({
                data: {
                    nombre,
                    email,
                    telefono,
                    password: hashedPassword,
                    rol: rol === 'admin' ? 'admin' : 'cliente', 
                }
            });

            return res.status(201).json({ message: 'Usuario registrado exitosamente', userId: newUser.id });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Error en el servidor al registrar usuario.' });
        }
    }
};

// ==========================================
// 3. PASOS DE CUCUMBER
// ==========================================

Given('los datos de entrada son validos con nombre {string}, email {string}, telefono {string}, password {string} y rol {string}', function (nombre, email, telefono, password, rol) {
    req.body = { nombre, email, telefono, password, rol };
});

Given('los datos de entrada solo contienen el nombre {string}', function (nombre) {
    req.body = { nombre }; // Faltan email, telefono y password
});

Given('los datos de entrada son validos pero el telefono es {string}', function (telefonoInvalido) {
    req.body = { nombre: 'Juan', email: 'test@test.com', telefono: telefonoInvalido, password: '123' };
});

Given('los datos de entrada son validos con nombre {string}, email {string}, telefono {string}, password {string}', function (nombre, email, telefono, password) {
    req.body = { nombre, email, telefono, password };
});

Given('el correo no existe previamente en la base de datos', function () {
    global.prisma.user.findUnique = async () => null;
});

Given('el correo ya esta registrado en el sistema', function () {
    global.prisma.user.findUnique = async () => ({ id: 'usuario-existente-id' });
});

When('se ejecuta el controlador de registro', async function () {
    // Reiniciamos las respuestas antes de ejecutar
    responseStatus = null;
    responseJson = null;
    await authController.register(req, res);
});

Then('el sistema devuelve un codigo de estado HTTP {int}', function (statusCode) {
    expect(responseStatus).to.equal(statusCode);
});

Then('el JSON de respuesta contiene el mensaje {string}', function (mensaje) {
    expect(responseJson.message).to.equal(mensaje);
});

Then('el JSON de respuesta contiene el error de campos obligatorios', function () {
    expect(responseJson.error).to.equal('Todos los campos son obligatorios.');
});

Then('el JSON de respuesta contiene el error de telefono invalido', function () {
    expect(responseJson.error).to.equal('El teléfono debe tener exactamente 9 dígitos.');
});

Then('el JSON de respuesta contiene el error con codigo {string}', function (codigoError) {
    expect(responseJson.code).to.equal(codigoError);
    expect(responseJson.error).to.equal('El email ya está registrado.');
});