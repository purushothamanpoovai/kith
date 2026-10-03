"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import type { RsvpStatus } from "@/generated/prisma/client";
import { rsvpAction } from "@/app/actions/event-actions";

type Props = {
  eventId: string;
  current: RsvpStatus | null;
  signedIn: boolean;
  rsvpMode: string;
};

export function RsvpPicker({ eventId, current, signedIn, rsvpMode }: Props) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const [pending, startTransition] = useTransition();

  if (rsvpMode === "closed") {
    return <p className="ds-hint">{t("rsvpClosed")}</p>;
  }

  const options: RsvpStatus[] = ["going", "maybe", "not_going"];

  return (
    <div className="ds-rsvp-picker" aria-label={t("rsvpLabel")} aria-busy={pending}>
      {options.map((status) => (
        <button
          key={status}
          type="button"
          aria-pressed={current === status}
          disabled={!signedIn || pending}
          onClick={() => {
            startTransition(() => {
              void rsvpAction(eventId, status);
            });
          }}
        >
          {pending && current === status ? tCommon("working") : t(`rsvp.${status}` as "events.rsvp.going")}
        </button>
      ))}
      {!signedIn ? <span className="ds-hint">{t("signInToRsvp")}</span> : null}
    </div>
  );
}
