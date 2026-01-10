CREATE TABLE "priorities" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,

    name TEXT NOT NULL,
    sequence INT NOT NULL,

    -- Audit fields
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,

    UNIQUE("projectId", name),
    UNIQUE("projectId", sequence)
);

INSERT INTO "priorities" ("orgId", "projectId", name, sequence)
SELECT p."orgId", p.id, 'Low', 10
FROM projects p
WHERE p."status" = 'active'
ON CONFLICT DO NOTHING;

INSERT INTO "priorities" ("orgId", "projectId", name, sequence)
SELECT p."orgId", p.id, 'Normal', 20
FROM projects p
WHERE p."status" = 'active'
ON CONFLICT DO NOTHING;

INSERT INTO "priorities" ("orgId", "projectId", name, sequence)
SELECT p."orgId", p.id, 'High', 30
FROM projects p
WHERE p."status" = 'active'
ON CONFLICT DO NOTHING;

INSERT INTO "priorities" ("orgId", "projectId", name, sequence)
SELECT p."orgId", p.id, 'Urgent', 40
FROM projects p
WHERE p."status" = 'active'
ON CONFLICT DO NOTHING;
