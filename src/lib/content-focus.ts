import type { ScopeType } from "@/generated/prisma/client";
import type { UserContentPreferences } from "@/domain/user/preferences";
import { isFocusFilteringActive } from "@/domain/user/preferences";
import type { ScopeRecord } from "@/repositories/scope-repository";

export type ScopeIndex = Map<string, ScopeRecord>;

export function buildScopeIndex(scopes: ScopeRecord[]): ScopeIndex {
  return new Map(scopes.map((scope) => [scope.id, scope]));
}

function ancestorsOf(scopeId: string, index: ScopeIndex): string[] {
  const chain: string[] = [];
  let current = index.get(scopeId);
  while (current?.parentId) {
    chain.push(current.parentId);
    current = index.get(current.parentId);
  }
  return chain;
}

function matchesReligionFocus(
  scopeIds: string[],
  focusReligionId: string,
  index: ScopeIndex,
): boolean {
  const religionScopes = scopeIds.filter((id) => {
    const type = index.get(id)?.type;
    return type === "religion" || type === "tradition";
  });
  if (religionScopes.length === 0) return true;

  return religionScopes.some((id) => {
    if (id === focusReligionId) return true;
    return ancestorsOf(id, index).includes(focusReligionId);
  });
}

function languageCodeFromScope(scope: ScopeRecord | undefined): string | null {
  if (!scope) return null;
  if (scope.slug.startsWith("lang-")) return scope.slug.slice(5);
  return scope.slug;
}

function matchesLanguageFocus(
  item: { scopeIds: string[]; originalLanguage: string },
  focusLanguageId: string,
  index: ScopeIndex,
): boolean {
  if (item.scopeIds.includes(focusLanguageId)) return true;
  const code = languageCodeFromScope(index.get(focusLanguageId));
  if (!code) return true;
  if (item.originalLanguage === code || item.originalLanguage.startsWith(`${code}-`)) {
    return true;
  }

  const languageScopes = item.scopeIds.filter((id) => index.get(id)?.type === "language");
  if (languageScopes.length === 0 && !item.originalLanguage) return true;
  return false;
}

function matchesRegionFocus(
  scopeIds: string[],
  focusRegionId: string,
  index: ScopeIndex,
): boolean {
  const regionScopes = scopeIds.filter((id) => index.get(id)?.type === "region");
  if (regionScopes.length === 0) return true;
  return regionScopes.includes(focusRegionId);
}

export function contentMatchesUserFocus(
  item: { scopeIds: string[]; originalLanguage: string },
  prefs: UserContentPreferences,
  index: ScopeIndex,
): boolean {
  if (!isFocusFilteringActive(prefs)) return true;

  if (prefs.focusReligionScopeId) {
    if (!matchesReligionFocus(item.scopeIds, prefs.focusReligionScopeId, index)) {
      return false;
    }
  }

  if (prefs.focusLanguageScopeId) {
    if (!matchesLanguageFocus(item, prefs.focusLanguageScopeId, index)) {
      return false;
    }
  }

  if (prefs.focusRegionScopeId) {
    if (!matchesRegionFocus(item.scopeIds, prefs.focusRegionScopeId, index)) {
      return false;
    }
  }

  return true;
}

export function filterScopesForUserFocus<
  T extends { id: string; type: ScopeType; parentId: string | null },
>(scopes: T[], prefs: UserContentPreferences, index: ScopeIndex): T[] {
  if (!isFocusFilteringActive(prefs)) return scopes;

  return scopes.filter((scope) => {
    if (prefs.focusReligionScopeId) {
      if (scope.type === "religion") {
        return scope.id === prefs.focusReligionScopeId;
      }
      if (scope.type === "tradition") {
        return (
          scope.parentId === prefs.focusReligionScopeId ||
          ancestorsOf(scope.id, index).includes(prefs.focusReligionScopeId!)
        );
      }
    }

    if (prefs.focusLanguageScopeId && scope.type === "language") {
      return scope.id === prefs.focusLanguageScopeId;
    }

    if (prefs.focusRegionScopeId && scope.type === "region") {
      return scope.id === prefs.focusRegionScopeId;
    }

    return true;
  });
}

export function focusScopeIds(prefs: UserContentPreferences): string[] {
  return [
    prefs.focusReligionScopeId,
    prefs.focusLanguageScopeId,
    prefs.focusRegionScopeId,
  ].filter((id): id is string => Boolean(id));
}
