import { match } from "@formatjs/intl-localematcher";
import { routing, type AppLocale } from "./routing";

export type BrowserPreferences = {
  locale: AppLocale;
  /** ISO 3166-1 alpha-2 territory when present (e.g. IN, LK) */
  regionCode: string | null;
  /** Default discovery scope id derived from language / region */
  defaultScopeId: string | null;
};

/** Locale → default region scope when no territory tag is available */
const LOCALE_DEFAULT_SCOPE: Partial<Record<AppLocale, string>> = {
  ta: "region-tamil-nadu",
  ml: "region-kerala",
  hi: "region-west-bengal",
  ur: "region-punjab",
};

/** BCP 47 tag → region scope (checked before locale fallback) */
const TAG_DEFAULT_SCOPE: Record<string, string> = {
  "ta-in": "region-tamil-nadu",
  "ta-lk": "region-sri-lanka",
  "ml-in": "region-kerala",
  "hi-in": "region-west-bengal",
  "bn-in": "region-west-bengal",
  "ur-in": "region-punjab",
  "ur-pk": "region-punjab",
  "kn-in": "region-karnataka",
  "te-in": "region-karnataka",
  "mr-in": "region-west-bengal",
  "pa-in": "region-punjab",
};

function orderLocales(locales: readonly string[]): string[] {
  return locales.slice().sort((a, b) => b.length - a.length);
}

/** Parse Accept-Language into ordered BCP 47 tags (highest preference first) */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header?.trim()) {
    return [];
  }

  return header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { tag: tag.trim(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((entry) => entry.tag && entry.q > 0)
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag);
}

function resolveLocaleFromTags(languageTags: string[]): AppLocale {
  if (languageTags.length === 0) {
    return routing.defaultLocale;
  }

  try {
    const matched = match(
      languageTags,
      orderLocales(routing.locales),
      routing.defaultLocale,
    );
    if (routing.locales.includes(matched as AppLocale)) {
      return matched as AppLocale;
    }
  } catch {
    // Invalid Accept-Language — fall through
  }

  for (const tag of languageTags) {
    const base = tag.split("-")[0]?.toLowerCase();
    if (base && routing.locales.includes(base as AppLocale)) {
      return base as AppLocale;
    }
  }

  return routing.defaultLocale;
}

function resolveScopeFromTags(languageTags: string[], locale: AppLocale): string | null {
  for (const tag of languageTags) {
    const normalized = tag.toLowerCase();
    const scoped = TAG_DEFAULT_SCOPE[normalized];
    if (scoped) {
      return scoped;
    }
  }

  return LOCALE_DEFAULT_SCOPE[locale] ?? null;
}

function extractRegionCode(languageTags: string[]): string | null {
  for (const tag of languageTags) {
    const parts = tag.split("-");
    if (parts.length >= 2 && parts[1].length === 2) {
      return parts[1].toUpperCase();
    }
  }
  return null;
}

/** Infer UI locale and default region scope from the browser Accept-Language header */
export function inferBrowserPreferences(
  acceptLanguageHeader: string | null | undefined,
): BrowserPreferences {
  const languageTags = parseAcceptLanguage(acceptLanguageHeader);
  const locale = resolveLocaleFromTags(languageTags);
  const regionCode = extractRegionCode(languageTags);
  const defaultScopeId = resolveScopeFromTags(languageTags, locale);

  return { locale, regionCode, defaultScopeId };
}

/** Read Accept-Language from Next.js request headers in server code */
export function inferBrowserPreferencesFromHeaderList(
  getHeader: (name: string) => string | null,
): BrowserPreferences {
  return inferBrowserPreferences(getHeader("accept-language"));
}
