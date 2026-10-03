-- Organization visit-planning fields and recurring services.
-- Additive only: no column is dropped or retyped, so existing rows are
-- untouched and the pre-existing migration drift is not disturbed.

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'Asia/Kolkata';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "address" JSONB;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "howToReach" JSONB;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "dressCode" JSONB;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "entryRules" JSONB;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "accessibility" JSONB;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "donationUrl" TEXT;

-- Recurring services (mass / aarti / namaz / darshan windows).
CREATE TABLE IF NOT EXISTS "OrganizationService" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "dayOfWeek" INTEGER,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "note" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationService_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrganizationService_organizationId_idx"
    ON "OrganizationService"("organizationId");

ALTER TABLE "OrganizationService" DROP CONSTRAINT IF EXISTS "OrganizationService_organizationId_fkey";
ALTER TABLE "OrganizationService" ADD CONSTRAINT "OrganizationService_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
