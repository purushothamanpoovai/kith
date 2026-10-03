import type { ContentType, ScopeType } from "@/generated/prisma/client";
import type { ContentRecord, FeedItem } from "@/domain/content/types";
import { pickLocalized } from "@/lib/localized";
import {
  listContentByOrganizationIds,
  listContentByScopes,
  listContentByType,
  listFeaturedContent,
} from "@/repositories/content-repository";
import {
  listSubscribedOrganizationIds,
  listSubscribedScopeIds,
  listUserSubscriptions,
} from "@/repositories/subscription-repository";
import { listScopeAncestors, type ScopeRecord } from "@/repositories/scope-repository";

const TYPE_WEIGHTS: Partial<Record<ScopeType, number>> = {
  sacred_entity: 40,
  tradition: 30,
  religion: 25,
  topic: 20,
  region: 15,
  language: 10,
};

function freshnessBoost(publishedAt: Date): number {
  const ageDays = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 3) return 15;
  if (ageDays <= 14) return 8;
  if (ageDays <= 60) return 3;
  return 0;
}

async function buildScopeWeightMap(scopeIds: string[]): Promise<Map<string, number>> {
  const weights = new Map<string, number>();
  for (const scopeId of scopeIds) {
    const ancestors = await listScopeAncestors(scopeId);
    for (const ancestor of ancestors) {
      const w = TYPE_WEIGHTS[ancestor.type] ?? 5;
      weights.set(ancestor.id, Math.max(weights.get(ancestor.id) ?? 0, w));
    }
    weights.set(scopeId, Math.max(weights.get(scopeId) ?? 0, 5));
  }
  return weights;
}

function scoreContent(
  item: ContentRecord,
  scopeWeights: Map<string, number>,
  subscribedAuthorIds: Set<string>,
  subscribedOrgIds: Set<string>,
  activeScopeId?: string | null,
  regionScopeId?: string | null,
): { score: number; matchReasons: string[] } {
  let score = item.trendingScore;
  const matchReasons: string[] = [];

  for (const scopeId of item.scopeIds) {
    const weight = scopeWeights.get(scopeId);
    if (weight) {
      score += weight;
      matchReasons.push(`scope:${scopeId}`);
    }
    if (activeScopeId && scopeId === activeScopeId) {
      score += 25;
      matchReasons.push("active-scope");
    }
  }

  if (subscribedAuthorIds.has(item.authorId)) {
    score += 10;
    matchReasons.push("author");
  }

  if (item.ownerOrganizationId && subscribedOrgIds.has(item.ownerOrganizationId)) {
    score += 22;
    matchReasons.push("organization");
  }

  if (regionScopeId && item.scopeIds.includes(regionScopeId)) {
    score += 18;
    matchReasons.push("local-region");
  }

  score += freshnessBoost(item.publishedAt);
  return { score, matchReasons: [...new Set(matchReasons)] };
}

export async function buildPersonalFeed(
  userId: string,
  options: { activeScopeId?: string | null; regionScopeId?: string | null; limit?: number } = {},
): Promise<FeedItem[]> {
  const subscribedScopeIds = await listSubscribedScopeIds(userId);
  const subscriptions = await listUserSubscriptions(userId);
  const subscribedOrgIds = await listSubscribedOrganizationIds(userId);
  const subscribedAuthorIds = new Set(
    subscriptions.filter((s) => s.authorId).map((s) => s.authorId!),
  );
  const scopeIds = options.activeScopeId
    ? [options.activeScopeId, ...subscribedScopeIds]
    : subscribedScopeIds;

  const { getUserContentPreferences, filterContentForUser } = await import(
    "@/services/preference-service"
  );
  const userPrefs = await getUserContentPreferences(userId);

  const [posts, articles, orgContent, scopeWeights] = await Promise.all([
    listContentByScopes(scopeIds.length ? scopeIds : [], ["post"], 40),
    listContentByScopes(scopeIds.length ? scopeIds : [], ["article", "poem", "audio", "video"], 30),
    listContentByOrganizationIds(subscribedOrgIds, ["post", "article", "audio", "video"], 20),
    buildScopeWeightMap(scopeIds),
  ]);

  let pool = [...posts, ...articles, ...orgContent];
  pool = await filterContentForUser(pool, userPrefs);

  const seen = new Set<string>();

  const scored: FeedItem[] = [];
  for (const item of pool) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const { score, matchReasons } = scoreContent(
      item,
      scopeWeights,
      subscribedAuthorIds,
      new Set(subscribedOrgIds),
      options.activeScopeId,
      options.regionScopeId,
    );
    scored.push({ ...item, score, matchReasons });
  }

  if (scored.length < (options.limit ?? 20)) {
    let featured = await listFeaturedContent(12);
    featured = await filterContentForUser(featured, userPrefs);
    for (const item of featured) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      const { score, matchReasons } = scoreContent(
        item,
        scopeWeights,
        subscribedAuthorIds,
        new Set(subscribedOrgIds),
        options.activeScopeId,
        options.regionScopeId,
      );
      scored.push({ ...item, score, matchReasons });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, options.limit ?? 24);
}

