-- CreateEnum
CREATE TYPE "DormitoryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Dormitory" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" INTEGER,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionNote" TEXT,
ADD COLUMN     "status" "DormitoryStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Dormitory_status_idx" ON "Dormitory"("status");

-- CreateIndex
CREATE INDEX "Dormitory_ownerId_idx" ON "Dormitory"("ownerId");
