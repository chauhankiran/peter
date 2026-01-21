CREATE TABLE "projectMembers" (
    id BIGSERIAL PRIMARY KEY,

    "projectId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,

    role TEXT NOT NULL DEFAULT 'member',

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT,

    -- 'active', 'archived'
    status TEXT NOT NULL DEFAULT 'active'
);
