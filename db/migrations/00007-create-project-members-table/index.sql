CREATE TABLE "projectMembers" (
    "projectId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    
    -- Member role
    role TEXT NOT NULL DEFAULT 'member', -- owner | admin | member
    
    -- Audit fields
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,
    
    -- Constraints
    PRIMARY KEY ("projectId", "userId")
);