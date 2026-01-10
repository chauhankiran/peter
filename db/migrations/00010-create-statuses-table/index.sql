CREATE TABLE "statuses" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,

    name TEXT NOT NULL,
    sequence INT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,

    -- Audit fields
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,

    UNIQUE("projectId", name),
    UNIQUE("projectId", sequence)
);

INSERT INTO "statuses" ("orgId", "projectId", name, sequence, "isDone")
SELECT p."orgId", p.id, 'To do', 10, false
FROM projects p
WHERE p."status" = 'active'
ON CONFLICT DO NOTHING;

INSERT INTO "statuses" ("orgId", "projectId", name, sequence, "isDone")
SELECT p."orgId", p.id, 'In progress', 20, false
FROM projects p
WHERE p."status" = 'active'
ON CONFLICT DO NOTHING;

INSERT INTO "statuses" ("orgId", "projectId", name, sequence, "isDone")
SELECT p."orgId", p.id, 'Done', 30, true
FROM projects p
WHERE p."status" = 'active'
ON CONFLICT DO NOTHING;
