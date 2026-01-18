CREATE TABLE "users" (
    id BIGSERIAL PRIMARY KEY,

    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar TEXT, -- URL to the user's avatar image

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT,

    -- 'pending', 'active', 'deactivated', 'suspended', 'deleted'
    -- 'pending' when user has registered but not verified email
    -- 'active' when user is actively using the account
    -- 'deactivated' when user has temporarily disabled the account
    -- 'suspended' when user is suspended due to violations or by admin
    -- 'deleted' when user is soft deleted / archived
    status TEXT NOT NULL DEFAULT 'pending'
);
