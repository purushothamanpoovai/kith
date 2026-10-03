import type { ScopeType } from "@/generated/prisma/client";
import { THEME_IDS, type ThemeId } from "@/lib/theme";

/**
 * Contextual theming (§5, §44).
 *
 * A religion, tradition, topic, organization or any other scope may tint the
 * page it owns. What it may change is deliberately narrow: an accent palette,
 * a decorative pattern, and a surface treatment. It may not change layout,
 * spacing, the type scale or navigation — the platform must stay recognisable.
 *
 * All mapping lives in this configuration table. Generic UI components accept
 * a resolved `ContextTheme` and know nothing about any particular religion or
 * tradition, so no religion-specific branch ever reaches a component.
 */

/** Accent palettes defined in styles/themes.css. */
export type ThemeAccent = ThemeId;

/** Decorative pattern families defined in components/graphics. */
export type ThemePattern =
  | "lattice"
  | "waves"
  | "radiance"
  | "arch"
  | "manuscript"
  | "bloom"
  | "none";

/** Surface treatment — maps to `[data-visual]` in styles/themes.css. */
export type ThemeVisual = "editorial" | "archival" | "luminous";

export type ContextTheme = {
  accent: ThemeAccent;
  pattern: ThemePattern;
  visual: ThemeVisual;
};

export const UNIVERSAL_THEME: ContextTheme = {
  accent: "universal",
  pattern: "lattice",
  visual: "editorial",
};

/**
 * Per-scope-type defaults. These describe the *kind* of thing being viewed,
 * not any belief: a region page gets a cartographic feel, a language page a
 * manuscript feel, a festival page a brighter one.
 */
const BY_SCOPE_TYPE: Partial<Record<ScopeType, Partial<ContextTheme>>> = {
  religion: { pattern: "radiance" },
  tradition: { pattern: "lattice" },
  sacred_entity: { pattern: "bloom" },
  sacred_text: { pattern: "manuscript", visual: "archival" },
  topic: { pattern: "waves" },
  region: { pattern: "arch", accent: "slate" },
  language: { pattern: "manuscript", accent: "bronze" },
  festival: { pattern: "radiance", visual: "luminous" },
  community: { pattern: "waves", accent: "pine" },
  cultural_group: { pattern: "arch", accent: "bronze" },
  organization: { pattern: "lattice" },
};

/**
 * Per-scope overrides, keyed `"<scopeType>:<slug>"`.
 *
 * Entries exist so that distinct traditions do not all look alike, which is a
 * legibility goal rather than an iconographic one — the values are ordinary
 * palette names, and every scope without an entry simply inherits its type's
 * default. Deleting this table degrades the design gracefully.
 */
const BY_SCOPE_SLUG: Record<string, Partial<ContextTheme>> = {
  "religion:hinduism": { accent: "universal" },
  "religion:buddhism": { accent: "bronze" },
  "religion:christianity": { accent: "indigo" },
  "religion:islam": { accent: "pine" },
  "religion:judaism": { accent: "teal" },
  "religion:sikhism": { accent: "plum" },

  "tradition:shaivism": { accent: "universal" },
  "tradition:sufism": { accent: "pine" },
  "tradition:theravada": { accent: "bronze" },
  "tradition:mahayana": { accent: "bronze" },
  "tradition:catholicism": { accent: "indigo" },
  "tradition:eastern-orthodox": { accent: "indigo" },
  "tradition:sephardi": { accent: "teal" },
  "tradition:khalsa": { accent: "plum" },
};

/** Resolves the theme for a scope. Unknown scopes fall back to universal. */
export function resolveScopeTheme(
  scopeType: ScopeType | null | undefined,
  slug?: string | null,
): ContextTheme {
  if (!scopeType) return UNIVERSAL_THEME;
  return {
    ...UNIVERSAL_THEME,
    ...BY_SCOPE_TYPE[scopeType],
    ...(slug ? BY_SCOPE_SLUG[`${scopeType}:${slug}`] : undefined),
  };
}

/**
 * Organizations get an identity accent without needing a schema column or a
 * curated list: the accent is derived deterministically from the record's
 * stable slug, so a given organization always looks like itself (§25).
 */
export function resolveOrganizationTheme(slug: string): ContextTheme {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  return {
    ...UNIVERSAL_THEME,
    accent: THEME_IDS[Math.abs(hash) % THEME_IDS.length],
    pattern: "lattice",
  };
}

/**
 * Spreads onto a JSX element to scope a contextual theme to that subtree.
 * Callers pass the result straight through, so no component needs to know
 * which attributes carry the theme.
 */
export function themeAttributes(theme: ContextTheme) {
  return {
    "data-accent": theme.accent,
    "data-visual": theme.visual,
  } as const;
}
