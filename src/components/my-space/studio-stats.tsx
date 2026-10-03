import { getTranslations } from "next-intl/server";
import type { StudioStats } from "@/services/studio-service";

/**
 * Studio's stat strip — a small, real number set (§ Studio tab). Deliberately
 * not a dashboard: published total, what needs attention (draft +
 * pending_review), what moved this week, and — only when it applies — how
 * many organizations the count spans. The last tile omits itself for anyone
 * who only publishes as an individual, same "don't show empty" rule as the
 * chip rails.
 */
export async function StudioStatsStrip({ stats }: { stats: StudioStats }) {
  const t = await getTranslations("mySpace.studio");

  return (
    <div className="ds-stats">
      <div className="ds-stat">
        <span className="ds-stat__value">{stats.publishedCount}</span>
        <span className="ds-stat__label">{t("statPublished")}</span>
      </div>
      <div className="ds-stat">
        <span className="ds-stat__value">{stats.needsAttentionCount}</span>
        <span className="ds-stat__label">{t("statNeedsAttention")}</span>
      </div>
      <div className="ds-stat">
        <span className="ds-stat__value">{stats.updatedThisWeekCount}</span>
        <span className="ds-stat__label">{t("statUpdatedThisWeek")}</span>
      </div>
      {stats.organizationCount > 0 ? (
        <div className="ds-stat">
          <span className="ds-stat__value">{stats.organizationCount}</span>
          <span className="ds-stat__label">
            {t("statOrganizations", { count: stats.organizationCount })}
          </span>
        </div>
      ) : null}
    </div>
  );
}
