"use client";

import { useEffect } from "react";
import { saveTimezoneAction } from "@/app/actions/locality-actions";

/**
 * Stores the browser timezone so the server can rank nearby gatherings.
 * This is a setting the OS already exposes — not a location trace.
 */
export function TimezoneSync() {
  useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!timezone) return;
      const existing = document.cookie
        .split("; ")
        .find((part) => part.startsWith("kith-tz="))
        ?.slice("kith-tz=".length);
      if (existing === timezone) return;
      void saveTimezoneAction(timezone);
    } catch {
      // Ignore private-mode / blocked cookie failures.
    }
  }, []);

  return null;
}
