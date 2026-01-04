CREATE TABLE "work" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,

    "workId" BIGINT NOT NULL,

    title TEXT NOT NULL,
    description TEXT NOT NULL,

    "typeId" BIGINT NOT NULL,
    "priorityId" BIGINT NOT NULL,
    "milestoneId" BIGINT NOT NULL,
    "targetId" BIGINT NOT NULL,

    "assigneeId" BIGINT NOT NULL,
    "reporterId" BIGINT NOT NULL,

    "dueDate" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,

    -- Audit fields
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,

    "isActive" BOOLEAN NOT NULL DEFAULT true,

    UNIQUE("projectId", "workId")
);
