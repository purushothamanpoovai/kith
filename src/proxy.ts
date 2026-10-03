import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { inferBrowserPreferences } from "./i18n/browser-preferences";
import { routing } from "./i18n/routing";
import { SCOPE_CONTEXT_COOKIE, SCOPE_COOKIE_MAX_AGE } from "./lib/scope-cookie";

const intlMiddleware = createIntlMiddleware(routing);

function applyBrowserScopePreference(request: NextRequest, response: NextResponse) {
  if (request.cookies.has(SCOPE_CONTEXT_COOKIE)) {
    return;
  }

  const { defaultScopeId } = inferBrowserPreferences(request.headers.get("accept-language"));
  if (!defaultScopeId) {
    return;
  }

  response.cookies.set(SCOPE_CONTEXT_COOKIE, defaultScopeId, {
    path: "/",
    sameSite: "lax",
    maxAge: SCOPE_COOKIE_MAX_AGE,
  });
}

export default function proxy(request: NextRequest) {
  const response = intlMiddleware(request);
  applyBrowserScopePreference(request, response);
  return response;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|media|healthz|.*\\..*).*)",
};
