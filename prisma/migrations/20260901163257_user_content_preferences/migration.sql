-- CreateEnum
CREATE TYPE "ContentFocusMode" AS ENUM ('all', 'focused');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "contentFocusMode" "ContentFocusMode" NOT NULL DEFAULT 'all',
ADD COLUMN     "focusLanguageScopeId" TEXT,
ADD COLUMN     "focusRegionScopeId" TEXT,
ADD COLUMN     "focusReligionScopeId" TEXT;
