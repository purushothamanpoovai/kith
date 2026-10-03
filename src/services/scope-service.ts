import { ScopeType } from "@/generated/prisma/client";
import {
  EXPLORE_SCOPE_TYPES,
  scopeHref,
  scopeListHref,
} from "@/domain/scope/routes";
import type {
  ExploreCategory,
  ScopeBreadcrumb,
  ScopeWithRelations,
} from "@/domain/scope/types";
import { pickLocalized } from "@/lib/localized";
import { sortLabelsAlphabetically, sortScopesAlphabetically } from "@/lib/scope-sort";
import {
  countScopesByType,
  getScopeBySlug,
  listChildScopes,
  listReligionTree,
  listScopeAncestors,
  listScopesByType,
  listScopesByTypeWithCounts,
  searchScopes as searchScopesInRepo,
  type ScopeRecord,
  type ScopeTreeNode,
} from "@/repositories/scope-repository";

export type { ScopeTreeNode };

export type { ScopeRecord };

const EXPLORE_TYPE_MESSAGE_KEY: Record<(typeof EXPLORE_SCOPE_TYPES)[number], string> = {
  [ScopeType.religion]: "religions",
  [ScopeType.tradition]: "traditions",
  [ScopeType.sacred_entity]: "entities",
  [ScopeType.topic]: "topics",
  [ScopeType.region]: "regions",
  [ScopeType.language]: "languages",
};

export async function getReligions(locale = "en"): Promise<ScopeRecord[]> {
  return listScopes(ScopeType.religion, locale);
}

export async function getTraditions(locale = "en"): Promise<ScopeRecord[]> {
  return listScopes(ScopeType.tradition, locale);
}

export async function getSacredEntities(locale = "en"): Promise<ScopeRecord[]> {
  return listScopes(ScopeType.sacred_entity, locale);
}

export async function getTopics(locale = "en"): Promise<ScopeRecord[]> {
  return listScopes(ScopeType.topic, locale);
}

export async function getRegions(locale = "en"): Promise<ScopeRecord[]> {
  return listScopes(ScopeType.region, locale);
}

export async function getLanguages(locale = "en"): Promise<ScopeRecord[]> {
  return listScopes(ScopeType.language, locale);
}

export async function listScopes(
  type: ScopeType,
  locale = "en",
  userId?: string | null,
): Promise<ScopeRecord[]> {
  const rows = await listScopesByType(type);
  let sorted = sortScopesAlphabetically(rows, locale);
  if (userId) {
    const { getUserContentPreferences, filterScopesForUser } = await import(
      "@/services/preference-service"
    );
    const prefs = await getUserContentPreferences(userId);
    sorted = await filterScopesForUser(sorted, prefs);
  }
  return sorted;
}

export async function getScope(
  type: ScopeType,
  slug: string,
): Promise<ScopeRecord | null> {
  return getScopeBySlug(type, slug);
}

export async function getScopeWithRelations(
  type: ScopeType,
  slug: string,
  locale = "en",
): Promise<ScopeWithRelations | null> {
  const scope = await getScopeBySlug(type, slug);
  if (!scope) {
    return null;
  }
  const [ancestors, children] = await Promise.all([
    listScopeAncestors(scope.id),
    listChildScopes(scope.id),
  ]);
  const breadcrumbs = buildBreadcrumbs([...ancestors, scope]);
  return {
    ...scope,
    breadcrumbs,
    children: sortScopesAlphabetically(children, locale),
  };
}

export async function getExploreCategories(): Promise<ExploreCategory[]> {
  const counts = await Promise.all(
    EXPLORE_SCOPE_TYPES.map(async (type) => ({
      type,
      count: await countScopesByType(type),
      href: scopeListHref(type) ?? "/explore",
    })),
  );
  return counts.filter((item) => item.href !== "/explore");
}

export function sortExploreCategories(
  categories: ExploreCategory[],
  labelForType: (type: ExploreCategory["type"]) => string,
  locale: string,
): ExploreCategory[] {
  return sortLabelsAlphabetically(categories, (item) => labelForType(item.type), locale);
}

export function exploreCategoryMessageKey(type: ExploreCategory["type"]): string {
  return EXPLORE_TYPE_MESSAGE_KEY[type as keyof typeof EXPLORE_TYPE_MESSAGE_KEY] ?? type;
}

export function buildBreadcrumbs(scopes: ScopeRecord[]): ScopeBreadcrumb[] {
  return scopes.map((scope) => ({
    id: scope.id,
    type: scope.type,
    slug: scope.slug,
    title: scope.title,
    href: scopeHref(scope.type, scope.slug),
  }));
}

export function getScopeLabel(
  scope: ScopeRecord,
  locale: string,
  fallback = "en",
): string {
  return pickLocalized(scope.title, locale, fallback);
}

export function getScopeDescription(
  scope: ScopeRecord,
  locale: string,
  fallback = "en",
): string {
  return pickLocalized(scope.description, locale, fallback);
}

/**
 * The real Religion → Tradition → Sacred Entity hierarchy (§ Explore
 * redesign) — used to render Explore as a tree rather than card rails, which
 * is the structure a researcher or journalist actually wants when scanning
 * "what belongs under what" rather than browsing for something to read next.
 */
export async function getReligionTree(): Promise<ScopeTreeNode[]> {
  return listReligionTree();
}

export async function getScopesWithCounts(type: ScopeType) {
  return listScopesByTypeWithCounts(type);
}

export async function searchScopes(
  query: string,
  locale: string,
  limit = 12,
): Promise<Array<{ id: string; href: string; label: string }>> {
  const rows = await searchScopesInRepo(query, limit);
  const mapped = rows.map((scope) => ({
    id: scope.id,
    href: scopeHref(scope.type, scope.slug),
    label: getScopeLabel(scope, locale),
  }));
  return sortLabelsAlphabetically(mapped, (item) => item.label, locale);
}
