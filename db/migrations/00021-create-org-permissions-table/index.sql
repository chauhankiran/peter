CREATE TABLE "orgPermissions" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL UNIQUE,
    
    -- Module-level toggles (enable/disable entire modules for the org)
    "projectsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "workEnabled" BOOLEAN NOT NULL DEFAULT true,
    "milestonesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "targetsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "attachmentsEnabled" BOOLEAN NOT NULL DEFAULT true,

    -- Audit fields
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,

    CONSTRAINT fk_org_permissions_org FOREIGN KEY ("orgId") REFERENCES "orgs"(id)
);

CREATE INDEX idx_org_permissions_org_id ON "orgPermissions"("orgId");
