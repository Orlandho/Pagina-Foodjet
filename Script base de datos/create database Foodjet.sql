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
    "rol" TEXT NOT NULL DEFAULT 'Cliente',
    "es_estudiante" BOOLEAN NOT NULL DEFAULT false, -- Roles: Cliente, Administrador, Soporte, Repartidor
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Restaurant" (
    "id" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado_afiliacion" TEXT NOT NULL DEFAULT 'pendiente',
    "tiempo_entrega" TEXT DEFAULT '30 minutos',
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
    "tipo_comida" TEXT DEFAULT 'General',
    "imagen_url" TEXT,
    "descuento_estudiante" DOUBLE PRECISION DEFAULT 0.0,
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

CREATE TABLE IF NOT EXISTS "_UserFavoriteProducts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_UserFavoriteProducts_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX "_UserFavoriteProducts_B_index" ON "_UserFavoriteProducts"("B");
ALTER TABLE "_UserFavoriteProducts" ADD CONSTRAINT "_UserFavoriteProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_UserFavoriteProducts" ADD CONSTRAINT "_UserFavoriteProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- 3. Insertar Datos de Prueba (Dummy Data)
-- Para que el dummy data funcione con las nuevas dependencias (Restaurant, DeliveryAddress), necesitamos datos iniciales de esas tablas.

INSERT INTO "User" ("nombre", "email", "password", "rol", "telefono") VALUES
('Admin', 'admin@foodjet.com', 'hashed_pwd_admin', 'Administrador', '123456789'),
('Cliente 1', 'cliente1@mail.com', 'hashed_pwd_c1', 'Cliente', '987654321'),
('Cliente 2', 'cliente2@mail.com', 'hashed_pwd_c2', 'Cliente', '456123789');

