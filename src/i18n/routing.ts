import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ta", "hi", "ml", "ur"],
  defaultLocale: "en",
  localePrefix: "always",
  /** Redirect `/` to the best locale from Accept-Language (falls back to `en`) */
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];

export const RTL_LOCALES = ["ar", "ur"] as const;

export function getLocaleDirection(locale: string): "ltr" | "rtl" {
  return (RTL_LOCALES as readonly string[]).includes(locale) ? "rtl" : "ltr";
}
