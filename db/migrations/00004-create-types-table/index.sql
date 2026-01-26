CREATE TABLE "types" (
    id BIGSERIAL PRIMARY KEY,

    "projectId" BIGINT NOT NULL,
    name TEXT NOT NULL,

    sequence BIGINT,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT
);
