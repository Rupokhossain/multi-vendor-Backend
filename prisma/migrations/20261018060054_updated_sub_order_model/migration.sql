-- AlterTable
ALTER TABLE "sub_orders" ADD COLUMN     "consignmentId" TEXT,
ADD COLUMN     "courierStatus" TEXT,
ADD COLUMN     "shippedAt" TIMESTAMP(3);
