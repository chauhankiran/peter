CREATE TABLE "orgs" (
    id BIGSERIAL PRIMARY KEY,

    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT, -- URL to the organization's avatar image

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT,

    -- 'active', 'archived'
    status TEXT NOT NULL DEFAULT 'active'
);
