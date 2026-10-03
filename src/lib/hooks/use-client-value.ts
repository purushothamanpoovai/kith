"use client";

import { useSyncExternalStore } from "react";

/**
 * Reads a value that only exists in the browser.
 *
 * Server-rendered components cannot see `localStorage`, so anything stored
 * there has to be picked up after hydration. The obvious way — an effect that
 * calls `setState` — triggers a second render pass on every mount and is what
 * `react-hooks/set-state-in-effect` flags.
 *
 * `useSyncExternalStore` is the intended tool: it takes a server snapshot and
 * a client snapshot and resolves them at hydration without a cascading render.
 * `subscribe` is a no-op for values that never change after load; pass a real
 * subscription when the value can change (e.g. a `storage` event).
 */
export function useClientValue<T>(
  /** Evaluated in the browser only. Must be cheap and synchronous. */
  read: () => T,
  /** What the server renders, and what hydration must match. */
  serverValue: T,
  subscribe: (onChange: () => void) => () => void = () => () => {},
): T {
  return useSyncExternalStore(subscribe, read, () => serverValue);
}

/** Reads one localStorage key, tolerating blocked or unavailable storage. */
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Private mode, or site data blocked. Treat as "nothing stored".
    return null;
  }
}

/** Writes one localStorage key, tolerating blocked or unavailable storage. */
export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The preference simply won't persist; the caller's UI still updates.
  }
}
