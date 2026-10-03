"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/components/theme/theme-provider";
import { IconButton } from "@/components/ui/button";
import { THEME_IDS, THEME_MODES, THEME_SWATCH } from "@/lib/theme";

/**
 * Appearance control.
 *
 * Two independent choices: light / dark / match-system, and an accent palette.
 * The accent is the viewer's own preference and is separate from contextual
 * theming — a religion or organization page tints its own region without
 * overriding what the reader chose (§5).
 */
export function ThemeSwitcher() {
  const t = useTranslations("theme");
  const { theme, mode, resolvedMode, setTheme, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const MODE_ICON = {
    system: Monitor,
    light: Sun,
    dark: Moon,
  } as const;

  return (
    <div className="ds-theme-switcher ds-desktop-only" ref={rootRef}>
      <IconButton
        label={t("modeLabel")}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        {resolvedMode === "dark" ? (
          <Moon size={15} strokeWidth={1.75} />
        ) : (
          <Sun size={15} strokeWidth={1.75} />
        )}
      </IconButton>

      {open ? (
        <div className="ds-menu ds-theme-switcher__menu">
          <p className="ds-menu__label">{t("modeLabel")}</p>
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

          <hr className="ds-menu__sep" />

          <p className="ds-menu__label">{t("accentLabel")}</p>
          <div className="ds-swatches" role="radiogroup" aria-label={t("accentLabel")}>
            {THEME_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={theme === id}
                className="ds-swatch"
                style={{ ["--swatch" as string]: THEME_SWATCH[id] }}
                onClick={() => setTheme(id)}
                title={t(`themes.${id}`)}
              >
                <span className="ds-sr-only">{t(`themes.${id}`)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
