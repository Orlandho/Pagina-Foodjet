-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "distancia_metros" DOUBLE PRECISION,
ADD COLUMN     "envio_iniciado_en" TIMESTAMP(3),
ADD COLUMN     "eta_minutos" INTEGER,
ADD COLUMN     "repartidor_lat" DOUBLE PRECISION,
ADD COLUMN     "repartidor_lon" DOUBLE PRECISION,
ADD COLUMN     "ruta" JSONB;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "latitud" DOUBLE PRECISION,
ADD COLUMN     "longitud" DOUBLE PRECISION;
