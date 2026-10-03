export {
  getEventBySlug,
  getInvitationBySlug,
  listEventsByOrganizer,
  listEventsForOrganizations,
  listUpcomingEvents,
  listUserRsvpEvents,
  upsertRsvp,
} from "@/repositories/event-repository";

import type { EventRecord } from "@/repositories/event-repository";
import {
  listEventsForOrganizations,
  listUserRsvpEvents,
} from "@/repositories/event-repository";
import { pickLocalized } from "@/lib/localized";
import { localityRank } from "@/lib/local-discovery";

export type EventMonthGroup = {
  monthKey: string;
  monthLabel: string;
  events: EventRecord[];
};

export function groupEventsByMonth(
  events: EventRecord[],
  locale: string,
): EventMonthGroup[] {
  const groups = new Map<string, EventRecord[]>();
  for (const event of events) {
    const key = `${event.startsAt.getFullYear()}-${String(event.startsAt.getMonth() + 1).padStart(2, "0")}`;
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  return [...groups.entries()].map(([monthKey, monthEvents]) => ({
    monthKey,
    monthLabel: new Date(`${monthKey}-01`).toLocaleDateString(locale, {
      month: "long",
      year: "numeric",
    }),
    events: monthEvents,
  }));
}

export function eventTitle(event: EventRecord, locale: string): string {
  return pickLocalized(event.title, locale);
}

export function eventDescription(event: EventRecord, locale: string): string {
  return pickLocalized(event.description, locale);
}

export function eventVenue(event: EventRecord, locale: string): string {
  return pickLocalized(event.venueName, locale);
}

export function formatEventWhen(event: EventRecord, locale: string): string {
  const date = event.startsAt.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: event.timezone,
  });
  const time = event.startsAt.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: event.timezone,
  });
  return `${date} · ${time}`;
}

export function isEventPast(event: EventRecord): boolean {
  return event.startsAt.getTime() < Date.now();
}

export function isEventHappening(event: EventRecord): boolean {
  const now = Date.now();
  const start = event.startsAt.getTime();
  const end = event.endsAt?.getTime() ?? start + 3_600_000;
  return now >= start && now <= end;
}

/**
 * Splits a list into what is still worth attending and what has passed.
 *
 * The clock is read once here rather than in each page. Reading it inline
 * during a component's render makes that component impure — two reads in one
 * pass can straddle a tick and sort the same event into both halves — and the
 * "is this event over" rule belongs with the rest of the event vocabulary
 * anyway, next to isEventPast and isEventHappening.
 *
 * An event stays in `upcoming` for a day after it starts, so an all-day
 * gathering does not vanish from the listing while people are still at it.
 */
export function partitionEventsByTime(events: EventRecord[]): {
  upcoming: EventRecord[];
  past: EventRecord[];
} {
  const cutoff = Date.now() - 86_400_000;
  const upcoming: EventRecord[] = [];
  const past: EventRecord[] = [];
  for (const event of events) {
    (event.startsAt.getTime() >= cutoff ? upcoming : past).push(event);
  }
  // Most recent first is the useful order for things already over.
  past.reverse();
  return { upcoming, past };
}

/** True while an event is still upcoming by the same one-day grace rule. */
export function isEventUpcoming(event: EventRecord): boolean {
  return event.startsAt.getTime() >= Date.now() - 86_400_000;
}

export function sortEventsLocalFirst(
  events: EventRecord[],
  regionScopeId: string | null,
): EventRecord[] {
  if (!regionScopeId) return events;
  return [...events].sort((a, b) => {
    const rank = localityRank(b.scopeIds, regionScopeId) - localityRank(a.scopeIds, regionScopeId);
    if (rank !== 0) return rank;
    return a.startsAt.getTime() - b.startsAt.getTime();
  });
}

export async function listFollowedEvents(userId: string): Promise<EventRecord[]> {
  const { listSubscribedOrganizationIds } = await import(
    "@/repositories/subscription-repository"
  );
  const [rsvps, orgIds] = await Promise.all([
    listUserRsvpEvents(userId),
    listSubscribedOrganizationIds(userId),
  ]);
  const fromOrgs = await listEventsForOrganizations(orgIds, 40);
  const seen = new Set<string>();
  const merged: EventRecord[] = [];
  for (const event of [...rsvps, ...fromOrgs]) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    merged.push(event);
  }
  return merged.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export function formatEventRemaining(event: EventRecord, locale: string): string | null {
  if (event.cancelled) return null;
  const start = event.startsAt.getTime();
  const end = event.endsAt?.getTime() ?? start + 3_600_000;
  const now = Date.now();
  if (now >= start) return null;

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const ms = start - now;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 90) return rtf.format(Math.max(1, minutes), "minute");
  const hours = Math.round(ms / 3_600_000);
  if (hours < 36) return rtf.format(hours, "hour");
  const days = Math.round(ms / 86_400_000);
  if (days < 45) return rtf.format(days, "day");
  const weeks = Math.round(days / 7);
  return rtf.format(weeks, "week");
}
