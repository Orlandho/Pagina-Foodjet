-- 1. Crear la base de datos (Si ejecutas este script por completo, asegúrate de conectarte a FoodjetBackend después de este paso y antes de ejecutar el resto)
CREATE DATABASE "FoodjetBackend";

-- Nota: Para ejecutar las siguientes sentencias en PostgreSQL puro,
-- primero debes conectarte a la base de datos recién creada:
-- \c "FoodjetBackend"

-- 2. Crear Tablas (Coincidiendo con el esquema Prisma)

CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'cliente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Product" (
    "id" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "imagen_url" TEXT,
    "categoria" TEXT NOT NULL,
    "disponibilidad" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS "Order" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" SERIAL PRIMARY KEY,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. Insertar Datos de Prueba (Dummy Data)

-- Insertar Usuarios
INSERT INTO "User" ("nombre", "email", "password", "rol") VALUES
('Admin', 'admin@foodjet.com', '$2b$10$EP/k3zN/JbOEK2o6YgZHeu12w.Kk1/tKx4A9vRj8wI9Xo2H0Kx.P6', 'admin'),
('Juan Perez', 'juan@ejemplo.com', 'secreto123', 'cliente'),
('Maria Lopez', 'maria@ejemplo.com', 'secreto123', 'cliente');

-- Insertar Productos
INSERT INTO "Product" ("nombre", "descripcion", "precio", "imagen_url", "categoria", "disponibilidad") VALUES
('Hamburguesa Clásica', 'Doble carne, queso cheddar, lechuga, tomate y salsa especial', 8.50, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Hamburguesas', true),
('Pizza Margarita', 'Salsa de tomate casera, mozzarella fresca y albahaca', 12.00, 'https://images.unsplash.com/photo-1604068549290-dea0e4a30536?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Pizzas', true),
('Pizza Pepperoni', 'Salsa de tomate, mozzarella y abundante pepperoni', 14.50, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Pizzas', true),
('Sushi Roll California', 'Cangrejo, aguacate, pepino y sésamo tostado', 9.00, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Sushi', true),
('Ensalada César', 'Lechuga romana, crutones, queso parmesano y aderezo César', 7.00, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Ensaladas', true),
('Refresco de Cola', 'Lata de 330ml', 2.00, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'Bebidas', true);

-- Insertar Pedidos
INSERT INTO "Order" ("user_id", "total", "estado") VALUES
(2, 22.50, 'entregado'),
(3, 14.00, 'en_preparacion');

-- Insertar Elementos del Pedido (OrderItems)
INSERT INTO "OrderItem" ("order_id", "product_id", "cantidad", "precio_unitario") VALUES
(1, 1, 1, 8.50),
(1, 3, 1, 14.00),
(2, 2, 1, 12.00),
(2, 6, 1, 2.00);
