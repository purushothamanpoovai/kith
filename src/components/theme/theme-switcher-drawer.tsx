"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/theme/theme-provider";
import { THEME_IDS, THEME_MODES, THEME_SWATCH } from "@/lib/theme";

/** The same two choices as ThemeSwitcher, laid out flat inside the drawer. */
export function ThemeSwitcherDrawer() {
  const t = useTranslations("theme");
  const { theme, mode, setTheme, setMode } = useTheme();

  const MODE_ICON = { system: Monitor, light: Sun, dark: Moon } as const;

  return (
    <div className="ds-drawer__section ds-drawer__appearance">
      <span className="ds-eyebrow ds-caps" style={{ margin: 0 }}>
        {t("modeLabel")}
      </span>
      <div className="ds-segmented" role="radiogroup" aria-label={t("modeLabel")}>
        {THEME_MODES.map((value) => {
          const Icon = MODE_ICON[value];
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              className="ds-segmented__option"
              onClick={() => setMode(value)}
            >
              <Icon size={13} strokeWidth={1.75} aria-hidden />
              <span>{value === "system" ? t("system") : t(value)}</span>
            </button>
          );
        })}
      </div>

      <span className="ds-eyebrow ds-caps" style={{ margin: 0 }}>
        {t("accentLabel")}
      </span>
      <div className="ds-swatches" role="radiogroup" aria-label={t("accentLabel")}>
        {THEME_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={theme === id}
            className="ds-swatch ds-swatch--lg"
            style={{ ["--swatch" as string]: THEME_SWATCH[id] }}
            onClick={() => setTheme(id)}
            title={t(`themes.${id}`)}
          >
            <span className="ds-sr-only">{t(`themes.${id}`)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
