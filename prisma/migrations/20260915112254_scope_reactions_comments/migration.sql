-- CreateEnum
CREATE TYPE "CommunityTargetType" AS ENUM ('content', 'scope');

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "scopeId" TEXT,
ADD COLUMN     "targetType" "CommunityTargetType" NOT NULL DEFAULT 'content',
ALTER COLUMN "contentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrganizationService" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Reaction" ADD COLUMN     "scopeId" TEXT,
ADD COLUMN     "targetType" "CommunityTargetType" NOT NULL DEFAULT 'content',
ALTER COLUMN "contentId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Comment_scopeId_idx" ON "Comment"("scopeId");

-- CreateIndex
CREATE INDEX "Reaction_scopeId_idx" ON "Reaction"("scopeId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_scopeId_key" ON "Reaction"("userId", "scopeId");

-- CreateIndex
CREATE INDEX "ScopeModerator_scopeId_idx" ON "ScopeModerator"("scopeId");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "Scope"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "Scope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
