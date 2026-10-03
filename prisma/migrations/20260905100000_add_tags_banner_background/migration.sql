-- Free-text tags for search/categorisation. Kept separate from Scope, which
-- carries audience/authorisation and is derived from the author.
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tag_slug_key" ON "Tag"("slug");
CREATE INDEX IF NOT EXISTS "Tag_slug_idx" ON "Tag"("slug");

CREATE TABLE IF NOT EXISTS "ContentTag" (
    "contentId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "ContentTag_pkey" PRIMARY KEY ("contentId","tagId")
);

CREATE INDEX IF NOT EXISTS "ContentTag_tagId_idx" ON "ContentTag"("tagId");

ALTER TABLE "ContentTag" DROP CONSTRAINT IF EXISTS "ContentTag_contentId_fkey";
ALTER TABLE "ContentTag" ADD CONSTRAINT "ContentTag_contentId_fkey"
    FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentTag" DROP CONSTRAINT IF EXISTS "ContentTag_tagId_fkey";
ALTER TABLE "ContentTag" ADD CONSTRAINT "ContentTag_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Optional wide banner + decorative background preset key.
ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "bannerImage" TEXT;
ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "backgroundPreset" TEXT;
