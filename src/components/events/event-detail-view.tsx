import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { EventDetail } from "@/repositories/event-repository";
import { RsvpPicker } from "@/components/events/rsvp-picker";
import { ReportForm } from "@/components/moderation/report-form";
import {
  eventDescription,
  eventTitle,
  eventVenue,
  formatEventRemaining,
  formatEventWhen,
  isEventHappening,
} from "@/services/event-service";
import { pickLocalized } from "@/lib/localized";

type Props = {
  event: EventDetail;
  locale: string;
  signedIn: boolean;
};

export async function EventDetailView({ event, locale, signedIn }: Props) {
  const t = await getTranslations("events");
  const tCommon = await getTranslations("common");
  const title = eventTitle(event, locale);
  const description = eventDescription(event, locale);
  const venue = eventVenue(event, locale);
  const address = pickLocalized(event.venueAddress, locale);
  const remaining = formatEventRemaining(event, locale);
  const happening = isEventHappening(event);
  const orgName = pickLocalized(event.organizationName, locale);

  return (
    <article className="ds-event-detail">
      <span className="ds-kicker ds-caps">{t(`kind.${event.kind}` as "events.kind.gathering")}</span>
      <h1 className="ds-article__title">{title}</h1>
      {event.cancelled ? (
        <p className="ds-label-chip">{tCommon("cancelled")}</p>
      ) : happening ? (
        <p className="ds-label-chip">{t("happeningNow")}</p>
      ) : remaining ? (
        <p className="ds-label-chip">{t("startsIn", { remaining })}</p>
      ) : null}

      <div className="ds-event-detail__when">
        <div className="ds-event-detail__when-block">
          <p className="ds-event-detail__when-label">{t("when")}</p>
          <p className="ds-event-detail__when-value">{formatEventWhen(event, locale)}</p>
        </div>
        <div className="ds-event-detail__when-block">
          <p className="ds-event-detail__when-label">{t("hostedBy")}</p>
          <p className="ds-event-detail__when-value">
            {event.organizationSlug ? (
              <Link href={`/org/${event.organizationSlug}`}>{orgName || event.organizerName}</Link>
            ) : (
              event.organizerName
            )}
          </p>
        </div>
      </div>

      {(venue || event.onlineUrl) && (
        <div className="ds-event-detail__when">
          {venue ? (
            <div className="ds-event-detail__when-block">
              <p className="ds-event-detail__when-label">{t("where")}</p>
              <p className="ds-event-detail__when-value">{venue}</p>
              {address ? <p className="ds-hint">{address}</p> : null}
            </div>
          ) : null}
          {event.onlineUrl ? (
            <div className="ds-event-detail__when-block">
              <p className="ds-event-detail__when-label">{tCommon("online")}</p>
              <p className="ds-event-detail__when-value">
                <a href={event.onlineUrl} target="_blank" rel="noreferrer">
                  {t("joinLink")}
                </a>
              </p>
            </div>
          ) : null}
        </div>
      )}

      {description ? <p className="ds-article__standfirst">{description}</p> : null}

      <RsvpPicker
        eventId={event.id}
        current={event.userRsvp ?? null}
        signedIn={signedIn}
        rsvpMode={event.rsvpMode}
      />

      {event.goingCount > 0 || event.maybeCount > 0 ? (
        <p className="ds-hint">
          {t("goingSummary", { going: event.goingCount, maybe: event.maybeCount })}
        </p>
      ) : null}

      {event.invitation ? (
        <p className="ds-hint">
          <Link href={`/invitations/${event.invitation.slug}`}>{t("viewInvitation")}</Link>
        </p>
      ) : null}

      <ReportForm targetType="event" targetId={event.id} signedIn={signedIn} />
    </article>
  );
}
