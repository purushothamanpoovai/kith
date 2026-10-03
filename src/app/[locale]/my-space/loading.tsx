import { getTranslations } from "next-intl/server";
import {
  CardSkeleton,
  RowsSkeleton,
  Skeleton,
  SkeletonGroup,
  SidebarSkeleton,
} from "@/components/ui/skeleton";

/**
 * /my-space loading state.
 *
 * The real page (src/app/[locale]/my-space/page.tsx) is a PageFrame with a
 * sidebar (the following panel) and several stacked sections — a "for you"
 * two-column grid, a continue-listening band, a saved grid, and an events
 * list — rather than the generic single 6-card grid.
 */
export default async function MySpaceLoading() {
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
          <Skeleton variant="text" width="9rem" height="2rem" />
        </div>
      </div>
      <div className="ds-columns">
        <div className="ds-columns__main">
          <Skeleton variant="text" width="25%" style={{ marginBlockEnd: "var(--ds-space-3)" }} />
          <div className="ds-grid ds-grid--2">
            {Array.from({ length: 2 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>

          <Skeleton
            variant="text"
            width="30%"
            style={{ marginBlockStart: "var(--ds-space-7)", marginBlockEnd: "var(--ds-space-3)" }}
          />
          <Skeleton variant="block" height="7rem" />

          <Skeleton
            variant="text"
            width="20%"
            style={{ marginBlockStart: "var(--ds-space-7)", marginBlockEnd: "var(--ds-space-3)" }}
          />
          <div className="ds-grid">
            {Array.from({ length: 3 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>

          <Skeleton
            variant="text"
            width="25%"
            style={{ marginBlockStart: "var(--ds-space-7)", marginBlockEnd: "var(--ds-space-3)" }}
          />
          <RowsSkeleton rows={3} />
        </div>
        <SidebarSkeleton />
      </div>
    </SkeletonGroup>
  );
}
