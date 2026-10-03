import { getTranslations } from "next-intl/server";
import { RowsSkeleton, Skeleton, SkeletonGroup, SidebarSkeleton } from "@/components/ui/skeleton";

/**
 * /community loading state.
 *
 * The real page (src/app/[locale]/community/page.tsx) is a PageFrame with a
 * sidebar and a `.ds-river` of post cards, not the generic multi-column
 * card grid.
 */
export default async function CommunityLoading() {
  const t = await getTranslations("states");

  return (
    <SkeletonGroup label={t("loadingLabel")}>
      <div className="ds-page-mast">
        <Skeleton variant="text" width="7rem" />
        <Skeleton variant="title" width="min(24rem, 70%)" height="2.2rem" />
        <Skeleton variant="text" width="min(36rem, 90%)" />
      </div>
      <div className="ds-columns">
        <div className="ds-columns__main">
          <RowsSkeleton rows={6} />
        </div>
        <SidebarSkeleton />
      </div>
    </SkeletonGroup>
  );
}
