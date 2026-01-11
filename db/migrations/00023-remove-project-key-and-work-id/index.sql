-- Remove workId trigger
DROP TRIGGER IF EXISTS set_work_id ON "work";
DROP FUNCTION IF EXISTS assign_work_id();

-- Remove workId column from work table
ALTER TABLE "work" DROP CONSTRAINT IF EXISTS "work_projectId_workId_key";
ALTER TABLE "work" DROP COLUMN IF EXISTS "workId";

-- Remove key column from projects table
ALTER TABLE "projects" DROP COLUMN IF EXISTS "key";
