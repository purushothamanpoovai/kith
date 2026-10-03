import { createHash, randomBytes } from "node:crypto";
import { getEnv } from "@/lib/env";

const SESSION_BYTES = 32;

export function createSessionToken(): string {
  return randomBytes(SESSION_BYTES).toString("hex");
}

export function hashSessionToken(token: string): string {
  const { authSecret } = getEnv();
  return createHash("sha256")
    .update(`${authSecret}:${token}`)
    .digest("hex");
}

export const SESSION_COOKIE = "kith_session";
export const SESSION_TTL_DAYS = 14;
