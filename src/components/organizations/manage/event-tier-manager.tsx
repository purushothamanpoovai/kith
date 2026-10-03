"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  createEventTicketTierAction,
  deleteEventTicketTierAction,
} from "@/app/actions/event-ticket-tier-actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { pickLocalized } from "@/lib/localized";
import type { EventTicketTierRecord } from "@/repositories/event-ticket-tier-repository";

/**
 * Ticket tiers for one event, plus a read-only booking count per tier
 * (§ manage console — "read-only reporting, not attendee management").
 */
export function EventTierManager({
  eventId,
  eventTitle,
  locale,
  tiers,
  bookings,
}: {
  eventId: string;
  eventTitle: string;
  locale: string;
  tiers: EventTicketTierRecord[];
  bookings: Map<string, { going: number; maybe: number }>;
}) {
  const t = useTranslations("events");
  const tOrg = useTranslations("organizations");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");

  function addTier() {
    setError(null);
    startTransition(async () => {
      const result = await createEventTicketTierAction({
        eventId,
        name,
        description,
        capacity: capacity === "" ? null : Number(capacity),
      });
      if (!result.ok) {
        setError(tOrg("saveFailed"));
        return;
      }
      setName("");
      setDescription("");
      setCapacity("");
    });
  }

  function remove(tierId: string) {
    startTransition(async () => {
      await deleteEventTicketTierAction(eventId, tierId);
    });
  }

  return (
    <div className="ds-card ds-card--pad ds-stack">
      <h3 className="ds-heading-3" dir="auto">{eventTitle}</h3>

      <ul className="ds-stack">
        {tiers.map((tier) => {
          const report = bookings.get(tier.id);
          return (
            <li key={tier.id} className="ds-manage-row">
              <div>
                <p className="ds-manage-row__title" dir="auto">{pickLocalized(tier.name, locale)}</p>
                <p className="ds-hint">
                  {tier.capacity !== null
                    ? `${tier.bookedCount} / ${tier.capacity}`
                    : t("bookingReportUncapped")}
                  {report ? ` · ${t("bookingReportGoing", { count: report.going })}` : ""}
                  {report && report.maybe > 0 ? ` · ${t("bookingReportMaybe", { count: report.maybe })}` : ""}
                </p>
              </div>
              <Button size="sm" variant="danger" onClick={() => remove(tier.id)} disabled={pending}>
                {t("deleteTier")}
              </Button>
            </li>
          );
        })}
      </ul>

      <div className="ds-stack">
        <div className="ds-field-row">
          <Field id={`tier-name-${eventId}`} label={t("tierNameLabel")}>
            <Input id={`tier-name-${eventId}`} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id={`tier-capacity-${eventId}`} label={t("tierCapacityLabel")} optional>
            <Input
              id={`tier-capacity-${eventId}`}
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </Field>
        </div>
        <Field id={`tier-description-${eventId}`} label={t("tierDescriptionLabel")} optional>
          <Textarea
            id={`tier-description-${eventId}`}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        {error ? (
          <p className="ds-field__message ds-field__message--error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="ds-row">
          <Button variant="primary" loading={pending} disabled={!name.trim()} onClick={addTier}>
            {t("addTier")}
          </Button>
        </div>
      </div>
    </div>
  );
}
