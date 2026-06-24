-- NoteType enum
CREATE TYPE "NoteType" AS ENUM ('REGULAR', 'DATE_CHANGE');

-- Goal table
CREATE TABLE "Goal" (
  "id"          TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "department"  "Department" NOT NULL,
  "description" TEXT,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Add goalId to Task
ALTER TABLE "Task" ADD COLUMN "goalId" TEXT;
ALTER TABLE "Task" ADD CONSTRAINT "Task_goalId_fkey"
  FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL;

-- Add noteType to TaskNote
ALTER TABLE "TaskNote" ADD COLUMN "noteType" "NoteType" NOT NULL DEFAULT 'REGULAR';

-- Add reason to DueDateHistory (default empty string for existing rows)
ALTER TABLE "DueDateHistory" ADD COLUMN "reason" TEXT NOT NULL DEFAULT '';
