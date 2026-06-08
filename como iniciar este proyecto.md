# 🚀 Guía de Ejecución Local - Proyecto Foodjet

Este documento contiene los comandos necesarios para ejecutar correctamente el entorno de desarrollo local, compuesto por un backend (Node.js/Express) y un frontend (HTML/CSS/JS).

---

## 1️⃣ Iniciar el Backend (API)
El backend requiere conectarse a la base de datos y servir los endpoints en el puerto `3000`.

1. Abre una nueva terminal.
2. Navega hasta la carpeta del backend:
   ```bash
   cd backend
(Opcional) Si hiciste cambios en la base de datos o clonaste el repositorio recientemente, recompila y genera el cliente de Prisma:
npm install

npx prisma generate

Inicia el servidor:
npm start
✅ Resultado esperado: Verás en consola el mensaje: 🚀 Servidor ejecutándose en http://localhost:3000

2️⃣ Iniciar el Frontend (Web)
El frontend se sirve utilizando un servidor estático ligero llamado http-server en el puerto 8080.

Abre otra ventana o pestaña nueva en tu terminal (para no detener el backend).
Navega hasta la carpeta del frontend:
cd frontend
Ejecuta el servidor estático:
npx http-server -c-1 -p 8080
(Si te pregunta Ok to proceed? (y), presiona Enter o escribe y y presiona Enter).
Abre tu navegador web y visita: http://localhost:8080
✅ Resultado esperado: La página web debería cargar en tu navegador y consumir exitosamente los productos desde la API del backend.


De esta manera cualquier persona (o tú en el futuro) que tome tu proyecto sabrá exactamente cómo levantar ambas partes de manera independiente y sin conflictos.