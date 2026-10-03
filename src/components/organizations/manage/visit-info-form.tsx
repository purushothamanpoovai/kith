"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateOrganizationVisitInfoAction } from "@/app/actions/organization-visit-info-actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { pickLocalized, type LocalizedString } from "@/lib/localized";

/**
 * The visit-info editor (§ manage console).
 *
 * Every field edits only the current UI locale's value in the underlying
 * localized map — same merge behaviour as `updateOrganizationProfileAction`,
 * so editing the English address never erases the Tamil one.
 */
export function VisitInfoForm({
  slug,
  locale,
  timezone,
  address,
  howToReach,
  dressCode,
  entryRules,
  accessibility,
  donationUrl,
}: {
  slug: string;
  locale: string;
  timezone: string;
  address: LocalizedString | null;
  howToReach: LocalizedString | null;
  dressCode: LocalizedString | null;
  entryRules: LocalizedString | null;
  accessibility: LocalizedString | null;
  donationUrl: string | null;
}) {
  const t = useTranslations("organizations");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tz, setTz] = useState(timezone);
  const [addressValue, setAddressValue] = useState(address ? pickLocalized(address, locale) : "");
  const [howToReachValue, setHowToReachValue] = useState(
    howToReach ? pickLocalized(howToReach, locale) : "",
  );
  const [dressCodeValue, setDressCodeValue] = useState(
    dressCode ? pickLocalized(dressCode, locale) : "",
  );
  const [entryRulesValue, setEntryRulesValue] = useState(
    entryRules ? pickLocalized(entryRules, locale) : "",
  );
  const [accessibilityValue, setAccessibilityValue] = useState(
    accessibility ? pickLocalized(accessibility, locale) : "",
  );
  const [donationUrlValue, setDonationUrlValue] = useState(donationUrl ?? "");

  return (
    <form
      className="ds-form"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        setError(null);
        startTransition(async () => {
          const result = await updateOrganizationVisitInfoAction({
            slug,
            timezone: tz,
            address: addressValue,
            howToReach: howToReachValue,
            dressCode: dressCodeValue,
            entryRules: entryRulesValue,
            accessibility: accessibilityValue,
            donationUrl: donationUrlValue,
          });
          if (!result.ok) {
            setError(t("saveFailed"));
            return;
          }
          setSaved(true);
        });
      }}
    >
      <div className="ds-field-row">
        <Field id="visit-timezone" label={t("timezoneFieldLabel")}>
          <Input id="visit-timezone" value={tz} onChange={(e) => setTz(e.target.value)} />
        </Field>
        <Field id="visit-donation" label={t("donationUrlFieldLabel")} optional>
          <Input
            id="visit-donation"
            type="url"
            value={donationUrlValue}
            onChange={(e) => setDonationUrlValue(e.target.value)}
            placeholder="https://…"
          />
        </Field>
      </div>

      <Field id="visit-address" label={t("addressFieldLabel")}>
        <Textarea
          id="visit-address"
          rows={2}
          value={addressValue}
          onChange={(e) => setAddressValue(e.target.value)}
        />
      </Field>

      <Field id="visit-how-to-reach" label={t("howToReachFieldLabel")}>
        <Textarea
          id="visit-how-to-reach"
          rows={3}
          value={howToReachValue}
          onChange={(e) => setHowToReachValue(e.target.value)}
        />
      </Field>

      <div className="ds-field-row">
        <Field id="visit-dress-code" label={t("dressCodeFieldLabel")}>
          <Textarea
            id="visit-dress-code"
            rows={2}
            value={dressCodeValue}
            onChange={(e) => setDressCodeValue(e.target.value)}
          />
        </Field>
        <Field id="visit-entry-rules" label={t("entryRulesFieldLabel")}>
          <Textarea
            id="visit-entry-rules"
            rows={2}
            value={entryRulesValue}
            onChange={(e) => setEntryRulesValue(e.target.value)}
          />
        </Field>
      </div>

      <Field id="visit-accessibility" label={t("accessibilityFieldLabel")}>
        <Textarea
          id="visit-accessibility"
          rows={2}
          value={accessibilityValue}
          onChange={(e) => setAccessibilityValue(e.target.value)}
        />
      </Field>

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
          {t("saveChanges")}
        </Button>
      </div>
    </form>
  );
}
