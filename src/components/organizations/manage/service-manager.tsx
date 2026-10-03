"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  createOrganizationServiceAction,
  deleteOrganizationServiceAction,
  updateOrganizationServiceAction,
} from "@/app/actions/organization-service-actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { pickLocalized } from "@/lib/localized";
import type { OrganizationServiceRecord } from "@/repositories/organization-service-repository";

const DAY_KEYS = ["0", "1", "2", "3", "4", "5", "6"] as const;

/** Recurring service-timing CRUD (§ manage console) — mass/aarti/namaz/darshan windows. */
export function ServiceManager({
  slug,
  locale,
  services,
}: {
  slug: string;
  locale: string;
  services: OrganizationServiceRecord[];
}) {
  const t = useTranslations("organizations");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");

  function addService() {
    setError(null);
    startTransition(async () => {
      const result = await createOrganizationServiceAction({
        slug,
        name,
        language,
        dayOfWeek: dayOfWeek === "" ? null : Number(dayOfWeek),
        startTime,
        endTime,
        note,
      });
      if (!result.ok) {
        setError(t("saveFailed"));
        return;
      }
      setName("");
      setNote("");
    });
  }

  function verify(service: OrganizationServiceRecord) {
    startTransition(async () => {
      await updateOrganizationServiceAction({ slug, id: service.id, verified: true });
    });
  }

  function remove(service: OrganizationServiceRecord) {
    if (!window.confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      await deleteOrganizationServiceAction(slug, service.id);
    });
  }

  return (
    <div className="ds-stack">
      <ul className="ds-stack">
        {services.map((service) => (
          <li key={service.id} className="ds-card ds-card--pad ds-manage-row">
            <div>
              <p className="ds-manage-row__title" dir="auto">
                {pickLocalized(service.name, locale)}
              </p>
              <p className="ds-hint">
                {service.dayOfWeek === null ? t("serviceDayAny") : t(`days.${DAY_KEYS[service.dayOfWeek]}` as "organizations.days.0")}
                {" · "}
                {service.startTime}
                {service.endTime ? `–${service.endTime}` : ""}
                {" · "}
                {service.language.toUpperCase()}
              </p>
              <p className="ds-hint">
                {service.verifiedAt
                  ? t("serviceVerified", { date: service.verifiedAt.toLocaleDateString(locale) })
                  : t("serviceUnverified")}
              </p>
            </div>
            <div className="ds-row ds-row--tight">
              {!service.verifiedAt ? (
                <Button size="sm" onClick={() => verify(service)} disabled={pending}>
                  {t("serviceVerify")}
                </Button>
              ) : null}
              <Button size="sm" variant="danger" onClick={() => remove(service)} disabled={pending}>
                {t("deleteService")}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="ds-card ds-card--pad ds-stack">
        <h3 className="ds-heading-3">{t("addService")}</h3>
        <div className="ds-field-row">
          <Field id="service-name" label={t("serviceNameLabel")}>
            <Input id="service-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="service-language" label={t("serviceLanguageLabel")}>
            <Input
              id="service-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              maxLength={5}
            />
          </Field>
        </div>
        <div className="ds-field-row">
          <Field id="service-day" label={t("serviceDayLabel")}>
            <Select id="service-day" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
              <option value="">{t("serviceDayAny")}</option>
              {DAY_KEYS.map((day) => (
                <option key={day} value={day}>
                  {t(`days.${day}` as "organizations.days.0")}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="service-start" label={t("serviceStartLabel")}>
            <Input
              id="service-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </Field>
          <Field id="service-end" label={t("serviceEndLabel")} optional>
            <Input
              id="service-end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </Field>
        </div>
        <Field id="service-note" label={t("serviceNoteLabel")} optional>
          <Input id="service-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {error ? (
          <p className="ds-field__message ds-field__message--error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="ds-row">
          <Button
            variant="primary"
            loading={pending}
            disabled={!name.trim() || !startTime}
            onClick={addService}
          >
            {t("addService")}
          </Button>
        </div>
      </div>
    </div>
  );
}
