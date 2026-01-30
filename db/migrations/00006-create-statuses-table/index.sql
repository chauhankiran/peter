CREATE TABLE "statuses" (
    id BIGSERIAL PRIMARY KEY,

    "projectId" BIGINT NOT NULL,
    name TEXT NOT NULL,

    sequence BIGINT,

    "isDone" BOOLEAN NOT NULL DEFAULT FALSE,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT
);
