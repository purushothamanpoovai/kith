import { cookies, headers } from "next/headers";
import { inferBrowserPreferencesFromHeaderList } from "@/i18n/browser-preferences";
import { SCOPE_CONTEXT_COOKIE, SCOPE_COOKIE_MAX_AGE } from "@/lib/scope-cookie";

export { SCOPE_CONTEXT_COOKIE } from "@/lib/scope-cookie";

export async function getActiveScopeId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SCOPE_CONTEXT_COOKIE)?.value ?? null;
}

export async function setActiveScopeId(scopeId: string | null) {
  const jar = await cookies();
  if (!scopeId) {
    jar.delete(SCOPE_CONTEXT_COOKIE);
    return;
  }
  jar.set(SCOPE_CONTEXT_COOKIE, scopeId, {
    path: "/",
    sameSite: "lax",
    maxAge: SCOPE_COOKIE_MAX_AGE,
  });
}

/**
 * Ensures first-time visitors get a region scope from the browser when the
 * proxy cookie was not applied (e.g. during static generation edge cases).
 */
export async function ensureBrowserScopePreference(): Promise<void> {
  const jar = await cookies();
  if (jar.get(SCOPE_CONTEXT_COOKIE)?.value) {
    return;
  }

  const headerList = await headers();
  const { defaultScopeId } = inferBrowserPreferencesFromHeaderList((name) =>
    headerList.get(name),
  );

  if (defaultScopeId) {
    await setActiveScopeId(defaultScopeId);
  }
}
