-- Migration: replace TaskStatus enum with new values
-- Postgres can't remove enum values directly, so we recreate the type.

-- Step 1: Add a temporary text column to hold values during transition
ALTER TABLE "Task" ADD COLUMN "status_new" TEXT NOT NULL DEFAULT 'NOT_STARTED';

-- Step 2: Copy values, mapping old → new
UPDATE "Task" SET "status_new" = CASE
  WHEN status::text = 'IN_PROGRESS' THEN 'STARTED'
  WHEN status::text = 'BLOCKED'     THEN 'STUCK'
  ELSE status::text
END;

-- Step 3: Drop the old enum column
ALTER TABLE "Task" DROP COLUMN "status";

-- Step 4: Drop the old enum type
DROP TYPE "TaskStatus";

-- Step 5: Create the new enum type with all six values
CREATE TYPE "TaskStatus" AS ENUM (
  'NOT_STARTED',
  'STARTED',
  'STUCK',
  'ON_TRACK',
  'OFF_TRACK',
  'COMPLETE'
);

-- Step 6: Add the real column back using the new enum type
ALTER TABLE "Task" ADD COLUMN "status" "TaskStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- Step 7: Copy the text values into the typed column
UPDATE "Task" SET "status" = "status_new"::"TaskStatus";

-- Step 8: Drop the temporary column
ALTER TABLE "Task" DROP COLUMN "status_new";
