CREATE TABLE "comments" (
    id BIGSERIAL PRIMARY KEY,

    "projectId" BIGINT NOT NULL,
    "workId" BIGINT NOT NULL,
    
    content TEXT NOT NULL,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT
);
