/*
  Warnings:

  - A unique constraint covering the columns `[imageHash]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'CONFIRMED';

-- AlterTable
ALTER TABLE "Owner" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNo" TEXT,
ADD COLUMN     "bankName" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "confirmedByOwner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imageHash" TEXT,
ADD COLUMN     "ownerConfirmAt" TIMESTAMP(3),
ADD COLUMN     "ownerNote" TEXT,
ADD COLUMN     "receiverAccount" TEXT,
ADD COLUMN     "receiverName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_imageHash_key" ON "Payment"("imageHash");
