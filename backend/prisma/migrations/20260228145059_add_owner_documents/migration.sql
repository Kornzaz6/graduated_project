/*
  Warnings:

  - Added the required column `updatedAt` to the `Owner` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('BANK', 'PROMPTPAY');

-- AlterTable
ALTER TABLE "Owner" ADD COLUMN     "businessLicense" TEXT,
ADD COLUMN     "idCardImage" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'BANK',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "qrImage" TEXT,
ADD COLUMN     "qrPayload" TEXT;

-- CreateIndex
CREATE INDEX "Owner_userId_idx" ON "Owner"("userId");
