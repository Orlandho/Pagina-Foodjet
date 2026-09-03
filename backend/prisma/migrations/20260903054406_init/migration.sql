-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryAddress" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "direccion_detallada" TEXT NOT NULL,
    "referencia" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "es_predeterminada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DeliveryAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCoupon" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "porcentaje_descuento" DOUBLE PRECISION NOT NULL,
    "monto_maximo" DOUBLE PRECISION,
    "fecha_expiracion" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activo',

    CONSTRAINT "DiscountCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "restaurante_id" INTEGER NOT NULL,
    "direccion_entrega_id" INTEGER NOT NULL,
    "repartidor_id" INTEGER,
    "cupon_id" INTEGER,
    "total" DOUBLE PRECISION NOT NULL,
    "impuestos" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "costo_envio" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "restaurante_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "tipo_comida" TEXT DEFAULT 'General',
    "imagen_url" TEXT,
    "descuento_estudiante" DOUBLE PRECISION DEFAULT 0.0,
    "disponibilidad" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado_afiliacion" TEXT NOT NULL DEFAULT 'pendiente',
    "tiempo_entrega" TEXT DEFAULT '30 minutos',
    "calificacion_promedio" DOUBLE PRECISION DEFAULT 0.0,
    "qr_pago" TEXT,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "restaurante_id" INTEGER NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "fecha_publicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "emisor_id" INTEGER NOT NULL,
    "mensaje" TEXT NOT NULL,
    "archivo_adjunto_url" TEXT,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "pedido_id" INTEGER,
    "agente_soporte_id" INTEGER,
    "asunto" TEXT NOT NULL,
    "descripcion_problema" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Abierto',
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "metodo_pago" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "estado_pago" TEXT NOT NULL DEFAULT 'Pendiente',
    "fecha_transaccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "foto_perfil" TEXT,
    "rol" TEXT NOT NULL DEFAULT 'Cliente',
    "es_estudiante" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserFavoriteProducts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserFavoriteProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_nombre_key" ON "Category"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCoupon_codigo_key" ON "DiscountCoupon"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Review_pedido_id_key" ON "Review"("pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_pedido_id_key" ON "Transaction"("pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "_UserFavoriteProducts_B_index" ON "_UserFavoriteProducts"("B");

-- AddForeignKey
ALTER TABLE "DeliveryAddress" ADD CONSTRAINT "DeliveryAddress_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_cupon_id_fkey" FOREIGN KEY ("cupon_id") REFERENCES "DiscountCoupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_direccion_entrega_id_fkey" FOREIGN KEY ("direccion_entrega_id") REFERENCES "DeliveryAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_repartidor_id_fkey" FOREIGN KEY ("repartidor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_restaurante_id_fkey" FOREIGN KEY ("restaurante_id") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_emisor_id_fkey" FOREIGN KEY ("emisor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_agente_soporte_id_fkey" FOREIGN KEY ("agente_soporte_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFavoriteProducts" ADD CONSTRAINT "_UserFavoriteProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFavoriteProducts" ADD CONSTRAINT "_UserFavoriteProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
