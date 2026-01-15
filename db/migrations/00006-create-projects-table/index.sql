CREATE TABLE "projects" (
    id BIGSERIAL PRIMARY KEY,

    "orgId" BIGINT NOT NULL,

    name TEXT NOT NULL,
    description TEXT,
    "avatarUrl" TEXT,

    status TEXT NOT NULL DEFAULT 'active',
    "completedDetails" TEXT,

    "dueDate" TIMESTAMPTZ,

    "milestonesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "targetsEnabled" BOOLEAN NOT NULL DEFAULT true,

    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ
);
