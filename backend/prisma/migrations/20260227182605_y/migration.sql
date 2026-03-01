/*
  Warnings:

  - Added the required column `email` to the `OwnerApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `OwnerApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `OwnerApplication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OwnerApplication" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNo" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" INTEGER;

-- CreateIndex
CREATE INDEX "OwnerApplication_userId_idx" ON "OwnerApplication"("userId");
