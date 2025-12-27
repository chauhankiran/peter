CREATE TABLE "userOrgs" (
    id BIGSERIAL PRIMARY KEY,

    "userId" BIGINT NOT NULL,
    "orgId" BIGINT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member', -- owner | admin | member

    -- Audit
    "createdBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,

    "isActive" BOOLEAN NOT NULL DEFAULT true,
  
    UNIQUE ("userId", "orgId")
);