export async function buildGuestFeed(
  limit = 12,
  options: { regionScopeId?: string | null } = {},
): Promise<ContentRecord[]> {
  const [featured, recentPosts] = await Promise.all([
    listFeaturedContent(Math.ceil(limit / 2) + 4),
    listContentByType("post", Math.ceil(limit / 2) + 4),
  ]);
  const seen = new Set<string>();
  const items: ContentRecord[] = [];
  for (const item of [...featured, ...recentPosts]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
  }
  const region = options.regionScopeId;
  if (region) {
    items.sort((a, b) => {
      const rank =
        (b.scopeIds.includes(region) ? 1 : 0) - (a.scopeIds.includes(region) ? 1 : 0);
      if (rank !== 0) return rank;
      return b.publishedAt.getTime() - a.publishedAt.getTime();
    });
  }
  return items.slice(0, limit);
}

export const MODULE_CONTENT_TYPES: Record<string, ContentType[]> = {
  overview: ["article", "post", "poem", "audio", "video"],
  stories: ["article", "oral_history"],
  articles: ["article"],
  poetry: ["poem"],
  audio: ["audio"],
  video: ["video"],
  festivals: ["article", "post"],
  traditions: ["article", "post"],
  places: ["article", "oral_history"],
};

/** Content-kind filter keys usable in a scope page's `?kind=` chip rail. */
export type ScopeKindFilter = "all" | "articles" | "poems" | "media" | "heritage";

/** Maps a `?kind=` filter to the content types it shows — the same partition
 *  Media's old standalone browse page used, now reachable from any scope
 *  page instead of a separate top-level destination (§ discovery unification). */
export const KIND_FILTER_CONTENT_TYPES: Record<Exclude<ScopeKindFilter, "all">, ContentType[]> = {
  articles: ["article", "post"],
  poems: ["poem"],
  media: ["audio", "video"],
  heritage: ["oral_history"],
};

export const SCOPE_KIND_FILTERS: ScopeKindFilter[] = [
  "all",
  "articles",
  "poems",
  "media",
  "heritage",
];

/** Rolls up per-type counts (from `countScopeContentByType`) into the count
 *  shown on each kind-filter chip. */
export function summarizeKindCounts(
  countsByType: Partial<Record<ContentType, number>>,
): Record<ScopeKindFilter, number> {
  const sum = (types: ContentType[]) =>
    types.reduce((total, type) => total + (countsByType[type] ?? 0), 0);
  const all = Object.values(countsByType).reduce((total, n) => total + (n ?? 0), 0);
  return {
    all,
    articles: sum(KIND_FILTER_CONTENT_TYPES.articles),
    poems: sum(KIND_FILTER_CONTENT_TYPES.poems),
    media: sum(KIND_FILTER_CONTENT_TYPES.media),
    heritage: sum(KIND_FILTER_CONTENT_TYPES.heritage),
  };
}

export function contentHref(type: ContentType, slug: string): string {
  if (type === "oral_history") return `/heritage/${slug}`;
  if (type === "article") return `/articles/${slug}`;
  if (type === "post") return `/community#${slug}`;
  return `/media/${slug}`;
}

export function contentTitle(item: ContentRecord, locale: string): string {
  return pickLocalized(item.title, locale);
}

export function contentSummary(item: ContentRecord, locale: string): string {
  return pickLocalized(item.summary, locale);
}

export type { ScopeRecord };
