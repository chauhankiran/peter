CREATE TABLE "comments" (
    id BIGSERIAL PRIMARY KEY,

    "orgId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,
    "workId" BIGINT NOT NULL,

    body TEXT NOT NULL,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT,

    -- 'active', 'archived'
    status TEXT NOT NULL DEFAULT 'active'
);
