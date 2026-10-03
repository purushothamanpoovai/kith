"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { ContentFocusMode } from "@/generated/prisma/client";
import type { UserContentPreferences } from "@/domain/user/preferences";
import { pickLocalized } from "@/lib/localized";
import { routing } from "@/i18n/routing";
import { useRouter } from "@/i18n/navigation";
import { updatePreferencesAction } from "@/app/actions/preference-actions";
import type { ScopeRecord } from "@/repositories/scope-repository";
import { LANGUAGES } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Choice, Field, Select } from "@/components/ui/field";

type Props = {
  locale: string;
  prefs: UserContentPreferences;
  religions: ScopeRecord[];
  languages: ScopeRecord[];
  regions: ScopeRecord[];
};

export function PreferencesForm({
  locale,
  prefs,
  religions,
  languages,
  regions,
}: Props) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uiLocale, setUiLocale] = useState(prefs.locale);
  const [primaryLanguage, setPrimaryLanguage] = useState(prefs.primaryLanguage);
  const [focusMode, setFocusMode] = useState<ContentFocusMode>(prefs.contentFocusMode);
  const [religionId, setReligionId] = useState(prefs.focusReligionScopeId ?? "");
  const [languageId, setLanguageId] = useState(prefs.focusLanguageScopeId ?? "");
  const [regionId, setRegionId] = useState(prefs.focusRegionScopeId ?? "");

  const hasFocus = Boolean(religionId || languageId || regionId);

  function scopeLabel(scope: ScopeRecord) {
    return pickLocalized(scope.title, locale);
  }

  function languageLabel(code: string) {
    return LANGUAGES.find((language) => language.code === code)?.endonym ?? code;
  }

  return (
    <form
      className="ds-form"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        setError(null);

        if (focusMode === "focused" && !hasFocus) {
          setError(t("errorFocusRequired"));
          return;
        }

        startTransition(async () => {
          const result = await updatePreferencesAction({
            locale: uiLocale,
            primaryLanguage,
            contentFocusMode: focusMode,
            focusReligionScopeId: religionId,
            focusLanguageScopeId: languageId,
            focusRegionScopeId: regionId,
          });

          if (!result.ok) {
            setError(t("errorSave"));
            return;
          }

          setSaved(true);
          if (uiLocale !== locale) {
            router.replace("/settings", { locale: uiLocale });
          } else {
            router.refresh();
          }
        });
      }}
    >
      <section className="ds-card ds-card--pad ds-stack">
        <div>
          <h2 className="ds-heading-3">{t("languageSection")}</h2>
          <p className="ds-caption">{t("languageSectionHint")}</p>
        </div>

        <div className="ds-field-row">
          <Field id="pref-ui-locale" label={t("uiLocale")}>
            <Select
              id="pref-ui-locale"
              value={uiLocale}
              onChange={(e) => setUiLocale(e.target.value)}
            >
              {routing.locales.map((code) => (
                <option key={code} value={code} lang={code}>
                  {languageLabel(code)}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="pref-primary-language" label={t("primaryLanguage")}>
            <Select
              id="pref-primary-language"
              value={primaryLanguage}
              onChange={(e) => setPrimaryLanguage(e.target.value)}
            >
              {routing.locales.map((code) => (
                <option key={code} value={code} lang={code}>
                  {languageLabel(code)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section className="ds-card ds-card--pad ds-stack">
        <div>
          <h2 className="ds-heading-3">{t("focusSection")}</h2>
          <p className="ds-caption">{t("focusSectionHint")}</p>
        </div>

        <fieldset className="ds-fieldset">
          <legend className="ds-sr-only">{t("focusMode")}</legend>
          <Choice title={t("focusModeAll")} description={t("focusModeAllHint")}>
            <input
              type="radio"
              name="focusMode"
              value="all"
              checked={focusMode === "all"}
              onChange={() => setFocusMode("all")}
            />
          </Choice>
          <Choice title={t("focusModeFocused")} description={t("focusModeFocusedHint")}>
            <input
              type="radio"
              name="focusMode"
              value="focused"
              checked={focusMode === "focused"}
              onChange={() => setFocusMode("focused")}
            />
          </Choice>
        </fieldset>

        <div className="ds-field-row">
          <Field id="pref-focus-religion" label={t("focusReligion")}>
            <Select
              id="pref-focus-religion"
              value={religionId}
              onChange={(e) => setReligionId(e.target.value)}
            >
              <option value="">{t("focusNone")}</option>
              {religions.map((scope) => (
                <option key={scope.id} value={scope.id}>
                  {scopeLabel(scope)}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="pref-focus-language" label={t("focusLanguage")}>
            <Select
              id="pref-focus-language"
              value={languageId}
              onChange={(e) => setLanguageId(e.target.value)}
            >
              <option value="">{t("focusNone")}</option>
              {languages.map((scope) => (
                <option key={scope.id} value={scope.id}>
                  {scopeLabel(scope)}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="pref-focus-region" label={t("focusRegion")} hint={t("focusRegionHint")}>
            <Select
              id="pref-focus-region"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
            >
              <option value="">{t("focusNone")}</option>
              {regions.map((scope) => (
                <option key={scope.id} value={scope.id}>
                  {scopeLabel(scope)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      {error ? (
        <p className="ds-field__message ds-field__message--error" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="ds-field__message ds-field__message--success" role="status">
          {t("saved")}
        </p>
      ) : null}

      <div className="ds-row">
        <Button type="submit" variant="primary" loading={pending}>
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
