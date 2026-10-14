-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "plan_tiempos" JSONB;

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "estado" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origen" TEXT NOT NULL,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderStatusHistory_pedido_id_fecha_idx" ON "OrderStatusHistory"("pedido_id", "fecha");

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

