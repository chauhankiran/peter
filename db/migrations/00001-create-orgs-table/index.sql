CREATE TABLE orgs (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,

    -- Audit
    "createdBy" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedBy" BIGINT,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

    "isActive" BOOLEAN NOT NULL DEFAULT true
);
