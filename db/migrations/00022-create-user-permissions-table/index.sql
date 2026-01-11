CREATE TABLE "userPermissions" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    
    -- User enabled/disabled within org
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,

    -- CRUD permissions for each module (bound by org-level permissions)
    "projectsCreate" BOOLEAN NOT NULL DEFAULT true,
    "projectsRead" BOOLEAN NOT NULL DEFAULT true,
    "projectsUpdate" BOOLEAN NOT NULL DEFAULT true,
    "projectsDelete" BOOLEAN NOT NULL DEFAULT true,

    "workCreate" BOOLEAN NOT NULL DEFAULT true,
    "workRead" BOOLEAN NOT NULL DEFAULT true,
    "workUpdate" BOOLEAN NOT NULL DEFAULT true,
    "workDelete" BOOLEAN NOT NULL DEFAULT true,

    "milestonesCreate" BOOLEAN NOT NULL DEFAULT false,
    "milestonesRead" BOOLEAN NOT NULL DEFAULT true,
    "milestonesUpdate" BOOLEAN NOT NULL DEFAULT false,
    "milestonesDelete" BOOLEAN NOT NULL DEFAULT false,

    "targetsCreate" BOOLEAN NOT NULL DEFAULT false,
    "targetsRead" BOOLEAN NOT NULL DEFAULT true,
    "targetsUpdate" BOOLEAN NOT NULL DEFAULT false,
    "targetsDelete" BOOLEAN NOT NULL DEFAULT false,

    "commentsCreate" BOOLEAN NOT NULL DEFAULT true,
    "commentsRead" BOOLEAN NOT NULL DEFAULT true,
    "commentsUpdate" BOOLEAN NOT NULL DEFAULT true,
    "commentsDelete" BOOLEAN NOT NULL DEFAULT true,

    "attachmentsCreate" BOOLEAN NOT NULL DEFAULT true,
    "attachmentsRead" BOOLEAN NOT NULL DEFAULT true,
    "attachmentsUpdate" BOOLEAN NOT NULL DEFAULT true,
    "attachmentsDelete" BOOLEAN NOT NULL DEFAULT true,

    -- Audit fields
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,

    CONSTRAINT fk_user_permissions_org FOREIGN KEY ("orgId") REFERENCES "orgs"(id),
    CONSTRAINT fk_user_permissions_user FOREIGN KEY ("userId") REFERENCES "users"(id),
    CONSTRAINT uq_user_permissions_org_user UNIQUE ("orgId", "userId")
);

CREATE INDEX idx_user_permissions_org_id ON "userPermissions"("orgId");
CREATE INDEX idx_user_permissions_user_id ON "userPermissions"("userId");
