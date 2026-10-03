"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, LayoutTemplate } from "lucide-react";
import { DecorativePattern } from "@/components/graphics/decorative-pattern";
import { BACKGROUND_PRESETS, resolveBackgroundPreset } from "@/domain/theme/backgrounds";

/**
 * The background preset picker.
 *
 * A native `<select>` cannot render anything but plain text inside its
 * options, so a writer choosing between "Lattice" and "Waves" had to
 * remember what each name looked like or pick blind and check afterwards.
 * This is a small custom listbox instead: each option shows its own
 * thumbnail next to its name, so the choice is visible before it's made,
 * not just after.
 */
export function BackgroundPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const t = useTranslations("create");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = resolveBackgroundPreset(value);

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

  return (
    <div className="ds-bg-select" ref={rootRef}>
      <button
        type="button"
        className="ds-editor__picker ds-bg-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <LayoutTemplate size={15} strokeWidth={1.75} aria-hidden />
        <span className="ds-sr-only">{t("backgroundTitle")}</span>
        <span className="ds-bg-select__thumb" aria-hidden>
          <DecorativePattern pattern={current.pattern} opacity={1} fade="none" singleTile />
        </span>
        <span className="ds-bg-select__value">{t(`backgrounds.${current.labelKey}`)}</span>
        <ChevronDown size={13} strokeWidth={2} aria-hidden />
      </button>

      {open ? (
        <ul className="ds-bg-select__menu" role="listbox" aria-label={t("backgroundTitle")}>
          {BACKGROUND_PRESETS.map((preset) => (
            <li key={preset.id}>
              <button
                type="button"
                role="option"
                aria-selected={preset.id === value}
                className="ds-bg-select__option"
                onClick={() => {
                  onChange(preset.id);
                  setOpen(false);
                }}
              >
                <span className="ds-bg-select__thumb" aria-hidden>
                  <DecorativePattern pattern={preset.pattern} opacity={1} fade="none" singleTile />
                </span>
                <span>{t(`backgrounds.${preset.labelKey}`)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
