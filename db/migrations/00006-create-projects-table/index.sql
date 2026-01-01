CREATE TABLE "projects" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    
    -- Project status
    "status" TEXT NOT NULL DEFAULT 'active', -- active | archived | completed
    "completedDetails" TEXT,
    
    -- Timeline
    "dueDate" TIMESTAMPTZ,
    
    -- Audit fields
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE ("orgId", key)
);