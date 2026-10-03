import type { UserContentPreferences, UserPreferencesInput } from "@/domain/user/preferences";
import { preferencesFromUser } from "@/domain/user/preferences";
import {
  buildScopeIndex,
  contentMatchesUserFocus,
  filterScopesForUserFocus,
} from "@/lib/content-focus";
import { findUserById, updateUserPreferences } from "@/repositories/user-repository";
import { listAllScopes, type ScopeRecord } from "@/repositories/scope-repository";
import { getCurrentUser } from "@/services/auth-service";

let scopeIndexCache: ReturnType<typeof buildScopeIndex> | null = null;
let scopeListCache: ScopeRecord[] | null = null;

async function getScopeIndex() {
  if (!scopeIndexCache || !scopeListCache) {
    scopeListCache = await listAllScopes();
    scopeIndexCache = buildScopeIndex(scopeListCache);
  }
  return { index: scopeIndexCache, scopes: scopeListCache };
}

export async function getUserContentPreferences(
  userId: string,
): Promise<UserContentPreferences | null> {
  const user = await findUserById(userId);
  if (!user) return null;
  return preferencesFromUser(user);
}

export async function getCurrentUserContentPreferences(): Promise<UserContentPreferences | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getUserContentPreferences(user.id);
}

export async function saveUserContentPreferences(
  userId: string,
  input: UserPreferencesInput,
) {
  await updateUserPreferences(userId, {
    locale: input.locale,
    primaryLanguage: input.primaryLanguage,
    contentFocusMode: input.contentFocusMode,
    focusReligionScopeId: input.focusReligionScopeId ?? null,
    focusLanguageScopeId: input.focusLanguageScopeId ?? null,
    focusRegionScopeId: input.focusRegionScopeId ?? null,
  });
  scopeIndexCache = null;
  scopeListCache = null;
}

export async function filterContentForUser<T extends { scopeIds: string[]; originalLanguage: string }>(
  items: T[],
  prefs: UserContentPreferences | null,
): Promise<T[]> {
  if (!prefs) return items;
  const { index } = await getScopeIndex();
  return items.filter((item) => contentMatchesUserFocus(item, prefs, index));
}

export async function filterScopesForUser<T extends ScopeRecord>(
  scopes: T[],
  prefs: UserContentPreferences | null,
): Promise<T[]> {
  if (!prefs) return scopes;
  const { index } = await getScopeIndex();
  return filterScopesForUserFocus(scopes, prefs, index);
}

export async function getPreferenceScopeOptions(locale: string) {
  const { scopes } = await getScopeIndex();
  const religions = scopes.filter((s) => s.type === "religion");
  const languages = scopes.filter((s) => s.type === "language");
  const regions = scopes.filter((s) => s.type === "region");
  return { religions, languages, regions, locale };
}
