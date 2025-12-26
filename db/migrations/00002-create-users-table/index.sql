CREATE TABLE "users" (
    id BIGSERIAL PRIMARY KEY,

    "firstName" TEXT NOT NULL,
    "lastName"  TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,

    "isEmailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "verifiedAt" TIMESTAMPTZ,
  
    -- Audit
    "createdBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedBy" BIGINT,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

    "status" TEXT NOT NULL DEFAULT 'pending' -- pending | active | disabled
);
