-- DropForeignKey
ALTER TABLE "NotificationLog" DROP CONSTRAINT "NotificationLog_ruleId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_goalId_fkey";

-- DropIndex
DROP INDEX "NotificationLog_ruleId_taskId_idx";

-- AlterTable
ALTER TABLE "DueDateHistory" ALTER COLUMN "reason" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "departments" DROP DEFAULT;

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "NotificationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
