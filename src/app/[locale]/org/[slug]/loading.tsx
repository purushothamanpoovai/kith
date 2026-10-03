import { getTranslations } from "next-intl/server";
import { CardSkeleton, Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

/**
 * /org/[slug] loading state.
 *
 * The real page (src/app/[locale]/org/[slug]/page.tsx) has no PageFrame at
 * all: a full-width cover (`.ds-org-cover`), then `.ds-org-head` (crest +
 * title + facts), then stacked single-column sections (announcements,
 * articles, media, events) — quite different from the masthead-plus-grid
 * fallback, and from the hero+`.ds-columns` shape of a scope detail page.
 */
export default async function OrganizationLoading() {
  const t = await getTranslations("states");

  return (
    <SkeletonGroup label={t("loadingLabel")}>
      <Skeleton variant="cover" className="ds-org-cover" />
      <header className="ds-org-head">
        <div className="ds-org-head__row">
          <Skeleton variant="avatar" width="5rem" height="5rem" className="ds-org-head__crest" />
          <div style={{ display: "grid", gap: "var(--ds-space-3)", flex: 1 }}>
            <Skeleton variant="text" width="8rem" height="1.5rem" />
            <Skeleton variant="title" width="min(20rem, 60%)" height="2rem" />
            <Skeleton variant="text" width="10rem" height="2rem" />
          </div>
        </div>
        <Skeleton variant="text" width="90%" style={{ marginBlockStart: "var(--ds-space-4)" }} />
        <Skeleton variant="text" width="70%" />
      </header>

      <div
        className="ds-stack ds-stack--lg"
        style={{ marginBlockStart: "var(--ds-space-7)" }}
      >
        <div>
          <Skeleton variant="text" width="30%" style={{ marginBlockEnd: "var(--ds-space-3)" }} />
          <div className="ds-grid ds-grid--2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
        <div>
          <Skeleton variant="text" width="25%" style={{ marginBlockEnd: "var(--ds-space-3)" }} />
          <div className="ds-grid">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    </SkeletonGroup>
  );
}
