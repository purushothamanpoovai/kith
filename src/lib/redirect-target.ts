/**
 * "Sign in, then come back here" targets (§ sign-in gate).
 *
 * The target arrives as a query string value — attacker-controlled input,
 * not a trusted internal value — so it is validated before ever being passed
 * to `router.replace`/`redirect`. The only shape allowed is a same-origin,
 * root-relative path: no scheme, no `//` (protocol-relative, resolves to an
 * external host), no backslash (some browsers treat `\` as `/` in a URL,
 * which is the classic bypass for a naive `startsWith("/")` check). Anything
 * else falls back to a safe default rather than being trusted.
 */
export function sanitizeRedirectTarget(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("\\")) return fallback;
  return value;
}
