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

    -- 'pending', 'active', 'archived'
    status TEXT NOT NULL DEFAULT 'pending'
);
