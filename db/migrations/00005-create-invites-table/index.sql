CREATE TABLE "invites" (
  id BIGSERIAL PRIMARY KEY,

  "orgId" BIGINT NOT NULL,
  "projectId" BIGINT,

  "email" TEXT NOT NULL,

  "token" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,

  "status" TEXT NOT NULL DEFAULT 'invited', -- invited | accepted | revoked | expired

  "role" TEXT NOT NULL DEFAULT 'member', -- optional: owner | admin | member

  -- Audit
  "createdBy" BIGINT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedBy" BIGINT,
  "updatedAt" TIMESTAMPTZ,

  -- Acceptance
  "acceptedAt" TIMESTAMPTZ,
  "invitedUserId" BIGINT
);
