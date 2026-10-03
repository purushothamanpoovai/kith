-- Roles, organizations, content ownership, audit log

-- New enum values on UserRole
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'content_publisher';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'super_admin';

-- New enums
CREATE TYPE "OrganizationKind" AS ENUM (
  'temple', 'church', 'mosque', 'monastery', 'ashram', 'trust',
  'spiritual_center', 'religious_school', 'foundation', 'heritage_org',
  'community', 'pilgrimage_org', 'devotional_music_org', 'other'
);

CREATE TYPE "OrganizationStatus" AS ENUM ('pending', 'verified', 'rejected', 'suspended');

CREATE TYPE "OrganizationPublishMode" AS ENUM ('immediate', 'admin_approval', 'editor_workflow');

CREATE TYPE "OrganizationMemberRole" AS ENUM (
  'org_admin', 'content_moderator', 'event_manager', 'media_manager', 'translator'
);

CREATE TYPE "ContentOrigin" AS ENUM ('community', 'official');

CREATE TYPE "ScopeModeratorPermission" AS ENUM ('publish', 'edit', 'moderate');

-- Extend subscription target type
ALTER TYPE "SubscriptionTargetType" ADD VALUE IF NOT EXISTS 'organization';

-- Organization
CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" JSONB NOT NULL,
  "description" JSONB,
  "kind" "OrganizationKind" NOT NULL,
  "status" "OrganizationStatus" NOT NULL DEFAULT 'pending',
  "publishMode" "OrganizationPublishMode" NOT NULL DEFAULT 'admin_approval',
  "verifiedAt" TIMESTAMP(3),
  "logoPath" TEXT,
  "coverImage" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "website" TEXT,
  "location" JSONB,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_status_idx" ON "Organization"("status");
CREATE INDEX "Organization_kind_idx" ON "Organization"("kind");

ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Organization membership
CREATE TABLE "OrganizationMembership" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "OrganizationMemberRole" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key"
  ON "OrganizationMembership"("organizationId", "userId");
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");

ALTER TABLE "OrganizationMembership"
  ADD CONSTRAINT "OrganizationMembership_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationMembership"
  ADD CONSTRAINT "OrganizationMembership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Organization scopes
CREATE TABLE "OrganizationScope" (
  "organizationId" TEXT NOT NULL,
  "scopeId" TEXT NOT NULL,
  CONSTRAINT "OrganizationScope_pkey" PRIMARY KEY ("organizationId", "scopeId")
);

CREATE INDEX "OrganizationScope_scopeId_idx" ON "OrganizationScope"("scopeId");

ALTER TABLE "OrganizationScope"
  ADD CONSTRAINT "OrganizationScope_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrganizationScope"
  ADD CONSTRAINT "OrganizationScope_scopeId_fkey"
  FOREIGN KEY ("scopeId") REFERENCES "Scope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Audit log
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "organizationId" TEXT,
  "scopeId" TEXT,
  "previousState" JSONB,
  "newState" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Content ownership columns
ALTER TABLE "Content" ADD COLUMN "origin" "ContentOrigin" NOT NULL DEFAULT 'community';
ALTER TABLE "Content" ADD COLUMN "publishedById" TEXT;
ALTER TABLE "Content" ADD COLUMN "ownerUserId" TEXT;
ALTER TABLE "Content" ADD COLUMN "ownerOrganizationId" TEXT;

UPDATE "Content"
SET
  "publishedById" = "authorId",
  "ownerUserId" = "authorId"
WHERE "publishedById" IS NULL;

CREATE INDEX "Content_ownerOrganizationId_idx" ON "Content"("ownerOrganizationId");
CREATE INDEX "Content_ownerUserId_idx" ON "Content"("ownerUserId");
CREATE INDEX "Content_origin_idx" ON "Content"("origin");

ALTER TABLE "Content"
  ADD CONSTRAINT "Content_publishedById_fkey"
  FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Content"
  ADD CONSTRAINT "Content_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Content"
  ADD CONSTRAINT "Content_ownerOrganizationId_fkey"
  FOREIGN KEY ("ownerOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Event organization
ALTER TABLE "Event" ADD COLUMN "organizationId" TEXT;
CREATE INDEX "Event_organizationId_idx" ON "Event"("organizationId");

ALTER TABLE "Event"
  ADD CONSTRAINT "Event_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Subscription organization
ALTER TABLE "Subscription" ADD COLUMN "organizationId" TEXT;
CREATE UNIQUE INDEX "Subscription_userId_organizationId_key"
  ON "Subscription"("userId", "organizationId")
  WHERE "organizationId" IS NOT NULL;

ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Scope moderator extensions
ALTER TABLE "ScopeModerator" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "ScopeModerator" ADD COLUMN "permissions" "ScopeModeratorPermission"[] DEFAULT ARRAY['publish', 'edit', 'moderate']::"ScopeModeratorPermission"[];

CREATE INDEX "ScopeModerator_organizationId_idx" ON "ScopeModerator"("organizationId");

ALTER TABLE "ScopeModerator"
  ADD CONSTRAINT "ScopeModerator_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Promote bootstrap admin to super_admin
UPDATE "User" SET "role" = 'super_admin' WHERE "role" = 'admin';
