import { cookies, headers } from "next/headers";
import { inferBrowserPreferencesFromHeaderList } from "@/i18n/browser-preferences";
import { routing, type AppLocale } from "@/i18n/routing";
import { GEO_REGION_COOKIE, TIMEZONE_COOKIE } from "@/lib/locality-cookie";
import { getActiveScopeId } from "@/lib/scope-context";
import type { UserContentPreferences } from "@/domain/user/preferences";

export type LocalDiscoverySource =
  | "geo"
  | "focus"
  | "lens"
  | "timezone"
  | "accept-language"
  | "none";

export type LocalDiscoveryContext = {
  regionScopeId: string | null;
  timezone: string | null;
  source: LocalDiscoverySource;
};

const REGION_SCOPE_IDS = new Set([
  "region-tamil-nadu",
  "region-kerala",
  "region-karnataka",
  "region-west-bengal",
  "region-punjab",
  "region-sri-lanka",
  "region-kyoto",
  "region-andalusia",
  "region-tigray",
  "region-quezon",
]);

const TZ_TO_REGION: Record<string, string> = {
  "Asia/Colombo": "region-sri-lanka",
  "Asia/Tokyo": "region-kyoto",
  "Europe/Madrid": "region-andalusia",
  "Africa/Addis_Ababa": "region-tigray",
  "Asia/Manila": "region-quezon",
};

const LOCALE_TO_REGION: Partial<Record<AppLocale, string>> = {
  ta: "region-tamil-nadu",
  ml: "region-kerala",
  hi: "region-west-bengal",
  ur: "region-punjab",
};

export function isRegionScopeId(id: string | null | undefined): id is string {
  return Boolean(id && REGION_SCOPE_IDS.has(id));
}

function regionFromTimezone(timezone: string | null, locale: string): string | null {
  if (!timezone) return null;
  const direct = TZ_TO_REGION[timezone];
  if (direct) return direct;
  if (timezone === "Asia/Kolkata" || timezone === "Asia/Calcutta") {
    if (locale && locale in LOCALE_TO_REGION) {
      return LOCALE_TO_REGION[locale as AppLocale] ?? "region-tamil-nadu";
    }
    return "region-tamil-nadu";
  }
  return null;
}

/**
 * Resolves a region for ranking local posts and events.
 *
 * Order is explicit preference first, then browser settings. Nothing here
 * fingerprints the device or looks up an IP address.
 */
export async function getLocalDiscoveryContext(options?: {
  locale?: string;
  prefs?: UserContentPreferences | null;
}): Promise<LocalDiscoveryContext> {
  const jar = await cookies();
  const geo = jar.get(GEO_REGION_COOKIE)?.value ?? null;
  if (isRegionScopeId(geo)) {
    return { regionScopeId: geo, timezone: jar.get(TIMEZONE_COOKIE)?.value ?? null, source: "geo" };
  }

  if (isRegionScopeId(options?.prefs?.focusRegionScopeId)) {
    return {
      regionScopeId: options!.prefs!.focusRegionScopeId,
      timezone: jar.get(TIMEZONE_COOKIE)?.value ?? null,
      source: "focus",
    };
  }

  const lens = await getActiveScopeId();
  if (isRegionScopeId(lens)) {
    return {
      regionScopeId: lens,
      timezone: jar.get(TIMEZONE_COOKIE)?.value ?? null,
      source: "lens",
    };
  }

  const timezone = jar.get(TIMEZONE_COOKIE)?.value ?? null;
  const locale = options?.locale ?? routing.defaultLocale;
  const fromTz = regionFromTimezone(timezone, locale);
  if (fromTz) {
    return { regionScopeId: fromTz, timezone, source: "timezone" };
  }

  const headerList = await headers();
  const inferred = inferBrowserPreferencesFromHeaderList((name) => headerList.get(name));
  if (isRegionScopeId(inferred.defaultScopeId)) {
    return {
      regionScopeId: inferred.defaultScopeId,
      timezone,
      source: "accept-language",
    };
  }

  return { regionScopeId: null, timezone, source: "none" };
}

export function localityRank(scopeIds: string[], regionScopeId: string | null): number {
  if (!regionScopeId) return 0;
  return scopeIds.includes(regionScopeId) ? 1 : 0;
}
