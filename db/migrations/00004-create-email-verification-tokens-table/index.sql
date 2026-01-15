CREATE TABLE "emailVerificationTokens" (
    id BIGSERIAL PRIMARY KEY,

    "userId" BIGINT NOT NULL,

    token TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,

    "usedAt" TIMESTAMPTZ,

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
