import { getTranslations } from "next-intl/server";
import { RowsSkeleton, Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

/**
 * /admin/explore loading state — a single-column PageFrame with one editor
 * card per Explore section, taller than a plain admin row.
 */
export default async function AdminExploreLoading() {
  const t = await getTranslations("states");

  return (
    <SkeletonGroup label={t("loadingLabel")}>
      <div className="ds-page-mast">
        <Skeleton variant="text" width="7rem" />
        <Skeleton variant="title" width="min(24rem, 70%)" height="2.2rem" />
        <Skeleton variant="text" width="min(36rem, 90%)" />
      </div>
      <Skeleton variant="text" width="8rem" style={{ marginBlockEnd: "var(--ds-space-4)" }} />
      <RowsSkeleton rows={8} />
    </SkeletonGroup>
  );
}
