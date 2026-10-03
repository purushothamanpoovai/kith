import { getTranslations } from "next-intl/server";
import type { RsvpStatus } from "@/generated/prisma/client";
import type { EventRecord } from "@/repositories/event-repository";
import type { EventTicketTierRecord } from "@/repositories/event-ticket-tier-repository";
import { TicketTierPicker } from "@/components/events/ticket-tier-picker";
import { eventTitle, formatEventWhen } from "@/services/event-service";
import { Link } from "@/i18n/navigation";

/**
 * Ticketed events on the org page (§ events with ticket tiers). An event
 * with no tiers is left to the plain EventCard list elsewhere on this page —
 * this component only renders the subset that actually has tiers, so the
 * "omit when empty" rule applies per-event as well as to the section itself.
 */
export async function OrgTicketedEvents({
  events,
  tiersByEventId,
  locale,
  signedIn,
  userRsvpByEventId,
  orgSlug,
}: {
  events: EventRecord[];
  tiersByEventId: Map<string, EventTicketTierRecord[]>;
  locale: string;
  signedIn: boolean;
  userRsvpByEventId: Map<string, { status: RsvpStatus; tierId: string | null }>;
  orgSlug: string;
}) {
  const ticketed = events.filter((event) => (tiersByEventId.get(event.id)?.length ?? 0) > 0);
  if (ticketed.length === 0) return null;

  const t = await getTranslations("events");

  return (
    <ul className="ds-stack ds-stack--lg">
      {ticketed.map((event) => {
        const tiers = tiersByEventId.get(event.id) ?? [];
        const userRsvp = userRsvpByEventId.get(event.id);
        return (
          <li key={event.id} className="ds-card ds-card--pad ds-ticketed-event">
            <div className="ds-ticketed-event__head">
              <h3 className="ds-heading-3">
                <Link href={`/events/${event.slug}` as `/${string}`}>{eventTitle(event, locale)}</Link>
              </h3>
              <p className="ds-hint">{formatEventWhen(event, locale)}</p>
            </div>
            <p className="ds-caption">{t("tiersLabel")}</p>
            <TicketTierPicker
              eventId={event.id}
              tiers={tiers}
              locale={locale}
              signedIn={signedIn}
              bookedTierId={userRsvp?.tierId ?? null}
              redirectHref={`/org/${orgSlug}`}
            />
          </li>
        );
      })}
    </ul>
  );
}
