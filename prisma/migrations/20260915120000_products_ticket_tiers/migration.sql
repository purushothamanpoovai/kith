-- Product catalogue (organization-owned, external purchase link only) and
-- event ticket tiers (named, capacity-capped access, no payment). Additive
-- only: no column is dropped or retyped.

CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "imageUrl" TEXT,
    "price" TEXT,
    "purchaseUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Product_organizationId_idx"
    ON "Product"("organizationId");

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_organizationId_fkey";
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "EventTicketTier" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "capacity" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventTicketTier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EventTicketTier_eventId_idx"
    ON "EventTicketTier"("eventId");

ALTER TABLE "EventTicketTier" DROP CONSTRAINT IF EXISTS "EventTicketTier_eventId_fkey";
ALTER TABLE "EventTicketTier" ADD CONSTRAINT "EventTicketTier_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Rsvp" ADD COLUMN IF NOT EXISTS "tierId" TEXT;

CREATE INDEX IF NOT EXISTS "Rsvp_tierId_idx"
    ON "Rsvp"("tierId");

ALTER TABLE "Rsvp" DROP CONSTRAINT IF EXISTS "Rsvp_tierId_fkey";
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_tierId_fkey"
    FOREIGN KEY ("tierId") REFERENCES "EventTicketTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
