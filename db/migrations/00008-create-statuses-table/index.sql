CREATE TABLE "statuses" (
    id BIGSERIAL PRIMARY KEY,

    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,
    
    name TEXT NOT NULL,
    sequence INT NOT NULL,
    
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ
);
