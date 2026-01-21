CREATE TABLE "priorities" (
    id BIGSERIAL PRIMARY KEY,

    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,

    name TEXT NOT NULL,
    sequence INT NOT NULL,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT,

    -- 'active', 'archived'
    status TEXT NOT NULL DEFAULT 'active'
);
