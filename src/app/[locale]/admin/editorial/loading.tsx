import { getTranslations } from "next-intl/server";
import { Skeleton, SkeletonGroup, SidebarWidgetSkeleton } from "@/components/ui/skeleton";

/**
 * /admin/editorial loading state.
 *
 * A single-column PageFrame whose body is just the MagazineSidebar's widget
 * set (`.ds-editorial-preview`) — see
 * src/app/[locale]/admin/editorial/page.tsx — not a card grid.
 */
export default async function AdminEditorialLoading() {
  const t = await getTranslations("states");

  return (
    <SkeletonGroup label={t("loadingLabel")}>
      <div className="ds-page-mast">
        <Skeleton variant="text" width="7rem" />
        <Skeleton variant="title" width="min(24rem, 70%)" height="2.2rem" />
        <Skeleton variant="text" width="min(36rem, 90%)" />
      </div>
      <div className="ds-editorial-preview">
        <SidebarWidgetSkeleton rows={5} />
        <SidebarWidgetSkeleton rows={4} />
        <SidebarWidgetSkeleton rows={3} />
      </div>
    </SkeletonGroup>
  );
}
