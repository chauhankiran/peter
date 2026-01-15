CREATE TABLE "targets" (
    id BIGSERIAL PRIMARY KEY,

    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,

    name TEXT NOT NULL,
    description TEXT,
    "dueDate" TIMESTAMPTZ,

    status TEXT NOT NULL DEFAULT 'active',
    "completedDetails" TEXT,

    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ
);
