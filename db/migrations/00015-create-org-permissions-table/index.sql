CREATE TABLE "orgPermissions" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "projectsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "workEnabled" BOOLEAN NOT NULL DEFAULT true,
    "milestonesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "targetsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "attachmentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ
);
