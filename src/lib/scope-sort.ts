import { pickLocalized } from "@/lib/localized";
import type { ScopeRecord } from "@/repositories/scope-repository";

/** Neutral display order — alphabetical by localized title, then slug. */
export function sortScopesAlphabetically(
  scopes: ScopeRecord[],
  locale: string,
  fallback = "en",
): ScopeRecord[] {
  return [...scopes].sort((a, b) => {
    const labelA = pickLocalized(a.title, locale, fallback);
    const labelB = pickLocalized(b.title, locale, fallback);
    const byTitle = labelA.localeCompare(labelB, locale, { sensitivity: "base" });
    if (byTitle !== 0) {
      return byTitle;
    }
    return a.slug.localeCompare(b.slug, "en", { sensitivity: "base" });
  });
}

export function sortLabelsAlphabetically<T>(
  items: T[],
  label: (item: T) => string,
  locale: string,
): T[] {
  return [...items].sort((a, b) =>
    label(a).localeCompare(label(b), locale, { sensitivity: "base" }),
  );
}
