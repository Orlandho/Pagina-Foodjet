-- 1. Crear la base de datos (Si ejecutas este script por completo, asegúrate de conectarte a FoodjetBackend después de este paso y antes de ejecutar el resto)
CREATE DATABASE "FoodjetBackend";

-- Nota: Para ejecutar las siguientes sentencias en PostgreSQL puro,
-- primero debes conectarte a la base de datos recién creada:
-- \c "FoodjetBackend"

-- 2. Crear Tablas

CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "foto_perfil" TEXT,
    "rol" TEXT NOT NULL DEFAULT 'Cliente', -- Roles: Cliente, Administrador, Soporte, Repartidor
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Restaurant" (
    "id" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado_afiliacion" TEXT NOT NULL DEFAULT 'pendiente', -- activo, inactivo, pendiente
    "calificacion_promedio" DOUBLE PRECISION DEFAULT 0.0,
    "qr_pago" TEXT
);

CREATE TABLE IF NOT EXISTS "Category" (
    "id" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL UNIQUE,
    "descripcion" TEXT
);

CREATE TABLE IF NOT EXISTS "Product" (
    "id" SERIAL PRIMARY KEY,
    "restaurante_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "imagen_url" TEXT,
    "disponibilidad" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Product_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DeliveryAddress" (
    "id" SERIAL PRIMARY KEY,
    "usuario_id" INTEGER NOT NULL,
    "direccion_detallada" TEXT NOT NULL,
    "referencia" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "es_predeterminada" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DeliveryAddress_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DiscountCoupon" (
    "id" SERIAL PRIMARY KEY,
    "codigo" TEXT NOT NULL UNIQUE,
    "porcentaje_descuento" DOUBLE PRECISION NOT NULL,
    "monto_maximo" DOUBLE PRECISION,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activo' -- Activo, Inactivo
);

CREATE TABLE IF NOT EXISTS "Order" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "restaurante_id" INTEGER NOT NULL,
    "direccion_entrega_id" INTEGER NOT NULL,
    "repartidor_id" INTEGER,
    "cupon_id" INTEGER,
    "total" DOUBLE PRECISION NOT NULL,
    "impuestos" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "costo_envio" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente', -- Pendiente, Confirmado, En preparación, En camino, Entregado, Cancelado
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_direccion_entrega_id_fkey" FOREIGN KEY ("direccion_entrega_id") REFERENCES "DeliveryAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_repartidor_id_fkey" FOREIGN KEY ("repartidor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_cupon_id_fkey" FOREIGN KEY ("cupon_id") REFERENCES "DiscountCoupon"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" SERIAL PRIMARY KEY,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" SERIAL PRIMARY KEY,
    "pedido_id" INTEGER NOT NULL UNIQUE,
    "metodo_pago" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "estado_pago" TEXT NOT NULL DEFAULT 'Pendiente', -- Exitoso, Fallido, Pendiente
    "fecha_transaccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Review" (
    "id" SERIAL PRIMARY KEY,
    "usuario_id" INTEGER NOT NULL,
    "restaurante_id" INTEGER NOT NULL,
    "pedido_id" INTEGER NOT NULL UNIQUE,
    "puntuacion" INTEGER NOT NULL CHECK ("puntuacion" >= 1 AND "puntuacion" <= 5),
    "comentario" TEXT,
    "fecha_publicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" SERIAL PRIMARY KEY,
    "usuario_id" INTEGER NOT NULL,
    "pedido_id" INTEGER,
    "agente_soporte_id" INTEGER,
    "asunto" TEXT NOT NULL,
    "descripcion_problema" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Abierto', -- Abierto, En revisión, Resuelto, Cerrado
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMP(3),
    CONSTRAINT "SupportTicket_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupportTicket_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SupportTicket_agente_soporte_id_fkey" FOREIGN KEY ("agente_soporte_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SupportMessage" (
    "id" SERIAL PRIMARY KEY,
    "ticket_id" INTEGER NOT NULL,
    "emisor_id" INTEGER NOT NULL,
    "mensaje" TEXT NOT NULL,
    "archivo_adjunto_url" TEXT,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupportMessage_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupportMessage_emisor_id_fkey" FOREIGN KEY ("emisor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Nota: Las tablas intermedias para las relaciones muchos a muchos (Restaurantes Favoritos, Categorías por Producto)
-- han sido omitidas intencionalmente de este script para que Prisma las gestione de forma implícita.

-- 3. Insertar Datos de Prueba (Dummy Data)
-- Para que el dummy data funcione con las nuevas dependencias (Restaurant, DeliveryAddress), necesitamos datos iniciales de esas tablas.

INSERT INTO "User" ("nombre", "email", "password", "rol", "telefono") VALUES
('Admin', 'admin@foodjet.com', 'hashed_pwd_admin', 'Administrador', '123456789'),
('Cliente 1', 'cliente1@mail.com', 'hashed_pwd_c1', 'Cliente', '987654321'),
('Cliente 2', 'cliente2@mail.com', 'hashed_pwd_c2', 'Cliente', '456123789');

INSERT INTO "Restaurant" ("nombre", "descripcion", "estado_afiliacion", "calificacion_promedio", "qr_pago") VALUES
('Burger King', 'Las mejores hamburguesas a la parrilla', 'activo', 4.5, 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg'),
('Pizza Hut', 'Pizzas recién horneadas con los mejores ingredientes', 'activo', 4.2, 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg'),
('Sushi Club', 'El sushi más fresco y delicioso de la ciudad', 'activo', 4.8, 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg');

INSERT INTO "Category" ("nombre", "descripcion") VALUES
('Hamburguesas', 'Comida rápida americana'),
('Pizzas', 'Especialidades italianas'),
('Sushi', 'Comida japonesa y asiática'),
('Ensaladas', 'Opciones saludables'),
('Bebidas', 'Refrescos y jugos');

INSERT INTO "Product" ("restaurante_id", "nombre", "descripcion", "precio", "imagen_url", "disponibilidad") VALUES
(1, 'Hamburguesa Clásica', 'Doble carne, queso cheddar, lechuga, tomate y salsa especial', 8.50, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true),
(2, 'Pizza Margarita', 'Salsa de tomate casera, mozzarella fresca y albahaca', 12.00, 'https://imag.bonviveur.com/pizza-margarita.jpg', true),
(2, 'Pizza Pepperoni', 'Salsa de tomate, mozzarella y abundante pepperoni', 14.50, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true),
(3, 'Sushi Roll California', 'Cangrejo, aguacate, pepino y sésamo tostado', 9.00, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true),
(1, 'Ensalada César', 'Lechuga romana, crutones, queso parmesano y aderezo César', 7.00, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true),
(1, 'Refresco de Cola', 'Lata de 330ml', 2.00, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', true);

INSERT INTO "DeliveryAddress" ("usuario_id", "direccion_detallada", "referencia", "es_predeterminada") VALUES
(2, 'Av. Principal 123', 'Cerca al parque', true),
(3, 'Calle Secundaria 456', 'Edificio rojo, piso 3', true);

INSERT INTO "Order" ("user_id", "restaurante_id", "direccion_entrega_id", "total", "estado") VALUES
(2, 1, 1, 22.50, 'Entregado'),
(3, 2, 2, 14.00, 'En preparación');

INSERT INTO "OrderItem" ("order_id", "product_id", "cantidad", "precio_unitario") VALUES
(1, 1, 1, 8.50),
(1, 5, 1, 14.00),
(2, 2, 1, 12.00),
(2, 6, 1, 2.00);
