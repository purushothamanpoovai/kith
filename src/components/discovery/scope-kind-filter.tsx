import { getTranslations } from "next-intl/server";
import { ContentCard } from "@/components/content/content-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ChipFilters } from "@/components/ui/tabs";
import type { ContentRecord } from "@/domain/content/types";
import { SCOPE_KIND_FILTERS, type ScopeKindFilter } from "@/services/feed-service";

/**
 * The kind-filter chip rail on a scope page (§ discovery unification).
 *
 * Media used to be its own top-level destination; now a visitor picks a
 * scope first (a religion, tradition, topic…) and filters what they see
 * inside it — articles, poems, media, heritage — the same way Quora/Reddit
 * let a reader narrow a community's feed by post type rather than sending
 * them to a separate "video" app.
 */
export async function ScopeKindChips({
  basePath,
  active,
  counts,
}: {
  /** e.g. "/religions/hinduism" — the chip rail links back to this same page. */
  basePath: string;
  active: ScopeKindFilter;
  counts: Record<ScopeKindFilter, number>;
}) {
  const t = await getTranslations("scopes");

  const items = SCOPE_KIND_FILTERS.map((kind) => ({
    key: kind,
    href: kind === "all" ? basePath : `${basePath}?kind=${kind}`,
    label: t(`kindFilters.${kind}`),
    count: counts[kind],
  })).filter((item) => item.key === "all" || item.count > 0);

  return (
    <ChipFilters label={t("modulesLabel")} items={items} activeKey={active} />
  );
}

/** A flat, kind-filtered grid — every matching piece in one place, instead of
 *  the curated module bands `ScopeContentSections` renders for "All". */
export async function ScopeKindGrid({
  items,
  locale,
}: {
  items: ContentRecord[];
  locale: string;
}) {
  const t = await getTranslations("scopes");

  if (items.length === 0) {
    return <EmptyState title={t("emptyTitle")} body={t("emptyBody")} as="h2" />;
  }

  return (
    <div className="ds-grid">
      {items.map((item) => (
        <ContentCard key={item.id} item={item} locale={locale} />
      ))}
    </div>
  );
}
