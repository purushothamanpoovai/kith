import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createId } from "@/lib/ids";
import { getEnv } from "@/lib/env";
import type { AuthUser } from "@/lib/permissions";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
  createSessionToken,
  hashSessionToken,
} from "@/lib/session-token";
import {
  createSession,
  deleteSessionByTokenHash,
  findSessionWithUser,
} from "@/repositories/session-repository";
import {
  createUser,
  findUserByEmail,
  findUserBySlug,
} from "@/repositories/user-repository";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_LOGIN_ATTEMPTS;
}

async function clientKey(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export type AuthResult =
  | { ok: true }
  | { ok: false; error: "invalid_credentials" | "rate_limited" | "email_taken" | "invalid_input" };

export async function registerAccount(input: {
  email: string;
  password: string;
  name: string;
  locale: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!email || !name || input.password.length < 10 || !email.includes("@")) {
    return { ok: false, error: "invalid_input" };
  }
  if (await findUserByEmail(email)) {
    return { ok: false, error: "email_taken" };
  }
  let slug = slugify(name) || "member";
  if (await findUserBySlug(slug)) {
    slug = `${slug}-${createId().slice(-6)}`;
  }
  const user = await createUser({
    id: `user_${createId()}`,
    email,
    passwordHash: await hashPassword(input.password),
    name,
    slug,
    locale: input.locale,
    primaryLanguage: input.locale,
  });
  await establishSession(user.id);
  return { ok: true };
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const key = await clientKey();
  if (tooManyAttempts(key)) {
    return { ok: false, error: "rate_limited" };
  }
  const user = await findUserByEmail(input.email.trim().toLowerCase());
  const valid = await verifyPassword(input.password, user?.passwordHash ?? null);
  if (!user || !valid) {
    return { ok: false, error: "invalid_credentials" };
  }
  await establishSession(user.id);
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteSessionByTokenHash(hashSessionToken(token));
  }
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * The signed-in reader, or null.
 *
 * Wrapped in React's `cache()` so the session lookup runs at most ONCE per
 * request. It is called from the layout, the page, the shell and a dozen
 * components — around thirty call sites — and without memoisation each one
 * was its own database round-trip for the same answer, all of them on the
 * critical path before anything could render.
 *
 * `cache()` is per-request and per-render, so this never leaks one reader's
 * session into another's request.
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const session = await findSessionWithUser(hashSessionToken(token));
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    slug: user.slug,
    role: user.role,
    locale: user.locale,
    primaryLanguage: user.primaryLanguage,
  };
});

async function establishSession(userId: string) {
  const token = createSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  const headerList = await headers();
  await createSession({
    tokenHash: hashSessionToken(token),
    userId,
    expiresAt,
    ip: headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: headerList.get("user-agent"),
  });
  const { cookieSecure } = getEnv();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure,
    path: "/",
    expires: expiresAt,
  });
}
