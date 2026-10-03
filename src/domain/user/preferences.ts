import type { ContentFocusMode } from "@/generated/prisma/client";

export type UserContentPreferences = {
  locale: string;
  primaryLanguage: string;
  contentFocusMode: ContentFocusMode;
  focusReligionScopeId: string | null;
  focusLanguageScopeId: string | null;
  focusRegionScopeId: string | null;
};

export type UserPreferencesInput = {
  locale?: string;
  primaryLanguage?: string;
  contentFocusMode?: ContentFocusMode;
  focusReligionScopeId?: string | null;
  focusLanguageScopeId?: string | null;
  focusRegionScopeId?: string | null;
};

export function hasConfiguredFocus(prefs: UserContentPreferences): boolean {
  return Boolean(
    prefs.focusReligionScopeId || prefs.focusLanguageScopeId || prefs.focusRegionScopeId,
  );
}

export function isFocusFilteringActive(prefs: UserContentPreferences): boolean {
  return prefs.contentFocusMode === "focused" && hasConfiguredFocus(prefs);
}

export function preferencesFromUser(user: {
  locale: string;
  primaryLanguage: string;
  contentFocusMode: ContentFocusMode;
  focusReligionScopeId: string | null;
  focusLanguageScopeId: string | null;
  focusRegionScopeId: string | null;
}): UserContentPreferences {
  return {
    locale: user.locale,
    primaryLanguage: user.primaryLanguage,
    contentFocusMode: user.contentFocusMode,
    focusReligionScopeId: user.focusReligionScopeId,
    focusLanguageScopeId: user.focusLanguageScopeId,
    focusRegionScopeId: user.focusRegionScopeId,
  };
}
