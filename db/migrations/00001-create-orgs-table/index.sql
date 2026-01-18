CREATE TABLE "orgs" (
    id BIGSERIAL PRIMARY KEY,

    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT, -- URL to the organization's avatar image

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT,

    -- 'active', 'deactivated', 'suspended', 'deleted'
    -- 'active' when organization is actively used
    -- 'deactivated' when organization is temporarily disabled
    -- 'suspended' when organization is suspended due to violations
    -- 'deleted' when organization is soft deleted / archived
    status TEXT NOT NULL DEFAULT 'active'
);
