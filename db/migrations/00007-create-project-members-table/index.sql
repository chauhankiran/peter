CREATE TABLE "projectMembers" (
    id BIGSERIAL PRIMARY KEY,
    "projectId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ
);
