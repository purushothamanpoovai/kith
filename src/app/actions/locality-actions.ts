"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { nearestRegionScopeId } from "@/lib/geo-regions";
import { isRegionScopeId } from "@/lib/local-discovery";
import {
  GEO_REGION_COOKIE,
  LOCALITY_COOKIE_MAX_AGE,
  TIMEZONE_COOKIE,
} from "@/lib/locality-cookie";

function cookieBase() {
  return {
    path: "/",
    sameSite: "lax" as const,
    maxAge: LOCALITY_COOKIE_MAX_AGE,
  };
}

export async function saveTimezoneAction(timezone: string) {
  if (!timezone || timezone.length > 64 || !timezone.includes("/")) {
    return { ok: false as const };
  }
  const jar = await cookies();
  jar.set(TIMEZONE_COOKIE, timezone, cookieBase());
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function saveGeoRegionAction(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false as const };
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { ok: false as const };
  }
  const regionId = nearestRegionScopeId(lat, lng);
  const jar = await cookies();
  jar.set(GEO_REGION_COOKIE, regionId, cookieBase());
  revalidatePath("/", "layout");
  return { ok: true as const, regionId };
}

export async function clearGeoRegionAction() {
  const jar = await cookies();
  jar.delete(GEO_REGION_COOKIE);
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function saveGeoRegionIdAction(regionId: string) {
  if (!isRegionScopeId(regionId)) return { ok: false as const };
  const jar = await cookies();
  jar.set(GEO_REGION_COOKIE, regionId, cookieBase());
  revalidatePath("/", "layout");
  return { ok: true as const, regionId };
}
