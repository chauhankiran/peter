CREATE TABLE "projects" (
    id BIGSERIAL PRIMARY KEY,

    name TEXT NOT NULL,
    "dueDate" TIMESTAMPTZ,
    description TEXT,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT
);
