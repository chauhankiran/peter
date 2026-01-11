CREATE TABLE "users" (
    id BIGSERIAL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    email TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMPTZ,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending'
);
