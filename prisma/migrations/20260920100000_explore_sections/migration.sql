-- Explore page sections, configurable by a super admin instead of hardcoded
-- in the component. Additive only: no column is dropped or retyped.

CREATE TABLE IF NOT EXISTS "ExploreSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scopeType" "ScopeType",
    "label" JSONB,
    "imageUrl" TEXT,
    "icon" TEXT,
    "href" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExploreSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExploreSection_key_key"
    ON "ExploreSection"("key");

CREATE INDEX IF NOT EXISTS "ExploreSection_active_sortOrder_idx"
    ON "ExploreSection"("active", "sortOrder");
