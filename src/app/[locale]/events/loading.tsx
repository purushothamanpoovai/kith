import { getTranslations } from "next-intl/server";
import { RowsSkeleton, Skeleton, SkeletonGroup, SidebarSkeleton } from "@/components/ui/skeleton";

/**
 * /events loading state.
 *
 * The real page (src/app/[locale]/events/page.tsx) is a PageFrame with a
 * sidebar — a row of filter buttons, then upcoming events grouped by month
 * as a list of row-shaped cards (`EventCalendarList`) — not the generic
 * card grid.
 */
export default async function EventsLoading() {
  const t = await getTranslations("states");

  return (
    <SkeletonGroup label={t("loadingLabel")}>
      <div className="ds-page-mast ds-page-mast--split">
        <div>
          <Skeleton variant="text" width="7rem" />
          <Skeleton variant="title" width="min(24rem, 70%)" height="2.2rem" />
          <Skeleton variant="text" width="min(36rem, 90%)" />
        </div>
        <div className="ds-page-mast__actions">
          <Skeleton variant="text" width="7rem" height="2rem" />
        </div>
      </div>
      <div className="ds-columns">
        <div className="ds-columns__main">
          <div className="ds-row ds-row--tight" style={{ marginBlockEnd: "var(--ds-space-5)" }}>
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} variant="text" width="6rem" height="2rem" />
            ))}
          </div>
          <Skeleton variant="text" width="30%" style={{ marginBlockEnd: "var(--ds-space-3)" }} />
          <RowsSkeleton rows={5} />
        </div>
        <SidebarSkeleton />
      </div>
    </SkeletonGroup>
  );
}
