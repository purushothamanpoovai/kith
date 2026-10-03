import {
  DM_Sans,
  Fraunces,
  Noto_Naskh_Arabic,
  Noto_Sans_Devanagari,
  Noto_Sans_Malayalam,
  Noto_Sans_Tamil,
  Noto_Serif_Devanagari,
  Noto_Serif_Malayalam,
  Noto_Serif_Tamil,
  Source_Serif_4,
} from "next/font/google";

/**
 * Typography is loaded per script, not per page (§12).
 *
 * Latin faces are always present because chrome, metadata and navigation are
 * frequently Latin even on an Indic locale. Indic faces for the scripts that
 * appear in seeded content (Tamil, Devanagari, Malayalam) are also always
 * loaded, because a Tamil poem can legitimately appear on the English home
 * page — a locale-only load would leave it in a fallback face.
 *
 * Arabic/Urdu is loaded only on the `ur` locale: Naskh is comparatively large
 * and Urdu content does not currently surface outside that locale.
 */

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-dm-sans",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-source-serif",
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
});

const notoSansTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  display: "swap",
  variable: "--font-noto-sans-tamil",
});

const notoSerifTamil = Noto_Serif_Tamil({
  subsets: ["tamil"],
  display: "swap",
  variable: "--font-noto-serif-tamil",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  display: "swap",
  variable: "--font-noto-sans-devanagari",
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  display: "swap",
  variable: "--font-noto-serif-devanagari",
});

const notoSansMalayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  display: "swap",
  variable: "--font-noto-sans-malayalam",
});

const notoSerifMalayalam = Noto_Serif_Malayalam({
  subsets: ["malayalam"],
  display: "swap",
  variable: "--font-noto-serif-malayalam",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-noto-naskh-arabic",
});

/** Faces present on every route, whatever the UI locale. */
const ALWAYS = [
  dmSans,
  sourceSerif,
  fraunces,
  notoSansTamil,
  notoSerifTamil,
  notoSansDevanagari,
  notoSerifDevanagari,
  notoSansMalayalam,
  notoSerifMalayalam,
];

/** Faces loaded only when the UI locale needs them. */
const PER_LOCALE: Record<string, Array<{ variable: string }>> = {
  ur: [notoNaskhArabic],
};

/**
 * Returns the `className` to place on <html> so the CSS variables referenced
 * by tokens.css / typography.css resolve to real font families.
 */
export function fontClassName(locale: string): string {
  return [...ALWAYS, ...(PER_LOCALE[locale] ?? [])]
    .map((font) => font.variable)
    .join(" ");
}
