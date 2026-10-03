export type LocalizedString = Record<string, string>;

const LOCALE_FALLBACK_CHAIN = ["en", "ta", "hi", "ml", "ur"] as const;

export function pickLocalized(
  value: LocalizedString | null | undefined,
  locale: string,
  fallback = "en",
): string {
  if (!value) {
    return "";
  }
  if (value[locale]) {
    return value[locale];
  }
  if (value[fallback]) {
    return value[fallback];
  }
  for (const code of LOCALE_FALLBACK_CHAIN) {
    if (value[code]) {
      return value[code];
    }
  }
  return Object.values(value)[0] || "";
}
