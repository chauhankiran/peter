CREATE TABLE "works" (
    id BIGSERIAL PRIMARY KEY,

    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,

    title TEXT NOT NULL,
    description TEXT NOT NULL,

    "statusId" BIGINT NOT NULL,
    "priorityId" BIGINT NOT NULL,

    "milestoneId" BIGINT,
    "targetId" BIGINT,

    "assigneeId" BIGINT,
    "reporterId" BIGINT NOT NULL,

    "dueDate" TIMESTAMPTZ,

    "completedAt" TIMESTAMPTZ,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT,

    -- 'active', 'archived'
    status TEXT NOT NULL DEFAULT 'active'
);
