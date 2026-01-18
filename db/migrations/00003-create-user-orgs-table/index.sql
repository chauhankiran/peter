CREATE TABLE "userOrgs" (
    id BIGSERIAL PRIMARY KEY,

    "userId" BIGINT NOT NULL,
    "orgId" BIGINT NOT NULL,

    -- 'member', 'admin', 'owner'
    -- 'member' is a regular user of the organization
    -- 'admin' has elevated privileges to manage users and settings
    -- 'owner' has full control over the organization
    role TEXT NOT NULL DEFAULT 'member',

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT,

    -- 'active', 'deactivated', 'suspended', 'deleted'
    -- 'active' when membership is active
    -- 'deactivated' when membership is temporarily disabled
    -- 'suspended' when membership is suspended due to violations
    -- 'deleted' when membership is removed
    status TEXT NOT NULL DEFAULT 'active'
);
