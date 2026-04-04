# FoodJet App (Frontend + Backend + SQL Server)

El backend sirve el frontend y la API desde el mismo puerto.

## 1) Configurar base de datos (SQL Server)

Ejecuta el script:

- ../Script base de datos/create database Foodjet.sql

Esto crea la base FoodjetBackend, inserta productos de ejemplo y crea las tablas products, orders y order_items.

## 2) Configurar variables de entorno

Copia .env.example a .env y ajusta los datos de tu SQL Server:

PORT=3000
DB_SERVER=localhost
DB_PORT=1433
DB_INSTANCE=
DB_USER=foodJet_backend
DB_PASSWORD=ContraseniaSegura.67!
DB_NAME=FoodjetBackend
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

Nota: si usas una instancia con nombre (por ejemplo, SQLEXPRESS), puedes dejar DB_PORT vacio y usar DB_INSTANCE=SQLEXPRESS.

## 3) Instalar dependencias

npm install

## 4) Levantar servidor

npm start

App completa: http://localhost:3000

## Endpoints

- GET /api/health valida conexion con SQL Server
- GET /api/products lista productos desde SQL Server
- POST /api/orders guarda un pedido y sus items
