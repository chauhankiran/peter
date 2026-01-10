ALTER TABLE "work" ADD COLUMN "statusId" BIGINT;

UPDATE "work" w
SET "statusId" = s.id
FROM "statuses" s
WHERE
    s."projectId" = w."projectId" AND
    s.name = 'To do' AND
    w."statusId" IS NULL;

ALTER TABLE "work" ALTER COLUMN "statusId" SET NOT NULL;

ALTER TABLE "work"
ADD CONSTRAINT work_status_id_fk
FOREIGN KEY ("statusId")
REFERENCES "statuses"(id);

CREATE INDEX work_status_id_idx ON "work"("statusId");
