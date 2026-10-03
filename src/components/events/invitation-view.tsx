import { getTranslations } from "next-intl/server";
import type { EventRecord } from "@/repositories/event-repository";
import {
  eventTitle,
  eventVenue,
  formatEventWhen,
} from "@/services/event-service";
import { pickLocalized } from "@/lib/localized";
import { ButtonLink } from "@/components/ui/button";

type Props = {
  hostName: string;
  message: Record<string, string> | null;
  event: EventRecord;
  locale: string;
};

export async function InvitationView({ hostName, message, event, locale }: Props) {
  const t = await getTranslations("events");
  const title = eventTitle(event, locale);
  const venue = eventVenue(event, locale);
  const note = pickLocalized(message, locale);

  return (
    <div className="ds-invitation-card">
      <p className="ds-invitation-card__host">{t("invitesYou", { host: hostName })}</p>
      <h1 className="ds-invitation-card__title">{title}</h1>
      <p className="ds-invitation-card__when">{formatEventWhen(event, locale)}</p>
      {venue ? <p className="ds-invitation-card__venue">{venue}</p> : null}
      {note ? <p className="ds-invitation-card__message">{note}</p> : null}
      <p style={{ marginTop: "var(--ds-space-6)" }}>
        <ButtonLink variant="primary" href={`/events/${event.slug}`}>
          {t("viewEventRsvp")}
        </ButtonLink>
      </p>
    </div>
  );
}
