-- Migration: change Employee.department (single) → Employee.departments (array)
-- Preserves existing department assignments by wrapping them in an array.

-- Step 1: Add the new array column
ALTER TABLE "Employee" ADD COLUMN "departments" "Department"[] NOT NULL DEFAULT '{}';

-- Step 2: Copy the existing single value into the array
UPDATE "Employee" SET "departments" = ARRAY["department"::"Department"];

-- Step 3: Drop the old single-value column
ALTER TABLE "Employee" DROP COLUMN "department";
