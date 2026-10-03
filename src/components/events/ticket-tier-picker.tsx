"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { bookEventTierAction } from "@/app/actions/event-ticket-tier-actions";
import { ButtonLink } from "@/components/ui/button";
import { pickLocalized, type LocalizedString } from "@/lib/localized";

export type TicketTierOption = {
  id: string;
  name: LocalizedString;
  description: LocalizedString | null;
  capacity: number | null;
  bookedCount: number;
};

/**
 * Ticket-tier booking on the org page's events list (§ events with tiers).
 *
 * Anonymous visitors get the sign-in wall's own affordance — a sign-in link
 * carrying this page as the redirect target — rather than a second gate
 * mechanism, matching `SignInWall`'s "sign in, then come back here" pattern.
 */
export function TicketTierPicker({
  eventId,
  tiers,
  locale,
  signedIn,
  bookedTierId,
  redirectHref,
}: {
  eventId: string;
  tiers: TicketTierOption[];
  locale: string;
  signedIn: boolean;
  bookedTierId?: string | null;
  redirectHref: string;
}) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const [pending, startTransition] = useTransition();
  const [pendingTierId, setPendingTierId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookedId, setBookedId] = useState<string | null>(bookedTierId ?? null);

  function book(tierId: string) {
    setError(null);
    setPendingTierId(tierId);
    startTransition(async () => {
      const result = await bookEventTierAction(eventId, tierId);
      if (!result.ok) {
        setError(t(`tierBookingError.${result.error}` as "events.tierBookingError.tier_full"));
        return;
      }
      setBookedId(tierId);
    });
  }

  return (
    <ul className="ds-tier-list">
      {tiers.map((tier) => {
        const name = pickLocalized(tier.name, locale);
        const description = tier.description ? pickLocalized(tier.description, locale) : null;
        const remaining = tier.capacity !== null ? Math.max(0, tier.capacity - tier.bookedCount) : null;
        const full = remaining !== null && remaining <= 0;
        const isBooked = bookedId === tier.id;

        return (
          <li key={tier.id} className="ds-tier-card" data-full={full || undefined}>
            <div className="ds-tier-card__text">
              <p className="ds-tier-card__name">{name}</p>
              {description ? <p className="ds-tier-card__desc">{description}</p> : null}
              {remaining !== null ? (
                <p className="ds-tier-card__capacity">
                  {full ? t("tierFull") : t("tierRemaining", { count: remaining })}
                </p>
              ) : null}
            </div>
            {signedIn ? (
              <button
                type="button"
                className="ds-btn ds-btn--secondary ds-btn--sm"
                disabled={pending || full || isBooked}
                onClick={() => book(tier.id)}
              >
                {isBooked
                  ? t("tierBooked")
                  : pending && pendingTierId === tier.id
                    ? tCommon("working")
                    : t("tierBook")}
              </button>
            ) : (
              <ButtonLink
                href={`/login?redirect=${encodeURIComponent(redirectHref)}` as `/${string}`}
                variant="secondary"
                size="sm"
              >
                {t("signInToRsvp")}
              </ButtonLink>
            )}
          </li>
        );
      })}
      {error ? (
        <li className="ds-field__message ds-field__message--error" role="alert">
          {error}
        </li>
      ) : null}
    </ul>
  );
}
