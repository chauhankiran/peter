CREATE TABLE "invites" (
    id BIGSERIAL PRIMARY KEY,

    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT,

    email TEXT NOT NULL,

    token TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,

    status TEXT NOT NULL DEFAULT 'invited',
    role TEXT NOT NULL DEFAULT 'member',

    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "updatedBy" BIGINT,

    "acceptedAt" TIMESTAMPTZ,

    "invitedUserId" BIGINT
);
