-- Phase 2-5: content, community, subscriptions

CREATE TYPE "ContentType" AS ENUM ('article', 'post', 'poem', 'audio', 'video', 'oral_history');
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'pending_review', 'published', 'hidden', 'archived');
CREATE TYPE "ContentVisibility" AS ENUM ('public', 'followers', 'community', 'private');
CREATE TYPE "ContentLabel" AS ENUM ('personal_reflection', 'historical_account', 'community_tradition', 'translation', 'commentary', 'educational', 'archival', 'opinion');
CREATE TYPE "SubscriptionTargetType" AS ENUM ('scope', 'author');
CREATE TYPE "ReactionKind" AS ENUM ('heart', 'pray', 'sparkle', 'dove', 'blossom');
CREATE TYPE "FeedSignalKind" AS ENUM ('less_author', 'less_topic', 'less_scope', 'less_region', 'broader');

CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'published',
    "visibility" "ContentVisibility" NOT NULL DEFAULT 'public',
    "contentLabel" "ContentLabel",
    "title" JSONB NOT NULL,
    "summary" JSONB,
    "body" JSONB,
    "blocks" JSONB,
    "authorId" TEXT NOT NULL,
    "originalLanguage" TEXT NOT NULL,
    "coverImage" TEXT,
    "readingMinutes" INTEGER,
    "mediaUrl" TEXT,
    "durationSeconds" INTEGER,
    "transcript" JSONB,
    "originalText" JSONB,
    "transliteration" JSONB,
    "translation" JSONB,
    "trendingScore" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentScope" (
    "contentId" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,

    CONSTRAINT "ContentScope_pkey" PRIMARY KEY ("contentId","scopeId")
);

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "SubscriptionTargetType" NOT NULL,
    "scopeId" TEXT,
    "authorId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notify" BOOLEAN NOT NULL DEFAULT true,
    "feedPriority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Bookmark" (
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("userId","contentId")
);

CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "kind" "ReactionKind" NOT NULL DEFAULT 'heart',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Repost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeedSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "FeedSignalKind" NOT NULL,
    "scopeId" TEXT,
    "authorId" TEXT,
    "contentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedSignal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Content_slug_key" ON "Content"("slug");
CREATE INDEX "Content_type_status_idx" ON "Content"("type", "status");
CREATE INDEX "Content_authorId_idx" ON "Content"("authorId");
CREATE INDEX "Content_publishedAt_idx" ON "Content"("publishedAt");
CREATE INDEX "ContentScope_scopeId_idx" ON "ContentScope"("scopeId");
CREATE UNIQUE INDEX "Subscription_userId_scopeId_key" ON "Subscription"("userId", "scopeId");
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE UNIQUE INDEX "Reaction_userId_contentId_key" ON "Reaction"("userId", "contentId");
CREATE INDEX "Reaction_contentId_idx" ON "Reaction"("contentId");
CREATE INDEX "Comment_contentId_idx" ON "Comment"("contentId");
CREATE UNIQUE INDEX "Repost_userId_contentId_key" ON "Repost"("userId", "contentId");
CREATE INDEX "FeedSignal_userId_idx" ON "FeedSignal"("userId");

ALTER TABLE "Content" ADD CONSTRAINT "Content_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentScope" ADD CONSTRAINT "ContentScope_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentScope" ADD CONSTRAINT "ContentScope_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "Scope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "Scope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Repost" ADD CONSTRAINT "Repost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Repost" ADD CONSTRAINT "Repost_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedSignal" ADD CONSTRAINT "FeedSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
