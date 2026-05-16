-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "taskId" TEXT;

-- CreateIndex
CREATE INDEX "ChatMessage_taskId_createdAt_idx" ON "ChatMessage"("taskId", "createdAt");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
