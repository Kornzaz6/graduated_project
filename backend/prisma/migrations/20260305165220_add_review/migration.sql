-- DropIndex
DROP INDEX "Review_dormitoryId_idx";

-- CreateIndex
CREATE INDEX "Review_userId_dormitoryId_idx" ON "Review"("userId", "dormitoryId");
