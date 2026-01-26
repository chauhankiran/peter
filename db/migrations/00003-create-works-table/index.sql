CREATE TABLE "works" (
    id BIGSERIAL PRIMARY KEY,

    title TEXT NOT NULL,
    description TEXT,
    
    "projectId" BIGINT,
    "dueDate" TIMESTAMPTZ,
    "assigneeId" BIGINT,
    "statusId" BIGINT,
    "typeId" BIGINT,
    "priorityId" BIGINT,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT
);
