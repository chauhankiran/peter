-- Organizations
CREATE TABLE "orgs" (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- Users
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

-- User Organizations (junction table)
CREATE TABLE "userOrgs" (
    id BIGSERIAL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    "orgId" BIGINT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    "createdBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedBy" BIGINT,
    "updatedAt" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- Email Verification Tokens
CREATE TABLE "emailVerificationTokens" (
    id BIGSERIAL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    token TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "usedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invites
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

-- Projects
CREATE TABLE "projects" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    "avatarUrl" TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    "completedDetails" TEXT,
    "dueDate" TIMESTAMPTZ,
    "milestonesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "targetsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ
);

-- Project Members
CREATE TABLE "projectMembers" (
    id BIGSERIAL PRIMARY KEY,
    "projectId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ
);

-- Statuses
CREATE TABLE "statuses" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,
    name TEXT NOT NULL,
    sequence INT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ
);

-- Priorities
CREATE TABLE "priorities" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,
    name TEXT NOT NULL,
    sequence INT NOT NULL,
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ
);

-- Targets
CREATE TABLE "targets" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    "dueDate" TIMESTAMPTZ,
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- Milestones
CREATE TABLE "milestones" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,
    "targetId" BIGINT,
    name TEXT NOT NULL,
    description TEXT,
    "dueDate" TIMESTAMPTZ,
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- Work
CREATE TABLE "work" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    "statusId" BIGINT NOT NULL,
    "priorityId" BIGINT NOT NULL,
    "milestoneId" BIGINT,
    "targetId" BIGINT,
    "assigneeId" BIGINT,
    "reporterId" BIGINT NOT NULL,
    "dueDate" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- Comments
CREATE TABLE "comments" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "workId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    body TEXT NOT NULL,
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- Attachments
CREATE TABLE "attachments" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "workId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- Organization Permissions
CREATE TABLE "orgPermissions" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "projectsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "workEnabled" BOOLEAN NOT NULL DEFAULT true,
    "milestonesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "targetsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "attachmentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ
);

-- User Permissions
CREATE TABLE "userPermissions" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "projectsCreate" BOOLEAN NOT NULL DEFAULT true,
    "projectsRead" BOOLEAN NOT NULL DEFAULT true,
    "projectsUpdate" BOOLEAN NOT NULL DEFAULT true,
    "projectsDelete" BOOLEAN NOT NULL DEFAULT true,
    "workCreate" BOOLEAN NOT NULL DEFAULT true,
    "workRead" BOOLEAN NOT NULL DEFAULT true,
    "workUpdate" BOOLEAN NOT NULL DEFAULT true,
    "workDelete" BOOLEAN NOT NULL DEFAULT true,
    "milestonesCreate" BOOLEAN NOT NULL DEFAULT false,
    "milestonesRead" BOOLEAN NOT NULL DEFAULT true,
    "milestonesUpdate" BOOLEAN NOT NULL DEFAULT false,
    "milestonesDelete" BOOLEAN NOT NULL DEFAULT false,
    "targetsCreate" BOOLEAN NOT NULL DEFAULT false,
    "targetsRead" BOOLEAN NOT NULL DEFAULT true,
    "targetsUpdate" BOOLEAN NOT NULL DEFAULT false,
    "targetsDelete" BOOLEAN NOT NULL DEFAULT false,
    "commentsCreate" BOOLEAN NOT NULL DEFAULT true,
    "commentsRead" BOOLEAN NOT NULL DEFAULT true,
    "commentsUpdate" BOOLEAN NOT NULL DEFAULT true,
    "commentsDelete" BOOLEAN NOT NULL DEFAULT true,
    "attachmentsCreate" BOOLEAN NOT NULL DEFAULT true,
    "attachmentsRead" BOOLEAN NOT NULL DEFAULT true,
    "attachmentsUpdate" BOOLEAN NOT NULL DEFAULT true,
    "attachmentsDelete" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ
);
