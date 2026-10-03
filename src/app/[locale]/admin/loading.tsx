import { getTranslations } from "next-intl/server";
import { RowsSkeleton, Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

/**
 * /admin loading state.
 *
 * A single-column PageFrame with a moderation queue (a list of report
 * rows), not a card grid — see src/app/[locale]/admin/page.tsx.
 */
export default async function AdminLoading() {
  const t = await getTranslations("states");

  return (
    <SkeletonGroup label={t("loadingLabel")}>
      <div className="ds-page-mast">
        <Skeleton variant="text" width="7rem" />
        <Skeleton variant="title" width="min(24rem, 70%)" height="2.2rem" />
        <Skeleton variant="text" width="min(36rem, 90%)" />
      </div>
      <div className="ds-row" style={{ marginBlockEnd: "var(--ds-space-5)" }}>
        <Skeleton variant="text" width="8rem" height="1.5rem" />
        <Skeleton variant="text" width="9rem" height="1.5rem" />
      </div>
      <RowsSkeleton rows={5} />
    </SkeletonGroup>
  );
}
