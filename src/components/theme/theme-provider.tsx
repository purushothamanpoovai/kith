"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  MODE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  isThemeId,
  isThemeMode,
  type ResolvedMode,
  type ThemeId,
  type ThemeMode,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: ThemeId;
  /** The viewer's preference, which may be `system`. */
  mode: ThemeMode;
  /** What `mode` currently evaluates to. */
  resolvedMode: ResolvedMode;
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemMode(): ResolvedMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function resolve(mode: ThemeMode): ResolvedMode {
  return mode === "system" ? systemMode() : mode;
}

function applyToDocument(theme: ThemeId, mode: ThemeMode) {
  const resolved = resolve(mode);
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.mode = resolved;
  root.dataset.modePref = mode;
  root.style.colorScheme = resolved;
}

function read<T extends string>(
  key: string,
  guard: (value: string) => value is T,
  fallback: T,
): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored && guard(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // State starts at the same default the server rendered — never read from
  // `localStorage`/`matchMedia` in a lazy initialiser here. `window` already
  // exists by the time a lazy initialiser runs on the client, because that
  // first render IS the hydration pass; reading real storage there would
  // silently diverge from the server's markup whenever a visitor has a saved
  // preference, which is exactly what produced a hydration-mismatch error on
  // the appearance icon before this fix. `ThemeScript` has already painted
  // the DOM's own attributes correctly (which CSS reads), so there is no
  // visible flash while React's state catches up in the mount effect below.
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [resolvedMode, setResolvedMode] = useState<ResolvedMode>("light");

  // Runs once on mount, before the browser paints: read the real stored
  // preference and adopt it into state. This is the one legitimate case for
  // `setState` directly in an effect body — adopting client-only data
  // (`localStorage`) after hydration, which cannot be known during the
  // render that must match the server's markup. The one extra synchronous
  // re-render this causes happens before paint, so nothing visible flashes.
  useLayoutEffect(() => {
    const storedTheme = read(THEME_STORAGE_KEY, isThemeId, DEFAULT_THEME);
    const storedMode = read(MODE_STORAGE_KEY, isThemeMode, DEFAULT_MODE);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above
    setThemeState(storedTheme);
    setModeState(storedMode);
    setResolvedMode(resolve(storedMode));
    applyToDocument(storedTheme, storedMode);
  }, []);

  // Re-assert the attributes on the document on every later change (a
  // client-side navigation doesn't re-run ThemeScript, only this effect).
  useLayoutEffect(() => {
    applyToDocument(theme, mode);
  }, [theme, mode]);

  // Follow the OS while the preference is `system`.
  useEffect(() => {
    if (mode !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      setResolvedMode(systemMode());
      applyToDocument(theme, "system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode, theme]);

  const persist = useCallback((key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Private browsing or blocked storage — the choice simply won't persist.
    }
  }, []);

  const setTheme = useCallback(
    (next: ThemeId) => {
      setThemeState(next);
      persist(THEME_STORAGE_KEY, next);
      applyToDocument(next, mode);
    },
    [mode, persist],
  );

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      setResolvedMode(resolve(next));
      persist(MODE_STORAGE_KEY, next);
      applyToDocument(theme, next);
    },
    [persist, theme],
  );

  const toggleMode = useCallback(() => {
    setMode(resolvedMode === "light" ? "dark" : "light");
  }, [resolvedMode, setMode]);

  const value = useMemo(
    () => ({ theme, mode, resolvedMode, setTheme, setMode, toggleMode }),
    [theme, mode, resolvedMode, setTheme, setMode, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
