CREATE TABLE "orgUsers" (
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

    -- 'active', 'archived'
    status TEXT NOT NULL DEFAULT 'active'
);
