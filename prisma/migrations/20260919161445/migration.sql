/*
  Warnings:

  - The values [translator] on the enum `OrganizationMemberRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrganizationMemberRole_new" AS ENUM ('org_admin', 'content_moderator', 'event_manager', 'media_manager');
ALTER TABLE "OrganizationMembership" ALTER COLUMN "role" TYPE "OrganizationMemberRole_new" USING ("role"::text::"OrganizationMemberRole_new");
ALTER TYPE "OrganizationMemberRole" RENAME TO "OrganizationMemberRole_old";
ALTER TYPE "OrganizationMemberRole_new" RENAME TO "OrganizationMemberRole";
DROP TYPE "public"."OrganizationMemberRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "EventTicketTier" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "updatedAt" DROP DEFAULT;