INSERT INTO "Restaurant" ("nombre", "descripcion", "estado_afiliacion", "calificacion_promedio", "qr_pago", "tiempo_entrega") VALUES
('Burger King', 'Las mejores hamburguesas a la parrilla', 'activo', 4.5, 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg', '30 minutos'),
('Pizza Hut', 'Pizzas recién horneadas con los mejores ingredientes', 'activo', 4.2, 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg', '1 hora'),
('Sushi Club', 'El sushi más fresco y delicioso de la ciudad', 'activo', 4.8, 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg', 'Más de 1 hora');

INSERT INTO "Category" ("nombre", "descripcion") VALUES
('Hamburguesas', 'Comida rápida americana'),
('Pizzas', 'Especialidades italianas'),
('Sushi', 'Comida japonesa y asiática'),
('Ensaladas', 'Opciones saludables'),
('Bebidas', 'Refrescos y jugos');

INSERT INTO "Product" ("restaurante_id", "nombre", "descripcion", "precio", "imagen_url", "descuento_estudiante", "disponibilidad", "tipo_comida") VALUES
(1, 'Hamburguesa Clásica', 'Doble carne, queso cheddar, lechuga, tomate y salsa especial', 8.50, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 10.0, true, 'Comida rápida'),
(2, 'Pizza Margarita', 'Salsa de tomate casera, mozzarella fresca y albahaca', 12.00, 'https://imag.bonviveur.com/pizza-margarita.jpg', 0.0, true, 'Pizzas'),
(2, 'Pizza Pepperoni', 'Salsa de tomate, mozzarella y abundante pepperoni', 14.50, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 15.0, true, 'Pizzas'),
(3, 'Sushi Roll California', 'Cangrejo, aguacate, pepino y sésamo tostado', 9.00, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 20.0, true, 'Cena'),
(1, 'Ensalada César', 'Lechuga romana, crutones, queso parmesano y aderezo César', 7.00, 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 0.0, true, 'Cena'),
(1, 'Refresco de Cola', 'Lata de 330ml', 2.00, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 5.0, true, 'Bebidas'),
(1, 'Whopper Clásica', 'Carne a la parrilla, tomates maduros, lechuga fresca, mayonesa, pepinillos y cebolla en pan con ajonjolí', 16.90, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Hamburguesas'),
(1, 'Whopper Doble con Queso', 'Doble porción de carne a la parrilla con doble queso cheddar fundido y vegetales frescos', 22.50, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Hamburguesas'),
(1, 'Whopper BBQ Bacon', 'Carne a la parrilla con crujientes tiras de tocino ahumado, salsa BBQ dulce y queso americano', 21.00, 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Hamburguesas'),
(1, 'Whopper Jr.', 'El sabor inconfundible de la Whopper en un tamaño ideal para un antojo rápido', 10.50, 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Hamburguesas'),
(1, 'Mega Stacker Cuádruple', 'Cuatro carnes a la parrilla, salsa Stacker especial, queso cheddar americano y abundante tocino', 34.90, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', 0.0, true, 'Hamburguesas'),
(1, 'Mega Stacker Triple', 'Tres pisos de carne a la parrilla con abundante tocino crocante y capas de queso cheddar fundido', 28.90, 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Hamburguesas'),
(1, 'King de Pollo Crujiente', 'Filete de pechuga de pollo empanizado extra crujiente con lechuga fresca y mayonesa suave', 14.50, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Pollo'),
(1, 'Chicken Crispy Deluxe', 'Pechuga de pollo marinada y crocante con queso suizo, tocino y salsa honey mustard en pan brioche', 17.50, 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Pollo'),
(1, 'Hamburguesa con Queso y Tocino', 'Carne a la parrilla con doble queso americano derretido y finas láminas de tocino crujiente', 12.90, 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Hamburguesas'),
(1, 'Rodeo Burger BBQ', 'Carne a la parrilla con crujientes aros de cebolla dorados, queso cheddar y salsa barbacoa ahumada', 13.90, 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Hamburguesas'),
(1, 'Hamburguesa Vegetariana Rebel', 'Medallón 100% a base de plantas con sabor a la parrilla, lechuga, tomate y mayonesa ligera', 18.00, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80', 20.0, true, 'Hamburguesas'),
(1, 'Nuggets de Pollo x10', 'Bocados de pechuga de pollo empanizados dorados y crocantes, acompañados de tu salsa favorita', 11.00, 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Pollo'),
(1, 'Nuggets de Pollo x20', 'Caja familiar con 20 nuggets crujientes de pollo con salsas BBQ y Mostaza Dulce incluidas', 19.90, 'https://images.unsplash.com/photo-1585325701165-351af916e581?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Pollo'),
(1, 'Alitas BBQ King x6', 'Alitas de pollo glaseadas en salsa barbacoa agridulce horneadas a la perfección', 15.50, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80', 5.0, true, 'Pollo'),
(1, 'Aros de Cebolla King (Grandes)', 'Aros de cebolla rebozados y fritos hasta obtener un dorado crujiente perfecto', 7.50, 'https://images.unsplash.com/photo-1639024471285-05c7d23d8869?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Comida rápida'),
(1, 'Papas Fritas Medianas Crocantes', 'Papas cortadas gruesas, doradas por fuera y suaves por dentro con el toque justo de sal marina', 6.00, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Comida rápida'),
(1, 'Papas Supremas con Queso y Tocino', 'Papas fritas bañadas en salsa de queso cheddar caliente y trozos de tocino crujiente', 10.90, 'https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Comida rápida'),
(1, 'Hashbrowns Dorados', 'Dos croquetas de papa rallada ultra crujientes doradas al punto ideal', 5.50, 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80', 0.0, true, 'Comida rápida'),
(1, 'Tenders de Pollo Crujientes x4', 'Tiras de pura pechuga de pollo marinadas y rebozadas con especias secretas', 13.00, 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Pollo'),
(1, 'King Fusion Dulce de Leche', 'Helado cremoso de vainilla batido con dulce de leche artesanal y crocantes trozos de galleta', 7.90, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Postres'),
(1, 'King Fusion Oreo', 'Helado de vainilla suave mezclado con galletas Oreo trituradas y sirope de chocolate', 7.90, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Postres'),
(1, 'Cono de Vainilla Suave', 'Clásico barquillo crocante relleno de delicioso helado de crema de vainilla', 3.00, 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80', 0.0, true, 'Postres'),
(1, 'Sundae de Chocolate Caliente', 'Copa de helado suave de vainilla coronada con salsa caliente de chocolate fudge', 5.50, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Postres'),
(1, 'Sundae de Fresa Artesanal', 'Helado cremoso bañado en una deliciosa y fresca jalea de fresas naturales', 5.50, 'https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Postres'),
(1, 'Pie de Manzana Horneado', 'Masa hojaldrada rellena de trozos tiernos de manzana con canela y azúcar morena', 4.90, 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Postres'),
(1, 'Batido de Vainilla Cremoso', 'Milkshake tradicional preparado con helado de vainilla y leche fresca entera', 8.50, 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Bebidas'),
(1, 'Batido de Chocolate Suizo', 'Milkshake espeso elaborado con cacao puro, helado de chocolate y crema chantilly', 8.50, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Bebidas'),
(1, 'Gaseosa Sprite 500ml', 'Botella de refresco lima-limón helada para acompañar tus hamburguesas', 3.50, 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=800&q=80', 0.0, true, 'Bebidas'),
(1, 'Gaseosa Fanta Naranja 500ml', 'Bebida gaseosa sabor a naranja refrescante servida fría', 3.50, 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=800&q=80', 0.0, true, 'Bebidas'),
(1, 'Gaseosa Inca Kola 500ml', 'El sabor del Perú en botella individual de 500ml bien helada', 3.50, 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80', 5.0, true, 'Bebidas'),
(1, 'Gaseosa Coca-Cola Zero 500ml', 'El gran sabor de siempre sin azúcar ni calorías en botella de 500ml', 3.50, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=80', 5.0, true, 'Bebidas'),
(1, 'Agua San Luis sin Gas 500ml', 'Agua purificada de manantial natural en botella personal de 500ml', 2.50, 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80', 0.0, true, 'Bebidas'),
(1, 'Jugo de Naranja Natural', 'Jugo 100% natural exprimido al momento con naranjas peruanas seleccionadas', 6.00, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Bebidas'),
(1, 'Té Helado de Durazno', 'Infusión de té negro con notas frescas de durazno dulce y cubos de hielo', 4.50, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Bebidas'),
(1, 'Café Americano Caliente', 'Café tostado 100% arábica recién pasado con intenso aroma y cuerpo suave', 4.00, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Bebidas'),
(2, 'Pizza Suprema Especial', 'Carne de res, pepperoni, jamón, salchicha italiana, champiñones, pimiento verde y cebolla roja', 24.50, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Pizzas'),
(2, 'Pizza Hawaiana Tradicional', 'La clásica combinación de jamón inglés tierno, trozos jugosos de piña dulce y doble queso mozzarella', 19.90, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Pizzas'),
(2, 'Pizza Cuatro Quesos Gourmet', 'Exquisita mezcla de mozzarella fundida, queso provolone ahumado, parmesano madurado y gorgonzola', 23.00, 'https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Pizzas'),
(2, 'Pizza Carnívora Intensa', 'Para amantes de la carne: pepperoni crujiente, carne sazonada, tocino ahumado y jamón selecto', 26.50, 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Pizzas'),
(2, 'Pizza Vegetariana del Huerto', 'Pimientos frescos, champiñones laminados, cebolla morada, aceitunas negras y tomates cherry', 18.50, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80', 20.0, true, 'Pizzas'),
(2, 'Pizza BBQ Pulled Pork', 'Cerdo deshilachado bañado en salsa barbacoa ahumada, cebolla caramelizada y queso mozzarella', 25.00, 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Pizzas'),
(2, 'Pizza Pollo & Champiñones', 'Tiras de pechuga de pollo asada al romero, champiñones frescos y un toque de crema de leche', 21.50, 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Pizzas'),
(2, 'Pizza Continental Peruana', 'Jamón inglés, champiñones salteados, cebolla blanca y abundante queso mozzarella fundido', 20.00, 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Pizzas'),
(2, 'Pizza Americana con Jamón', 'La pizza preferida de todos: salsa pomodoro casera, abundante queso mozzarella y jamón inglés', 16.00, 'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Pizzas'),
(2, 'Pizza Pepperoni Lover''s', 'Doble porción de pepperoni premium tostado al horno hasta quedar crujiente con borde artesanal', 22.90, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Pizzas'),
(2, 'Pizza Fugazzeta con Cebolla Dulce', 'Estilo argentino con abundante mozzarella, cebolla marinada con orégano y un toque de aceite de oliva', 19.50, 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Pizzas'),
(2, 'Pizza Napolitana con Tomates Confitados', 'Mozzarella de búfala, rodajas de tomate natural confitado, albahaca y lluvia de ajo tostado', 21.00, 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Pizzas'),
(2, 'Pizza Borde de Queso Mozzarella', 'Masa gruesa rellena en todo el borde con queso mozzarella fundido y cubierta de pepperoni', 27.00, 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=800&q=80', 5.0, true, 'Pizzas'),
(2, 'Calzone Relleno de Tres Quesos y Jamón', 'Masa italiana horneada y doblada, rellena de ricotta, mozzarella, jamón y salsa marinara', 16.50, 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Cena'),
(2, 'Calzone Rústico de Pepperoni y Champiñón', 'Empanada gigante al horno de piedra con pepperoni crocante, champiñones y queso provolone', 17.50, 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Cena'),
(2, 'Lasagna Boloñesa Tradicional', 'Capas de pasta artesanal con salsa boloñesa de res y cerdo, bechamel suave y queso gratinado', 22.00, 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Cena'),
(2, 'Fetuccini a la Huancaína con Lomo', 'Pasta larga al dente envuelta en cremosa salsa huancaína con trozos de lomo fino salteados', 29.00, 'https://images.unsplash.com/photo-1621996346565-e3d5d6281744?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Cena'),
(2, 'Espagueti al Pesto con Queso Parmesano', 'Pasta bañada en tradicional pesto genovés de albahaca fresca, nueces, ajo y aceite de oliva', 18.00, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80', 20.0, true, 'Cena'),
(2, 'Ravioles de Ricotta en Salsa Pomodoro', 'Pasta rellena de suave queso ricotta y espinaca con salsa de tomates confitados y albahaca', 21.00, 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Cena'),
(2, 'Pan al Ajo Clásico x4', 'Cuatro rebanadas de pan francés horneadas con mantequilla de ajo y finas hierbas aromáticas', 6.50, 'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Comida rápida'),
(2, 'Pan al Ajo Especial con Queso Mozzarella x4', 'Nuestros panes al ajo cubiertos con una generosa capa de queso mozzarella fundido al horno', 9.50, 'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Comida rápida'),
(2, 'Palitos de Queso con Salsa Marinara', 'Bastones de masa crocante rellenos de mozzarella líquida con salsa marinara tibia para dipear', 12.00, 'https://images.unsplash.com/photo-1548340748-6d2b7d7da280?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Comida rápida'),
(2, 'Alitas Buffalo Picantes x8', 'Ocho alitas crujientes bañadas en intensa salsa picante estilo Buffalo con aderezo blue cheese', 18.50, 'https://images.unsplash.com/photo-1527477378408-1bc0931215b2?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Pollo'),
(2, 'Alitas BBQ Dulces x8', 'Alitas glaseadas en salsa barbacoa ahumada dulce con toque de miel de abeja', 18.50, 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Pollo'),
(2, 'Champiñones al Horno Gratinados', 'Champiñones enteros en cazuela con mantequilla de ajo, vino blanco y queso parmesano gratinado', 14.00, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Cena'),
(2, 'Crolls Rellenos de Nutella x6', 'Rollitos de masa de pizza recién horneados rellenos de auténtica crema de avellanas Nutella', 11.90, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Postres'),
(2, 'Volcán de Chocolate Fundido', 'Bizcocho tibio de chocolate relleno de centro líquido fundente acompañado de helado de vainilla', 13.50, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Postres'),
(2, 'Pizza Dulce con Manzana y Canela', 'Masa fina cubierta de finas láminas de manzana caramelizada, canela en polvo y azúcar glass', 15.00, 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Postres'),
(2, 'Tiramisú Italiano Tradicional', 'Capas de bizcochuelo soletilla bañadas en café espresso y licor amaretto con crema de mascarpone', 12.50, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Postres'),
(2, 'Cheesecake de Frutos Rojos', 'Tarta cremosa de queso sobre base crocante de galletas con coulis de frambuesa y mora', 12.00, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Postres'),
(2, 'Chicha Morada Casera 1L', 'Preparada artesanalmente con maíz morado, piña, manzana, canela y clavo de olor bien helada', 9.00, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Bebidas'),
(2, 'Limonada Frozen Menta y Jengibre', 'Refrescante limonada frappé batida con hojas de menta orgánica y un toque sutil de kion', 7.50, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Bebidas'),
(2, 'Gaseosa Coca-Cola Original 1.5L', 'Formato familiar de 1.5 litros ideal para compartir con tus pizzas favoritas', 7.50, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80', 5.0, true, 'Bebidas'),
(2, 'Gaseosa Inca Kola Original 1.5L', 'La bebida de sabor nacional en presentación de 1.5 litros helada', 7.50, 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80', 5.0, true, 'Bebidas'),
(2, 'Cerveza Cusqueña Trigo 330ml', 'Cerveza rubia peruana tipo trigo con cuerpo sedoso y notas cítricas refrescantes', 8.50, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=800&q=80', 0.0, true, 'Bebidas'),
(3, 'Acevichado Roll Especial', 'Langostino furai y palta por dentro, envuelto en atún fresco bañado en cremosa salsa acevichada', 23.50, 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Sushi'),
(3, 'Furai Roll Crocante', 'Roll empanizado al panko relleno de salmón fresco, queso crema philadelphia y palta con salsa tare', 21.00, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Sushi'),
(3, 'Avocado Roll Relleno de Salmón', 'Cubierto de finas láminas de palta hass fresca con relleno de salmón rosado y queso crema', 22.00, 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Sushi'),
(3, 'Maki Lomo Saltado Fusión', 'Maki nikkei con tiritas de lomo fino salteado al wok, cebolla roja, tomate y papitas al hilo', 24.00, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Sushi'),
(3, 'Spicy Tuna Roll Intenso', 'Tartar de atún rojo sazonado con sriracha, aceite de sésamo y masago sobre arroz avinagrado', 21.50, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Sushi'),
(3, 'Crispy Ebi Roll con Langostino', 'Langostino crocante empanizado, pepino japonés y palta cubierto con semillas de ajonjolí negro', 20.50, 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Sushi'),
(3, 'Rainbow Roll Multicolor', 'California roll clásico cubierto de láminas alternadas de salmón fresco, atún y palta madura', 25.00, 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Sushi'),
(3, 'Philadelphia Roll Tradicional', 'El balance perfecto de salmón fresco del pacífico, queso crema cremoso y sésamo tostado', 19.50, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Sushi'),
(3, 'Sake Maki de Salmón Fresco', 'Hosomaki delgado envuelto en alga nori crocante con centro de jugoso salmón rosado fresco', 14.00, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Sushi'),
(3, 'Tekka Maki de Atún Rojo', 'Rollito tradicional japonés relleno de lomo de atún fresco seleccionado con toque de wasabi', 14.50, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Sushi'),
(3, 'Maki Anticuchero Peruano', 'Langostino furai y queso crema cubierto con lámina de pulpo flambeado y salsa anticuchera nikkei', 24.50, 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Sushi'),
(3, 'Nigiri de Salmón Flameado x2', 'Dos bocados de arroz prensado con salmón sellado al soplete con gotas de salsa tare y cebollita china', 11.50, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Sushi'),
(3, 'Nigiri de Atún Rojo x2', 'Dos piezas de arroz japonés cubiertas con cortes limpios de atún rojo de primera calidad', 12.00, 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Sushi'),
(3, 'Nigiri de Pulpo al Olivo x2', 'Finos cortes de pulpo tierno sobre arroz shari coronados con mayonesa de aceitunas botija', 11.00, 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Sushi'),
(3, 'Nigiri de Langostino Ebi x2', 'Langostino cocido al vapor abierto en mariposa sobre base de arroz sazonado con mirin', 10.50, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Sushi'),
(3, 'Sashimi Mixto Especial (9 cortes)', 'Nueve cortes selectos de salmón fresco, atún rojo y pulpo blanco con nabo rallado y wasabi', 35.00, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Cena'),
(3, 'Sashimi de Salmón Premium (6 cortes)', 'Seis lonjas gruesas de salmón noruego crudo con textura mantequillosa y frescura insuperable', 28.00, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Cena'),
(3, 'Poke Bowl Salmón & Aguacate', 'Base de arroz shari con cubos de salmón fresco, palta, edamames, pepino japonés y salsa ponzu', 26.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Ensaladas'),
(3, 'Poke Bowl Atún Spicy & Mango', 'Atún fresco macerado en aceite picante, mango en dados dulces, col morada y semillas de sésamo', 25.50, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Ensaladas'),
(3, 'Poke Bowl Pollo Teriyaki', 'Pechuga de pollo glaseada en salsa teriyaki dulce sobre arroz al vapor, brócoli y zanahoria', 21.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', 20.0, true, 'Ensaladas'),
(3, 'Gyozas al Vapor de Cerdo x5', 'Cinco empanaditas japonesas al vapor rellenas de cerdo especiado con salsa de soja y aceite de sésamo', 14.50, 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Comida rápida'),
(3, 'Gyozas Crocantes de Langostino x5', 'Empanadas de masa fina selladas y doradas a la sartén rellenas de langostinos con jengibre', 16.00, 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Comida rápida'),
(3, 'Ebi Furai con Salsa Tártara Japonesa x5', 'Cinco langostinos enteros jumbo empanizados al panko extra crocantes con salsa tártara de la casa', 18.00, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Comida rápida'),
(3, 'Edamames con Sal Marina', 'Vainas tiernas de soya cocidas al vapor salpicadas con gruesos cristales de sal marina', 9.50, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Comida rápida'),
(3, 'Edamames Spicy Shichimi', 'Vainas de soya salteadas con aceite de sésamo, ajo y mezcla de siete especias japonesas', 11.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Comida rápida'),
(3, 'Sopa Miso Tradicional con Tofu', 'Caldo dashi caliente con pasta fermentada de miso, cubos tiernos de tofu fresco, alga wakame y cebollín', 8.50, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Cena'),
(3, 'Ramen Tonkotsu con Chashu', 'Intenso caldo de cerdo cocido 12 horas con fideos ramen, cerdo chashu tierno, huevo ajitsuke y nori', 28.50, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Cena'),
(3, 'Yakisoba Clásico con Verduras y Pollo', 'Fideos salteados al wok con pechuga de pollo, col, zanahoria, cebolla y salsa yakisoba agridulce', 22.00, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80', 15.0, true, 'Cena'),
(3, 'Arroz Chaufa de Mariscos al Wok', 'Arroz frito al wok al estilo chifa con langostinos, calamares, huevo, cebollita china y salsa de soya', 27.00, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Cena'),
(3, 'Helado Frito de Té Verde Matcha', 'Bola de helado de matcha envuelta en bizcocho crocante frito al momento con miel de maple', 13.00, 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Postres'),
(3, 'Mochi Helado de Fresa y Maracuyá x2', 'Dos pastelitos japoneses de masa de arroz suave y elástica rellenos de helado de frutas exóticas', 10.50, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Postres'),
(3, 'Cerveza Asahi Japonesa 330ml', 'Cerveza japonesa Super Dry con final limpio y seco, perfecta para maridar con sushi', 12.00, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=800&q=80', 0.0, true, 'Bebidas'),
(3, 'Té Verde Sencha Japonés Caliente', 'Taza de té verde japonés premium con propiedades antioxidantes y notas herbáceas relajantes', 5.00, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Bebidas'),
(3, 'Bebida de Aloe Vera con Uva 500ml', 'Bebida refrescante y digestiva con auténticos trocitos gelatinosos de pulpa de sábila', 6.50, 'https://images.unsplash.com/photo-1546883468-d31c0dd0824b?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Bebidas'),
(3, 'Ramune Soda Japonesa Original 200ml', 'La divertida y tradicional soda japonesa con canica selladora y refrescante sabor a limón dulce', 8.50, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80', 10.0, true, 'Bebidas');

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
