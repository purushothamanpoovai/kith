/**
 * Viewer-selectable appearance.
 *
 * `ThemeId` is the accent palette the viewer picked; `universal` is the
 * neutral default and the one the platform ships with. Contextual accents
 * (religion / tradition / organization) are a separate concern — see
 * domain/theme/theme-config.ts — and never change this preference.
 */
export const THEME_IDS = [
  "universal",
  "indigo",
  "pine",
  "plum",
  "bronze",
  "teal",
  "slate",
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

/** `system` follows the operating system; it resolves to light or dark. */
export const THEME_MODES = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];
export type ResolvedMode = "light" | "dark";

export const THEME_STORAGE_KEY = "kith-theme";
export const MODE_STORAGE_KEY = "kith-mode";

export const DEFAULT_THEME: ThemeId = "universal";
export const DEFAULT_MODE: ThemeMode = "system";

/** Swatch colours for the appearance picker, in light mode. */
export const THEME_SWATCH: Record<ThemeId, string> = {
  universal: "#8a3f24",
  indigo: "#3a3d8f",
  pine: "#2a5546",
  plum: "#6d2c4a",
  bronze: "#7a5c1e",
  teal: "#1d5a63",
  slate: "#3d4a57",
};

export function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value);
}

export function isThemeMode(value: string): value is ThemeMode {
  return (THEME_MODES as readonly string[]).includes(value);
}

export function resolveThemePreference(
  theme?: string | null,
  mode?: string | null,
): { theme: ThemeId; mode: ThemeMode } {
  return {
    theme: theme && isThemeId(theme) ? theme : DEFAULT_THEME,
    mode: mode && isThemeMode(mode) ? mode : DEFAULT_MODE,
  };
}
