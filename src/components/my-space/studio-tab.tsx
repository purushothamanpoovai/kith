import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui/section";
import { StudioStatsStrip } from "@/components/my-space/studio-stats";
import { StudioOrganizations } from "@/components/my-space/studio-organizations";
import { StudioContentTable } from "@/components/my-space/studio-content-table";
import {
  StudioOrgFilters,
  StudioStatusFilters,
  StudioTypeFilters,
} from "@/components/my-space/studio-filters";
import type { AuthUser } from "@/domain/auth/types";
import {
  computeStudioStats,
  countStudioStatuses,
  listStudioItems,
  loadStudioOrganizations,
  type StudioTypeFilter,
} from "@/services/studio-service";
import type { ContentStatus, ContentType } from "@/generated/prisma/client";

const CONTENT_TYPE_FILTERS: ContentType[] = ["article", "post"];
const STATUS_VALUES: ContentStatus[] = [
  "draft",
  "pending_review",
  "published",
  "hidden",
  "archived",
  "rejected",
  "removed",
];

/**
 * The Studio tab (§ Studio tab). Everything a publisher/organizer needs to
 * see at a glance about their own authored work and what they administer —
 * the gap the reader-only My Space left unfilled.
 */
export async function StudioTab({
  user,
  locale,
  filters,
}: {
  user: AuthUser;
  locale: string;
  filters: { type?: string; status?: string; org?: string };
}) {
  const t = await getTranslations("mySpace.studio");

  const { organizations, scopeAssignments } = await loadStudioOrganizations(user, locale);

  const activeType = filters.type ?? "all";
  const activeStatus = filters.status ?? "all";
  const activeOrg = organizations.length > 1 ? filters.org ?? "all" : "all";

  const typeFilter: StudioTypeFilter[] | undefined =
    activeType !== "all" && (CONTENT_TYPE_FILTERS.includes(activeType as ContentType) || activeType === "event")
      ? [activeType as StudioTypeFilter]
      : undefined;
  const statusFilter: ContentStatus[] | undefined =
    activeStatus !== "all" && STATUS_VALUES.includes(activeStatus as ContentStatus)
      ? [activeStatus as ContentStatus]
      : undefined;
  const orgFilter: string[] | undefined = activeOrg !== "all" ? [activeOrg] : undefined;

  // The stat strip and the type-chip counts must reflect every authored item
  // regardless of the filters currently applied — only the table itself is
  // filtered — so it is queried separately from the (possibly narrowed) list below.
  const [allItems, filteredItems, statusCounts] = await Promise.all([
    listStudioItems(user.id, locale),
    listStudioItems(user.id, locale, {
      types: typeFilter,
      statuses: statusFilter,
      organizationIds: orgFilter,
    }),
    countStudioStatuses(user.id),
  ]);

  const typeCounts: Record<string, number> = {};
  for (const item of allItems) {
    const key = item.kind === "event" ? "event" : item.contentType;
    typeCounts[key] = (typeCounts[key] ?? 0) + 1;
  }

  const stats = computeStudioStats(allItems, organizations.length);

  return (
    <div className="ds-stack">
      <StudioStatsStrip stats={stats} />

      <Section title={t("organizationsTitle")} lede={t("organizationsLede")}>
        <StudioOrganizations organizations={organizations} scopeAssignments={scopeAssignments} />
      </Section>

      <Section title={t("contentTitle")} lede={t("contentLede")}>
        <div className="ds-stack ds-stack--sm">
          <StudioTypeFilters active={activeType} counts={typeCounts} current={filters} />
          <StudioStatusFilters active={activeStatus} counts={statusCounts} current={filters} />
          <StudioOrgFilters active={activeOrg} organizations={organizations} current={filters} />
        </div>
        <StudioContentTable items={filteredItems} locale={locale} />
      </Section>
    </div>
  );
}
