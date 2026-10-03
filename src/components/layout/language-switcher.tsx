"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { IconButton } from "@/components/ui/button";

/**
 * Language selection (§13).
 *
 * Each language is offered in its own script and its own face — a reader
 * looking for Tamil scans for "தமிழ்", not for "TA". The English exonym sits
 * underneath as a quiet second line so the list is also navigable by someone
 * who cannot yet read the script they are looking for.
 */

export type LanguageOption = {
  code: string;
  /** The language's name in that language. */
  endonym: string;
  /** Its English name, for cross-script scanning. */
  exonym: string;
};

/** Ordered as offered in the directive, filtered to the locales that route. */
export const LANGUAGES: LanguageOption[] = [
  { code: "en", endonym: "English", exonym: "English" },
  { code: "ta", endonym: "தமிழ்", exonym: "Tamil" },
  { code: "hi", endonym: "हिन्दी", exonym: "Hindi" },
  { code: "ml", endonym: "മലയാളം", exonym: "Malayalam" },
  { code: "te", endonym: "తెలుగు", exonym: "Telugu" },
  { code: "kn", endonym: "ಕನ್ನಡ", exonym: "Kannada" },
  { code: "bn", endonym: "বাংলা", exonym: "Bengali" },
  { code: "mr", endonym: "मराठी", exonym: "Marathi" },
  { code: "pa", endonym: "ਪੰਜਾਬੀ", exonym: "Punjabi" },
  { code: "ur", endonym: "اردو", exonym: "Urdu" },
];

const SHORT: Record<string, string> = {
  en: "EN",
  ta: "தமி",
  hi: "हिं",
  ml: "മല",
  ur: "اردو",
};

function available(): LanguageOption[] {
  const routed = new Set<string>(routing.locales);
  return LANGUAGES.filter((language) => routed.has(language.code));
}

export function LanguageSwitcher({ expanded = false }: { expanded?: boolean }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const options = available();

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

  function choose(code: string) {
    setOpen(false);
    if (code === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: code });
    });
  }

  const list = (
    <ul className="ds-lang-list" role="listbox" aria-label={t("language")}>
      {options.map((option) => {
        const active = option.code === locale;
        return (
          <li key={option.code}>
            <button
              type="button"
              role="option"
              aria-selected={active}
              className="ds-lang-option"
              onClick={() => choose(option.code)}
              disabled={pending}
            >
              {/* lang= drives the per-script font stack in typography.css. */}
              <span className="ds-lang-option__text" lang={option.code}>
                <span className="ds-lang-option__endonym">{option.endonym}</span>
                {option.endonym !== option.exonym ? (
                  <span className="ds-lang-option__exonym" lang="en">
                    {option.exonym}
                  </span>
                ) : null}
              </span>
              {active ? (
                <Check size={14} strokeWidth={2.25} aria-hidden />
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );

  // Inside the mobile drawer the list is always visible — a popover inside a
  // popover is a poor pattern on touch.
  if (expanded) {
    return (
      <div className="ds-lang-switch ds-lang-switch--expanded">
        <span className="ds-eyebrow ds-caps" style={{ margin: 0 }}>
          {t("language")}
        </span>
        {list}
      </div>
    );
  }

  return (
    <div className="ds-lang-switch" ref={rootRef}>
      <IconButton
        label={t("language")}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="ds-lang-switch__trigger">
          <Globe size={14} strokeWidth={1.75} aria-hidden />
          <span className="ds-lang-switch__code" lang={locale}>
            {SHORT[locale] ?? locale.toUpperCase()}
          </span>
        </span>
      </IconButton>
      {open ? <div className="ds-menu ds-lang-switch__menu">{list}</div> : null}
    </div>
  );
}
