CREATE TABLE "emailVerificationTokens" (
    id BIGSERIAL PRIMARY KEY,

    "userId" BIGINT NOT NULL,

    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "expiresAt" TIMESTAMPTZ NOT NULL,

    "usedAt" TIMESTAMPTZ
);
