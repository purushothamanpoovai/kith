import { getTranslations } from "next-intl/server";
import { ChipFilters, type TabItem } from "@/components/ui/tabs";
import type { ContentStatus } from "@/generated/prisma/client";
import type { StudioOrganization, StudioTypeFilter } from "@/services/studio-service";

const TYPE_FILTERS: Array<StudioTypeFilter | "all"> = [
  "all",
  "article",
  "post",
  "event",
];

const STATUS_FILTERS: ContentStatus[] = [
  "draft",
  "pending_review",
  "published",
  "hidden",
  "archived",
  "rejected",
  "removed",
];

/** Builds `/my-space?tab=studio&...` preserving every filter except the one
 *  this chip rail changes — so picking a status chip does not reset the type
 *  or organization chip already selected (all three rails share the URL). */
function studioHref(
  current: { type?: string; status?: string; org?: string },
  patch: { type?: string; status?: string; org?: string },
): `/${string}` {
  const params = new URLSearchParams();
  params.set("tab", "studio");
  const merged = { ...current, ...patch };
  if (merged.type && merged.type !== "all") params.set("type", merged.type);
  if (merged.status && merged.status !== "all") params.set("status", merged.status);
  if (merged.org && merged.org !== "all") params.set("org", merged.org);
  return `/my-space?${params.toString()}` as `/${string}`;
}

export async function StudioTypeFilters({
  active,
  counts,
  current,
}: {
  active: string;
  counts: Record<string, number>;
  current: { type?: string; status?: string; org?: string };
}) {
  const t = await getTranslations("mySpace.studio");
  const tContentTypes = await getTranslations("content.types");

  const items: TabItem[] = TYPE_FILTERS.map((kind) => ({
    key: kind,
    href: studioHref(current, { type: kind }),
    label: kind === "all" ? t("allTypes") : kind === "event" ? t("kindEvent") : tContentTypes(kind),
    count: kind === "all" ? undefined : counts[kind],
  })).filter((item) => item.key === "all" || (item.count ?? 0) > 0);

  return <ChipFilters label={t("filterByType")} items={items} activeKey={active} />;
}

export async function StudioStatusFilters({
  active,
  counts,
  current,
}: {
  active: string;
  counts: Partial<Record<ContentStatus, number>>;
  current: { type?: string; status?: string; org?: string };
}) {
  const t = await getTranslations("mySpace.studio");
  const tStatus = await getTranslations("mySpace.studio.status");

  const items: TabItem[] = [
    { key: "all", href: studioHref(current, { status: "all" }), label: t("allStatuses") },
    ...STATUS_FILTERS.map((status) => ({
      key: status,
      href: studioHref(current, { status }),
      label: tStatus(status),
      count: counts[status],
    })).filter((item) => (item.count ?? 0) > 0),
  ];

  return <ChipFilters label={t("filterByStatus")} items={items} activeKey={active} />;
}

export async function StudioOrgFilters({
  active,
  organizations,
  current,
}: {
  active: string;
  organizations: StudioOrganization[];
  current: { type?: string; status?: string; org?: string };
}) {
  const t = await getTranslations("mySpace.studio");

  // Only worth a chip rail once the author actually publishes under more
  // than one organization — otherwise every row would carry the same value.
  if (organizations.length <= 1) return null;

  const items: TabItem[] = [
    { key: "all", href: studioHref(current, { org: "all" }), label: t("allOrganizations") },
    ...organizations.map((org) => ({
      key: org.organizationId,
      href: studioHref(current, { org: org.organizationId }),
      label: org.organizationName,
    })),
  ];

  return <ChipFilters label={t("filterByOrganization")} items={items} activeKey={active} />;
}
