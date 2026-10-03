import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import type { Metadata } from "next";
import { getLocaleDirection, routing } from "@/i18n/routing";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeScript } from "@/components/theme/theme-script";
import { fontClassName } from "@/lib/fonts";
import { DEFAULT_THEME } from "@/lib/theme";
import { getCurrentUser } from "@/services/auth-service";
import { ensureBrowserScopePreference } from "@/lib/scope-context";
import "../globals.css";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("description"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  await ensureBrowserScopePreference();
  const user = await getCurrentUser();
  const dir = getLocaleDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      // Only the fonts this locale needs, plus the always-loaded scripts.
      className={fontClassName(locale)}
      // ThemeScript replaces these before paint from the viewer's preference;
      // they are the neutral default for a first visit and for no-JS.
      data-theme={DEFAULT_THEME}
      data-mode="light"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AppShell user={user}>{children}</AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
