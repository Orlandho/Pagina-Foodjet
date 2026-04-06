# FoodJet App (Frontend + Backend + MySQL)

El backend sirve el frontend y la API desde el mismo puerto.

## 1) Configurar base de datos (MySQL)

Ejecuta el script:

- ../Script base de datos MySQL/create database Foodjet.sql

Esto crea la base de datos FoodjetBackend, inserta productos de ejemplo y crea las tablas products, orders y order_items.

## 2) Configurar variables de entorno

Copia .env.example a .env y ajusta los datos de tu conexión MySQL:

PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=foodJet_backend
DB_PASSWORD=ContraseniaSegura.67!
DB_NAME=FoodjetBackend

## 3) Instalar dependencias

npm install

## 4) Levantar servidor

npm start

App completa: http://localhost:3000

## Endpoints

- GET /api/health valida conexion con MySQL
- GET /api/products lista productos desde MySQL
- POST /api/orders guarda un pedido y sus items
