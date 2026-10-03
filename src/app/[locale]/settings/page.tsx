import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { PageFrame } from "@/components/layout/page-frame";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { canAccessSignedInArea } from "@/lib/permissions";
import { getCurrentUser } from "@/services/auth-service";
import {
  getCurrentUserContentPreferences,
  getPreferenceScopeOptions,
} from "@/services/preference-service";

type PageProps = { params: Promise<{ locale: string }> };

export default async function SettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!canAccessSignedInArea(user)) {
    return redirect({ href: "/login", locale });
  }

  const t = await getTranslations("settings");
  const [prefs, scopeOptions] = await Promise.all([
    getCurrentUserContentPreferences(),
    getPreferenceScopeOptions(locale),
  ]);

  if (!prefs) {
    return redirect({ href: "/login", locale });
  }

  return (
    <PageFrame eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")}>
      <PreferencesForm
        locale={locale}
        prefs={prefs}
        religions={scopeOptions.religions}
        languages={scopeOptions.languages}
        regions={scopeOptions.regions}
      />
    </PageFrame>
  );
}
