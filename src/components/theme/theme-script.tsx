"use client";

import { useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  MODE_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

/**
 * Applies the saved appearance before first paint so the page never flashes
 * the wrong palette. `system` resolves against the OS preference here and is
 * kept in sync by ThemeProvider afterwards.
 *
 * Injected with `useServerInsertedHTML` so the tag lands in `<head>` during
 * SSR and is not a React host `<script>` on the client (React 19 never
 * executes those and logs a console error if we render one).
 */
const THEME_INIT_SCRIPT = `(function(){try{
var d=document.documentElement;
var t=localStorage.getItem("${THEME_STORAGE_KEY}")||"${DEFAULT_THEME}";
var m=localStorage.getItem("${MODE_STORAGE_KEY}")||"${DEFAULT_MODE}";
var r=m==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;
d.dataset.theme=t;d.dataset.mode=r;d.dataset.modePref=m;d.style.colorScheme=r;
}catch(e){}})();`;

export function ThemeScript() {
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <script
        id="kith-theme-init"
        dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
      />
    );
  });

  return null;
}
