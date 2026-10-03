import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { mergeMessages } from "./merge-messages";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const en = (await import("../messages/en.json")).default;

  if (locale === routing.defaultLocale) {
    return { locale, messages: en };
  }

  const localized = (await import(`../messages/${locale}.json`)).default;
  return {
    locale,
    messages: mergeMessages(en, localized),
  };
});
