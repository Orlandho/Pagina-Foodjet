# Foodjet Backend API

API REST desarrollada con Node.js y Express para el proyecto Foodjet. Esta es una plantilla inicial (boilerplate) configurada para permitir el desarrollo escalable de endpoints.

## Descripción General

Este backend proporciona una estructura base profesional con:

- Servidor Express.js configurado
- Middlewares de CORS y parseo de JSON
- Manejo centralizado de errores
- Variables de entorno mediante `.env`
- Estructura modular de rutas y controladores
- Script de desarrollo con nodemon para recarga automática

## Estructura del Proyecto

```
Backend/
├── src/
│   ├── config/           # Configuración (constantes, etc.)
│   ├── routes/           # Definición de rutas
│   ├── controllers/       # Lógica de negocio por endpoint
│   ├── middlewares/       # Middlewares personalizados
│   └── app.js            # Configuración principal de Express
├── server.js             # Punto de entrada
├── package.json          # Dependencias del proyecto
├── .env.example          # Variables de entorno de ejemplo
├── .gitignore            # Archivos a ignorar en Git
└── README.md             # Este archivo
```

## Instalación y Configuración

### 1. Inicializar el Proyecto

```bash
cd Backend
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env`:

```bash
copy .env.example .env
```

O manualmente crea un archivo `.env` en la raíz de Backend con el siguiente contenido:

```env
NODE_ENV=development
PORT=3000
HOST=localhost
CORS_ORIGIN=http://localhost:3000
```

### 3. Iniciar el Servidor

**Modo Desarrollo (con nodemon - recarga automática):**
```bash
npm run dev
```

**Modo Producción:**
```bash
npm start
```

## Endpoints Disponibles

### Health Check

**Ruta:** `GET /api/health`

**Descripción:** Verifica que el servidor está funcionando y retorna su estado actual.

**Respuesta (200 OK):**
```json
{
  "status": "OK",
  "message": "Servidor está funcionando correctamente",
  "timestamp": "2024-03-31T10:30:45.123Z",
  "uptime": 125.456,
  "environment": "development"
}
```

## Próximos Pasos para Expansión

Para agregar nuevos endpoints, sigue este patrón:

### 1. Crear un Controlador

Crea un archivo en `src/controllers/`:

```javascript
// src/controllers/tuController.js
const getTuDato = (req, res) => {
  res.status(200).json({ message: 'Tu dato aquí' });
};

module.exports = { getTuDato };
```

### 2. Crear una Ruta

Crea un archivo en `src/routes/`:

```javascript
// src/routes/tuRuta.js
const express = require('express');
const { getTuDato } = require('../controllers/tuController');

const router = express.Router();
router.get('/', getTuDato);

module.exports = router;
```

### 3. Registrar la Ruta en `app.js`

Agrega en `src/app.js`:

```javascript
const tuRoutes = require('./routes/tuRuta');
app.use('/api/tu-endpoint', tuRoutes);
```

## Notas Técnicas

- **CORS:** Actualmente configurado para permitir solicitudes desde `http://localhost:3000`. Cambiar en `.env` según sea necesario.
- **Puerto:** Por defecto es 3000. Modificable en `.env`.
- **Variables de Entorno:** Siempre usar `.env` para configuración sensible (no incluir en repositorio).
- **Manejo de Errores:** Los errores son capturados por el middleware centralizado en `middlewares/errorHandler.js`.
- **Nodemon:** Solo instalado en devDependencies. No se incluye en producción.

## Dependencias Principales

- **express:** Framework web
- **cors:** Manejo de solicitudes CORS
- **dotenv:** Carga de variables de entorno
- **nodemon:** (dev) Reinicio automático durante desarrollo

## Notas para el Equipo de Desarrollo

1. **No modificar archivos de configuración base sin coordinar** con el equipo, especialmente `server.js` y `src/app.js`.
2. **Mantener la estructura de carpetas**: Siempre crear controllers, routes y middlewares en sus respectivas carpetas.
3. **Usar variables de entorno**: Cualquier valor configurable debe estar en `.env`.
4. **Documentar nuevos endpoints**: Actualizar este archivo cuando se agreguen nuevas rutas.
5. **Códigos de estado HTTP**: Usar códigos apropiados (200, 201, 400, 404, 500, etc.).
6. **Formato de respuestas**: Mantener consistencia JSON con propiedades `status` y `message`.

## Troubleshooting

**Error: "Cannot find module 'express'"**
- Solución: Ejecuta `npm install`

**Error: "Port 3000 already in use"**
- Solución: Cambia el PORT en `.env` o termina el proceso que usa ese puerto

**nodemon no reinicia automáticamente**
- Solución: Verifica que está instalado: `npm install --save-dev nodemon`

## Licencia

ISC
