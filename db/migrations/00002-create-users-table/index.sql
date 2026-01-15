CREATE TABLE "users" (
    id BIGSERIAL PRIMARY KEY,

    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMPTZ,

    "createdBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    
    status TEXT NOT NULL DEFAULT 'pending'
);
