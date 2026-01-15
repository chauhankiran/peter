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
