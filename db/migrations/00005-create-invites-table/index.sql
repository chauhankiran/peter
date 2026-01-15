CREATE TABLE "invites" (
    id BIGSERIAL PRIMARY KEY,

    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT,

    email TEXT NOT NULL,

    token TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,

    status TEXT NOT NULL DEFAULT 'invited',
    role TEXT NOT NULL DEFAULT 'member',

    "createdBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "acceptedAt" TIMESTAMPTZ,

    "invitedUserId" BIGINT
);
