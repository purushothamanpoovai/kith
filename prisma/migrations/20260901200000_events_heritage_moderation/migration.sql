-- Phases 6-8: events, heritage, moderation

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'scope_moderator';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'community_moderator';
ALTER TYPE "ContentStatus" ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE "ContentStatus" ADD VALUE IF NOT EXISTS 'removed';
ALTER TYPE "ContentVisibility" ADD VALUE IF NOT EXISTS 'family';

CREATE TYPE "EventKind" AS ENUM ('festival', 'gathering', 'lecture', 'music', 'prayer', 'memorial', 'charity', 'online', 'other');
CREATE TYPE "EventVisibility" AS ENUM ('public', 'community', 'invite_only', 'private');
CREATE TYPE "RsvpMode" AS ENUM ('open', 'invite_only', 'closed');
CREATE TYPE "RsvpStatus" AS ENUM ('going', 'maybe', 'not_going');
CREATE TYPE "HeritageArchiveTier" AS ENUM ('private', 'family', 'community', 'public');
CREATE TYPE "MediaRights" AS ENUM ('contributor_created', 'permission_granted', 'public_domain', 'traditional_knowledge', 'rights_uncertain');
CREATE TYPE "ReportTargetType" AS ENUM ('content', 'event', 'user', 'comment');
CREATE TYPE "ReportReason" AS ENUM ('harassment', 'hate', 'misinformation', 'spam', 'copyright', 'impersonation', 'inappropriate', 'dangerous_advice', 'privacy', 'other');
CREATE TYPE "ReportStatus" AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
CREATE TYPE "ModerationActionKind" AS ENUM ('hide', 'remove', 'warn', 'escalate', 'restore', 'dismiss_report');

CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "EventKind" NOT NULL DEFAULT 'gathering',
    "title" JSONB NOT NULL,
    "description" JSONB,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "venueName" JSONB,
    "venueAddress" JSONB,
    "onlineUrl" TEXT,
    "coverImage" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "organizerId" TEXT NOT NULL,
    "visibility" "EventVisibility" NOT NULL DEFAULT 'public',
    "rsvpMode" "RsvpMode" NOT NULL DEFAULT 'open',
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventScope" (
    "eventId" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,

    CONSTRAINT "EventScope_pkey" PRIMARY KEY ("eventId","scopeId")
);

CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coverImage" TEXT,
    "hostName" TEXT NOT NULL,
    "message" JSONB,
    "shareToken" TEXT,
    "visibility" "EventVisibility" NOT NULL DEFAULT 'public',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Rsvp" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL DEFAULT 'going',
    "guestCount" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HeritageLineage" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "recordedByName" TEXT,
    "originallyToldBy" TEXT,
    "location" JSONB,
    "approximatePeriod" TEXT,
    "sourceNote" TEXT,
    "rights" "MediaRights" NOT NULL DEFAULT 'contributor_created',
    "archiveTier" "HeritageArchiveTier" NOT NULL DEFAULT 'community',
    "contributorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeritageLineage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "explanation" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'open',
    "scopeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "reportId" TEXT,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "kind" "ModerationActionKind" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScopeModerator" (
    "userId" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScopeModerator_pkey" PRIMARY KEY ("userId","scopeId")
);

CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");
CREATE INDEX "EventScope_scopeId_idx" ON "EventScope"("scopeId");
CREATE UNIQUE INDEX "Invitation_eventId_key" ON "Invitation"("eventId");
CREATE UNIQUE INDEX "Invitation_slug_key" ON "Invitation"("slug");
CREATE UNIQUE INDEX "Invitation_shareToken_key" ON "Invitation"("shareToken");
CREATE UNIQUE INDEX "Rsvp_eventId_userId_key" ON "Rsvp"("eventId", "userId");
CREATE INDEX "Rsvp_eventId_idx" ON "Rsvp"("eventId");
CREATE UNIQUE INDEX "HeritageLineage_contentId_key" ON "HeritageLineage"("contentId");
CREATE INDEX "Report_status_idx" ON "Report"("status");
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");
CREATE INDEX "ModerationAction_moderatorId_idx" ON "ModerationAction"("moderatorId");
CREATE INDEX "ModerationAction_reportId_idx" ON "ModerationAction"("reportId");

ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventScope" ADD CONSTRAINT "EventScope_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventScope" ADD CONSTRAINT "EventScope_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "Scope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HeritageLineage" ADD CONSTRAINT "HeritageLineage_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScopeModerator" ADD CONSTRAINT "ScopeModerator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScopeModerator" ADD CONSTRAINT "ScopeModerator_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "Scope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
