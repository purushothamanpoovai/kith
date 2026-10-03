-- CreateEnum
CREATE TYPE "EmbedProvider" AS ENUM ('youtube', 'spotify', 'soundcloud');

-- AlterTable: drop self-hosted media fields, add validated embed fields
-- (§ low-liability curated reader, Phase 5: Kith never stores or serves a
-- self-hosted media file; mediaUrl/durationSeconds only ever held seed-data
-- placeholders, confirmed via code audit — no live upload path ever wrote to
-- them, so dropping them here is not a loss of any real production data).
ALTER TABLE "Content" DROP COLUMN "mediaUrl",
                      DROP COLUMN "durationSeconds",
                      ADD COLUMN "embedUrl" TEXT,
                      ADD COLUMN "embedProvider" "EmbedProvider";
