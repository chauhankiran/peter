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

    -- Audit fields
    "createdBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT fk_attachments_work FOREIGN KEY ("workId") REFERENCES "work"(id),
    CONSTRAINT fk_attachments_user FOREIGN KEY ("userId") REFERENCES "users"(id)
);

CREATE INDEX idx_attachments_work_id ON "attachments"("workId");
