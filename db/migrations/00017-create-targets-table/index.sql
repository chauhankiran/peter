CREATE TABLE "targets" (
    id BIGSERIAL PRIMARY KEY,
    "orgId" BIGINT NOT NULL,
    "projectId" BIGINT NOT NULL,
    
    name TEXT NOT NULL,
    description TEXT,
    "dueDate" TIMESTAMPTZ,

    -- Audit fields
    "createdBy" BIGINT,
    "updatedBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ,

    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT fk_targets_project FOREIGN KEY ("projectId") REFERENCES "projects"(id)
);

CREATE INDEX idx_targets_project_id ON "targets"("projectId");
