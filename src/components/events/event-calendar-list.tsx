import { getTranslations } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import type { EventMonthGroup } from "@/services/event-service";
import { EventCard } from "@/components/events/event-row";

/**
 * A calendar list grouped by month.
 *
 * Months are a rule with a label rather than a heading level, so the page
 * outline stays flat and predictable for a screen reader working through a
 * long list (§38).
 */
export async function EventCalendarList({
  groups,
  locale,
}: {
  groups: EventMonthGroup[];
  locale: string;
}) {
  const t = await getTranslations("events");
  const tStates = await getTranslations("states");

  if (groups.length === 0) {
    return (
      <EmptyState
        title={tStates("emptyEventsTitle")}
        body={tStates("emptyEventsBody")}
        mark={<CalendarDays size={26} strokeWidth={1.25} />}
        actions={
          <ButtonLink href="/explore" variant="secondary">
            {tStates("exploreAction")}
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div>
      {groups.map((group) => (
        <div key={group.monthKey}>
          <p className="ds-month-rule">{group.monthLabel}</p>
          <ul className="ds-list">
            {group.events.map((event) => (
              <li key={event.id}>
                <EventCard event={event} locale={locale} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      <span className="ds-sr-only">{t("upcoming")}</span>
    </div>
  );
}
