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
