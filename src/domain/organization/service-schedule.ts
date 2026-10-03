import type { OrganizationServiceRecord } from "@/repositories/organization-service-repository";

/**
 * "Is it open now" / "today's services" (§ visit info).
 *
 * OrganizationService times are local wall-clock strings ("06:00") plus the
 * institution's own timezone — never absolute instants — so a service at 6am
 * in Shirdi is at 6am Indian time regardless of where or when the page is
 * read. `Intl.DateTimeFormat` with a `timeZone` option converts "now" into
 * that same wall-clock frame without pulling in a date library.
 */

function wallClockNow(timezone: string): { dayOfWeek: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const weekdayShort = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeek = WEEKDAYS.indexOf(weekdayShort);

  return { dayOfWeek: dayOfWeek < 0 ? 0 : dayOfWeek, minutes: hour * 60 + minute };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** A service with `dayOfWeek: null` runs every day. */
function runsToday(service: OrganizationServiceRecord, dayOfWeek: number): boolean {
  return service.dayOfWeek === null || service.dayOfWeek === dayOfWeek;
}

export type ServiceOccurrence = {
  service: OrganizationServiceRecord;
  isOpenNow: boolean;
};

/**
 * Today's services in the organization's own timezone, each flagged with
 * whether it's currently within its window. An open-ended service (no
 * `endTime`) is treated as a point-in-time occurrence, never "open now".
 */
export function getTodaysServices(
  services: OrganizationServiceRecord[],
  timezone: string,
): ServiceOccurrence[] {
  const { dayOfWeek, minutes: nowMinutes } = wallClockNow(timezone);

  return services
    .filter((service) => runsToday(service, dayOfWeek))
    .map((service) => {
      const start = toMinutes(service.startTime);
      const end = service.endTime ? toMinutes(service.endTime) : null;
      const isOpenNow = end !== null && nowMinutes >= start && nowMinutes < end;
      return { service, isOpenNow };
    })
    .sort((a, b) => toMinutes(a.service.startTime) - toMinutes(b.service.startTime));
}

export function isAnyServiceOpenNow(
  services: OrganizationServiceRecord[],
  timezone: string,
): boolean {
  return getTodaysServices(services, timezone).some((occ) => occ.isOpenNow);
}
