CREATE TABLE "projects" (
    id BIGSERIAL PRIMARY KEY,

    "orgId" BIGINT NOT NULL,

    name TEXT NOT NULL,
    description TEXT,
    "avatarUrl" TEXT,

    "dueDate" TIMESTAMPTZ,

    "isMilestonesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isTargetsEnabled" BOOLEAN NOT NULL DEFAULT true,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT,

    -- 'active', 'archived'
    status TEXT NOT NULL DEFAULT 'active'
);
