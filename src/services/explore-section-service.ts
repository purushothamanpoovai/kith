import {
  listActiveExploreSections,
  listAllExploreSections,
  type ExploreSectionRecord,
} from "@/repositories/explore-section-repository";

export type { ExploreSectionRecord };

export async function getExploreSections(): Promise<ExploreSectionRecord[]> {
  return listActiveExploreSections();
}

export async function getAllExploreSections(): Promise<ExploreSectionRecord[]> {
  return listAllExploreSections();
}

/**
 * The admin's label override for this locale, or null when they haven't set
 * one — callers then fall back to the built-in `scopes.*` / `explore.*`
 * message, so an unconfigured section reads exactly as it did before the
 * table existed. Deliberately not `pickLocalized`: that walks a fallback
 * chain, which would show a stale English override on a Tamil page in
 * preference to the real Tamil translation.
 */
export function exploreSectionLabelOverride(
  section: ExploreSectionRecord,
  locale: string,
): string | null {
  const value = section.label?.[locale]?.trim();
  return value ? value : null;
}
