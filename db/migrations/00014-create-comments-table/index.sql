CREATE TABLE "comments" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "workId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    
    body TEXT NOT NULL,

    -- Audit fields
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,

    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT fk_comments_work FOREIGN KEY ("workId") REFERENCES "work"(id),
    CONSTRAINT fk_comments_user FOREIGN KEY ("userId") REFERENCES "users"(id)
);

CREATE INDEX idx_comments_work_id ON "comments"("workId");
CREATE INDEX idx_comments_user_id ON "comments"("userId");
