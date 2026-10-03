import type { ContentStatus, ContentType } from "@/generated/prisma/client";
import type { AuthUser } from "@/domain/auth/types";
import { pickLocalized } from "@/lib/localized";
import {
  countAuthorContentByStatus,
  listContentByAuthor,
} from "@/repositories/content-repository";
import { listEventsByOrganizer } from "@/repositories/event-repository";
import { contentHref } from "@/services/feed-service";
import { loadUserPermissionProfile } from "@/services/permission-service";
import { getScopeById } from "@/repositories/scope-repository";

/**
 * One row in the Studio tab's unified table — an article, post, or event the
 * user authored/organizes, flattened to the handful of fields the table
 * actually renders. Events have no `ContentStatus` (no draft/review step),
 * so they are always represented as "published" here — they are live the
 * moment they're created.
 */
export type StudioItem = {
  id: string;
  kind: "content" | "event";
  contentType: ContentType | "event";
  status: ContentStatus;
  title: string;
  href: `/${string}`;
  updatedAt: Date;
  organizationId: string | null;
  organizationName: string | null;
};

export type StudioStats = {
  publishedCount: number;
  needsAttentionCount: number;
  updatedThisWeekCount: number;
  organizationCount: number;
};

export type StudioOrganization = {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  role: string;
};

export type StudioScopeAssignment = {
  scopeId: string;
  scopeTitle: string;
  organizationId: string | null;
};

/** The Studio table's type filter — "event" alongside the real
 *  `ContentType` values, since the unified list treats it as a fourth kind
 *  of authored thing even though it isn't a `Content` row at all. */
export type StudioTypeFilter = ContentType | "event";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Every article/post/event the user authored or organizes, one flat list,
 *  most-recently-updated first — the query the Studio tab's table renders
 *  from. Filters are applied in the database (content) or in memory (events,
 *  whose volume per organizer is small enough that a second round trip isn't
 *  worth it). */
export async function listStudioItems(
  userId: string,
  locale: string,
  filters?: {
    types?: StudioTypeFilter[];
    statuses?: ContentStatus[];
    organizationIds?: string[];
  },
): Promise<StudioItem[]> {
  const contentTypes = filters?.types?.filter((t): t is ContentType => t !== "event");
  const includeEvents = !filters?.types?.length || filters.types.includes("event");
  // An explicit type filter that names only content types must exclude
  // events from the query below — an empty `contentTypes` array here would
  // otherwise be read by `listContentByAuthor` as "no filter" and return everything.
  const typeFilterAppliesToContent = !filters?.types?.length || (contentTypes?.length ?? 0) > 0;

  const [content, events] = await Promise.all([
    typeFilterAppliesToContent
      ? listContentByAuthor(userId, {
          types: contentTypes,
          statuses: filters?.statuses,
          organizationIds: filters?.organizationIds,
        })
      : Promise.resolve([]),
    includeEvents ? listEventsByOrganizer(userId) : Promise.resolve([]),
  ]);

  const contentItems: StudioItem[] = content.map((item) => ({
    id: item.id,
    kind: "content",
    contentType: item.type,
    status: item.status,
    title: pickLocalized(item.title, locale) || item.slug,
    href: contentHref(item.type, item.slug) as `/${string}`,
    updatedAt: item.updatedAt,
    organizationId: item.ownerOrganizationId ?? null,
    organizationName: item.ownerOrganizationName
      ? pickLocalized(item.ownerOrganizationName, locale)
      : null,
  }));

  // Events carry no ContentStatus; a status filter that excludes "published"
  // (e.g. "only drafts") must exclude events entirely rather than mislabel them.
  const eventsMatchStatus = !filters?.statuses?.length || filters.statuses.includes("published");
  const eventOrgFilter = filters?.organizationIds;
  const eventItems: StudioItem[] = !eventsMatchStatus
    ? []
    : events
        .filter((event) => !eventOrgFilter?.length || eventOrgFilter.includes(event.organizationId ?? ""))
        .map((event) => ({
          id: event.id,
          kind: "event" as const,
          contentType: "event" as const,
          status: "published" as ContentStatus,
          title: pickLocalized(event.title, locale) || event.slug,
          href: `/events/${event.slug}` as `/${string}`,
          updatedAt: event.updatedAt,
          organizationId: event.organizationId,
          organizationName: event.organizationName
            ? pickLocalized(event.organizationName, locale)
            : null,
        }));

  return [...contentItems, ...eventItems].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
}

/** Status counts across content only (events have no status) — drives which
 *  status chips the Studio filter rail shows, same "omit when empty"
 *  discipline as `countScopeContentByType`. */
export async function countStudioStatuses(
  userId: string,
): Promise<Partial<Record<ContentStatus, number>>> {
  return countAuthorContentByStatus(userId);
}

/** The small, real stat set for the Studio strip: published total, things
 *  needing the author's attention (draft + pending_review), items touched in
 *  the last 7 days, and how many organizations they publish under. Counted
 *  from the same unfiltered item list the table would show with no filters,
 *  so the numbers always agree with what scrolling the table would find. */
export function computeStudioStats(
  items: StudioItem[],
  organizationCount: number,
): StudioStats {
  const now = Date.now();
  let publishedCount = 0;
  let needsAttentionCount = 0;
  let updatedThisWeekCount = 0;
  for (const item of items) {
    if (item.status === "published") publishedCount += 1;
    if (item.status === "draft" || item.status === "pending_review") needsAttentionCount += 1;
    if (now - item.updatedAt.getTime() <= WEEK_MS) updatedThisWeekCount += 1;
  }
  return { publishedCount, needsAttentionCount, updatedThisWeekCount, organizationCount };
}

/** Organization membership cards + scope-moderator assignments for the
 *  Studio tab's "Organizations" view — reads the same permission profile
 *  `can()` uses, rather than re-deriving membership another way. */
export async function loadStudioOrganizations(
  user: AuthUser,
  locale: string,
): Promise<{ organizations: StudioOrganization[]; scopeAssignments: StudioScopeAssignment[] }> {
  const profile = await loadUserPermissionProfile(user);

  const organizations: StudioOrganization[] = profile.organizationMemberships.map((m) => ({
    organizationId: m.organizationId,
    organizationSlug: m.organizationSlug,
    organizationName: pickLocalized(m.organizationName, locale) || m.organizationSlug,
    role: m.role,
  }));

  // Scope moderation tied to an organization is already represented by that
  // organization's card — only surface the ones held independently (a public
  // scope like "Shaivism" moderated with no organization behind it at all).
  const independentScopeMods = profile.scopeModeratorScopes.filter((s) => !s.organizationId);
  const scopeAssignments = (
    await Promise.all(
      independentScopeMods.map(async (mod) => {
        const scope = await getScopeById(mod.scopeId);
        if (!scope) return null;
        return {
          scopeId: mod.scopeId,
          scopeTitle: pickLocalized(scope.title, locale) || scope.slug,
          organizationId: mod.organizationId,
        };
      }),
    )
  ).filter((s): s is StudioScopeAssignment => s !== null);

  return { organizations, scopeAssignments };
}
