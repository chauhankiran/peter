ALTER TABLE "work" RENAME COLUMN "priorityId" TO "legacyPriorityId";

ALTER TABLE "work" ADD COLUMN "priorityId" BIGINT;

UPDATE "work" w
SET "priorityId" = p.id
FROM "priorities" p
WHERE
    p."projectId" = w."projectId" AND
    (
        (w."legacyPriorityId" = 1 AND p.name = 'Low') OR
        (w."legacyPriorityId" = 2 AND p.name = 'Normal') OR
        (w."legacyPriorityId" = 3 AND p.name = 'High')
    );

-- Fallback to Normal where we could not map.
UPDATE "work" w
SET "priorityId" = p.id
FROM "priorities" p
WHERE
    w."priorityId" IS NULL AND
    p."projectId" = w."projectId" AND
    p.name = 'Normal';

ALTER TABLE "work" ALTER COLUMN "priorityId" SET NOT NULL;

ALTER TABLE "work"
ADD CONSTRAINT work_priority_id_fk
FOREIGN KEY ("priorityId")
REFERENCES "priorities"(id);

CREATE INDEX work_priority_id_idx ON "work"("priorityId");

ALTER TABLE "work" DROP COLUMN "legacyPriorityId";
