CREATE TABLE "milestones" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,
    "targetId" BIGINT,
    name TEXT NOT NULL,
    description TEXT,
    "dueDate" TIMESTAMPTZ,
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
