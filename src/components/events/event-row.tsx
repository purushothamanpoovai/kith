import { getTranslations } from "next-intl/server";
import { Clock, Globe, MapPin, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { EventRecord } from "@/repositories/event-repository";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  eventTitle,
  eventVenue,
  formatEventRemaining,
  formatEventWhen,
  isEventHappening,
  isEventPast,
} from "@/services/event-service";
import { pickLocalized } from "@/lib/localized";

/**
 * An event in a list (§32).
 *
 * A strong date block leads, because "when" is what a reader scans an event
 * list for. The facts underneath are each labelled by an icon *and* carried
 * as text, so nothing depends on recognising a glyph.
 */
export async function EventCard({
  event,
  locale,
}: {
  event: EventRecord;
  locale: string;
}) {
  const t = await getTranslations("events");
  const tCommon = await getTranslations("common");
  const title = eventTitle(event, locale);
  const venue = eventVenue(event, locale);
  const past = isEventPast(event);
  const happening = isEventHappening(event);
  const remaining = happening ? null : formatEventRemaining(event, locale);
  const orgName = pickLocalized(event.organizationName, locale);

  const day = event.startsAt.toLocaleDateString(locale, {
    day: "numeric",
    timeZone: event.timezone,
  });
  const month = event.startsAt.toLocaleDateString(locale, {
    month: "short",
    timeZone: event.timezone,
  });
  const weekday = event.startsAt.toLocaleDateString(locale, {
    weekday: "short",
    timeZone: event.timezone,
  });

  return (
    <article className="ds-card ds-event-card">
      <div
        className={`ds-date-block${past ? " ds-date-block--past" : ""}`}
        aria-hidden
      >
        <span className="ds-date-block__month">{month}</span>
        <span className="ds-date-block__day">{day}</span>
        <span className="ds-date-block__weekday">{weekday}</span>
      </div>

      <div className="ds-event-card__body">
        <div className="ds-row ds-row--tight">
          <Badge tone="accent">{t(`kind.${event.kind}` as "kind.gathering")}</Badge>
          {event.cancelled ? (
            <Badge tone="danger">{tCommon("cancelled")}</Badge>
          ) : happening ? (
            <Badge tone="accent">{t("happeningNow")}</Badge>
          ) : remaining ? (
            <Badge tone="neutral">{remaining}</Badge>
          ) : null}
          {event.language ? (
            <Badge tone="neutral">{event.language.toUpperCase()}</Badge>
          ) : null}
        </div>

        <h3 className="ds-event-card__title">
          <Link href={`/events/${event.slug}`}>{title}</Link>
        </h3>

        <div className="ds-event-card__facts">
          <span className="ds-event-card__fact">
            <Clock size={13} strokeWidth={1.75} aria-hidden />
            <time dateTime={event.startsAt.toISOString()}>
              {formatEventWhen(event, locale)}
            </time>
          </span>
          {venue ? (
            <span className="ds-event-card__fact">
              <MapPin size={13} strokeWidth={1.75} aria-hidden />
              {venue}
            </span>
          ) : null}
          {event.onlineUrl ? (
            <span className="ds-event-card__fact">
              <Globe size={13} strokeWidth={1.75} aria-hidden />
              {tCommon("online")}
            </span>
          ) : null}
          <span className="ds-event-card__fact">
            <Users size={13} strokeWidth={1.75} aria-hidden />
            {t("hostedBy")}: {orgName || event.organizerName}
          </span>
          {event.goingCount > 0 ? (
            <span className="ds-event-card__fact">
              {t("goingCount", { count: event.goingCount })}
            </span>
          ) : null}
        </div>

        <div className="ds-event-card__actions">
          <ButtonLink href={`/events/${event.slug}`} variant="secondary" size="sm">
            {t("viewEventRsvp")}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

/** Kept for callers that still import the previous name. */
export { EventCard as EventRow };
