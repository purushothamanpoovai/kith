import { getTranslations } from "next-intl/server";
import {
  CardSkeleton,
  HeroSkeleton,
  Skeleton,
  SkeletonGroup,
} from "@/components/ui/skeleton";

/**
 * /entities/[slug] loading state.
 *
 * Delegates to ScopeDetailPage (src/components/discovery/scope-detail-page.tsx),
 * which renders a `.ds-hero` band above a `.ds-columns` layout — related
 * scopes as a card grid in the main column, and a narrow follower widget in
 * the aside — nothing like the generic masthead-plus-6-card-grid fallback.
 */
export default async function EntityLoading() {
  const t = await getTranslations("states");

  return (
    <SkeletonGroup label={t("loadingLabel")}>
      <HeroSkeleton />
      <div className="ds-columns">
        <div className="ds-columns__main">
          <Skeleton variant="text" width="25%" style={{ marginBlockEnd: "var(--ds-space-3)" }} />
          <div className="ds-grid">
            {Array.from({ length: 3 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
        <div className="ds-columns__aside">
          <div className="ds-widget">
            <Skeleton variant="text" width="55%" style={{ marginBlockEnd: "var(--ds-space-3)" }} />
            <div style={{ display: "flex", gap: "var(--ds-space-2)"}}>
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} variant="avatar" width="1.75rem" height="1.75rem" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonGroup>
  );
}
