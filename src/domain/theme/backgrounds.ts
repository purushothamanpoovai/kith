import type { ThemePattern } from "@/domain/theme/theme-config";

/**
 * Article background presets (§6).
 *
 * A writer picks a *named* preset, never CSS. That distinction is what keeps
 * this safe and theme-aware at once:
 *
 *   - safe, because the stored value is a key checked against this list, so
 *     nothing a writer types can reach a stylesheet;
 *   - theme-aware, because each preset resolves to one of the existing
 *     decorative pattern families, which are drawn with `currentColor` and
 *     tinted by the active accent. A preset therefore re-colours itself when
 *     the reader switches light/dark or when a scope's accent applies,
 *     instead of baking in a colour that fights the theme.
 */

export type BackgroundPreset = {
  /** Stored key. */
  id: string;
  /** Which decorative family to draw. */
  pattern: ThemePattern;
  /** How strongly it reads behind text — kept low; prose comes first. */
  opacity: number;
  /** Translation key under `create.backgrounds`. */
  labelKey: string;
};

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: "none", pattern: "none", opacity: 0, labelKey: "none" },
  { id: "lattice", pattern: "lattice", opacity: 0.06, labelKey: "lattice" },
  { id: "waves", pattern: "waves", opacity: 0.06, labelKey: "waves" },
  { id: "radiance", pattern: "radiance", opacity: 0.05, labelKey: "radiance" },
  { id: "arch", pattern: "arch", opacity: 0.06, labelKey: "arch" },
  { id: "manuscript", pattern: "manuscript", opacity: 0.06, labelKey: "manuscript" },
  { id: "bloom", pattern: "bloom", opacity: 0.05, labelKey: "bloom" },
];

const BY_ID = new Map(BACKGROUND_PRESETS.map((preset) => [preset.id, preset]));

/** Guard used by the server action before persisting a preset key. */
export function isAllowedBackgroundPreset(value: string): boolean {
  return BY_ID.has(value);
}

/** Resolves a stored key back to a preset; unknown keys degrade to none. */
export function resolveBackgroundPreset(
  value: string | null | undefined,
): BackgroundPreset {
  if (!value) return BY_ID.get("none")!;
  return BY_ID.get(value) ?? BY_ID.get("none")!;
}
