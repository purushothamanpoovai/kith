import type {
  EventKind,
  EventVisibility,
  Prisma,
  RsvpMode,
  RsvpStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { LocalizedString } from "@/lib/localized";

export type EventRecord = {
  id: string;
  slug: string;
  kind: EventKind;
  title: LocalizedString;
  description: LocalizedString | null;
  startsAt: Date;
  endsAt: Date | null;
  timezone: string;
  venueName: LocalizedString | null;
  venueAddress: LocalizedString | null;
  onlineUrl: string | null;
  coverImage: string | null;
  language: string;
  organizerId: string;
  organizerName: string;
  organizationId: string | null;
  organizationSlug: string | null;
  organizationName: LocalizedString | null;
  visibility: EventVisibility;
  rsvpMode: RsvpMode;
  cancelled: boolean;
  scopeIds: string[];
  goingCount: number;
  maybeCount: number;
  invitationSlug?: string;
  updatedAt: Date;
};

export type EventDetail = EventRecord & {
  invitation?: {
    id: string;
    slug: string;
    hostName: string;
    message: LocalizedString | null;
    coverImage: string | null;
    visibility: EventVisibility;
    shareToken: string | null;
  };
  userRsvp?: RsvpStatus | null;
};

const eventInclude = {
  organizer: { select: { name: true } },
  organization: { select: { id: true, slug: true, name: true } },
  scopes: { select: { scopeId: true } },
  invitation: true,
  _count: { select: { rsvps: true } },
} as const;

type EventRow = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

function asLocalized(value: unknown): LocalizedString | null {
  if (!value || typeof value !== "object") return null;
  return value as LocalizedString;
}

function mapEvent(row: EventRow, counts?: { going: number; maybe: number }): EventRecord {
  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    title: asLocalized(row.title) ?? {},
    description: asLocalized(row.description),
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    timezone: row.timezone,
    venueName: asLocalized(row.venueName),
    venueAddress: asLocalized(row.venueAddress),
    onlineUrl: row.onlineUrl,
    coverImage: row.coverImage,
    language: row.language,
    organizerId: row.organizerId,
    organizerName: row.organizer.name,
    organizationId: row.organizationId,
    organizationSlug: row.organization?.slug ?? null,
    organizationName: row.organization ? asLocalized(row.organization.name) : null,
    visibility: row.visibility,
    rsvpMode: row.rsvpMode,
    cancelled: row.cancelled,
    scopeIds: row.scopes.map((s) => s.scopeId),
    goingCount: counts?.going ?? 0,
    maybeCount: counts?.maybe ?? 0,
    invitationSlug: row.invitation?.slug,
    updatedAt: row.updatedAt,
  };
}

async function rsvpCounts(eventId: string) {
  const rows = await prisma.rsvp.groupBy({
    by: ["status"],
    where: { eventId },
    _count: true,
  });
  return {
    going: rows.find((r) => r.status === "going")?._count ?? 0,
    maybe: rows.find((r) => r.status === "maybe")?._count ?? 0,
  };
}

export type EventListFilters = {
  organizationIds?: string[];
  scopeIds?: string[];
  kinds?: EventKind[];
  regionScopeId?: string | null;
  /** When true, only events in the region (or unscoped) are returned. */
  regionOnly?: boolean;
  /** An anonymous visitor may only see events explicitly marked `public`
   *  (§ login gate — events); `community`-visibility events need an account,
   *  even though they aren't invite-only. Defaults to the wider set, since
   *  most callers already know their viewer is signed in. */
  anonymousViewer?: boolean;
};

export async function listUpcomingEvents(
  limit = 40,
  filters?: EventListFilters,
): Promise<EventRecord[]> {
  const rows = await prisma.event.findMany({
    where: {
      cancelled: false,
      visibility: filters?.anonymousViewer ? "public" : { in: ["public", "community"] },
      ...(filters?.organizationIds?.length
        ? { organizationId: { in: filters.organizationIds } }
        : {}),
      ...(filters?.kinds?.length ? { kind: { in: filters.kinds } } : {}),
      ...(filters?.scopeIds?.length
        ? { scopes: { some: { scopeId: { in: filters.scopeIds } } } }
        : {}),
      ...(filters?.regionOnly && filters.regionScopeId
        ? { scopes: { some: { scopeId: filters.regionScopeId } } }
        : {}),
    },
    orderBy: { startsAt: "asc" },
    take: limit,
    include: eventInclude,
  });
  const events = await Promise.all(
    rows.map(async (row) => mapEvent(row, await rsvpCounts(row.id))),
  );
  return events;
}

export async function getEventBySlug(
  slug: string,
  userId?: string | null,
): Promise<EventDetail | null> {
  const row = await prisma.event.findUnique({
    where: { slug },
    include: {
      ...eventInclude,
      rsvps: userId ? { where: { userId }, take: 1 } : false,
    },
  });
  if (!row) return null;

  const counts = await rsvpCounts(row.id);
  const base = mapEvent(row, counts);
  const userRsvp: RsvpStatus | null =
    (userId && "rsvps" in row ? row.rsvps?.[0]?.status : null) ?? null;

  return {
    ...base,
    invitation: row.invitation
      ? {
          id: row.invitation.id,
          slug: row.invitation.slug,
          hostName: row.invitation.hostName,
          message: asLocalized(row.invitation.message),
          coverImage: row.invitation.coverImage,
          visibility: row.invitation.visibility,
          shareToken: row.invitation.shareToken,
        }
      : undefined,
    userRsvp,
  };
}

/** Looks an event up by id — used on write paths (ticket-tier management)
 *  where the caller already has a trusted id from the org's own event list. */
export async function getEventById(id: string): Promise<EventRecord | null> {
  const row = await prisma.event.findUnique({ where: { id }, include: eventInclude });
  if (!row) return null;
  return mapEvent(row, await rsvpCounts(row.id));
}

export async function getInvitationBySlug(slug: string) {
  const row = await prisma.invitation.findUnique({
    where: { slug },
    include: {
      event: {
        include: eventInclude,
      },
    },
  });
  if (!row) return null;
  const counts = await rsvpCounts(row.eventId);
  return {
    invitation: row,
    event: mapEvent(row.event, counts),
  };
}

export async function upsertRsvp(
  eventId: string,
  userId: string,
  status: RsvpStatus,
  guestCount = 1,
  tierId?: string | null,
) {
  return prisma.rsvp.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, status, guestCount, tierId: tierId ?? undefined },
    // `tierId` only overwrites when the caller passes one — re-confirming an
    // existing RSVP without mentioning a tier must not silently clear it.
    update: { status, guestCount, ...(tierId !== undefined ? { tierId } : {}) },
  });
}

export type TierBookingResult = "booked" | "tier_full";

/**
 * Books a tier inside one transaction, re-counting immediately before the
 * write rather than trusting a count the caller fetched earlier — two
 * visitors racing for the last slot must not both get seated. Serializable
 * isolation makes the count-then-write atomic against concurrent bookings of
 * the same tier (Postgres detects the write skew and one transaction retries
 * or fails rather than both succeeding).
 */
export async function bookEventTicketTier(
  eventId: string,
  userId: string,
  tierId: string,
): Promise<TierBookingResult> {
  return prisma.$transaction(
    async (tx) => {
      const tier = await tx.eventTicketTier.findUnique({
        where: { id: tierId },
        select: {
          capacity: true,
          _count: { select: { rsvps: { where: { status: { in: ["going", "maybe"] } } } } },
        },
      });
      if (!tier) return "tier_full";

      const alreadyBooked = await tx.rsvp.findUnique({
        where: { eventId_userId: { eventId, userId } },
        select: { tierId: true },
      });
      const bookedCount = tier._count.rsvps;
      const seatsFull =
        tier.capacity !== null &&
        bookedCount >= tier.capacity &&
        alreadyBooked?.tierId !== tierId;
      if (seatsFull) return "tier_full";

      await tx.rsvp.upsert({
        where: { eventId_userId: { eventId, userId } },
        create: { eventId, userId, status: "going", guestCount: 1, tierId },
        update: { status: "going", tierId },
      });
      return "booked";
    },
    { isolationLevel: "Serializable" },
  );
}

/** A user's RSVP (status + booked tier) for a set of events, keyed by eventId —
 *  used by the org page's ticket-tier picker to show "already booked". */
export async function getUserRsvpsForEvents(
  userId: string,
  eventIds: string[],
): Promise<Map<string, { status: RsvpStatus; tierId: string | null }>> {
  if (eventIds.length === 0) return new Map();
  const rows = await prisma.rsvp.findMany({
    where: { userId, eventId: { in: eventIds } },
    select: { eventId: true, status: true, tierId: true },
  });
  return new Map(rows.map((row) => [row.eventId, { status: row.status, tierId: row.tierId }]));
}

export async function listUserRsvpEvents(userId: string): Promise<EventRecord[]> {
  const rows = await prisma.rsvp.findMany({
    where: { userId, status: { in: ["going", "maybe"] } },
    include: { event: { include: eventInclude } },
    orderBy: { event: { startsAt: "asc" } },
  });
  return Promise.all(
    rows.map(async (r) => mapEvent(r.event, await rsvpCounts(r.eventId))),
  );
}

export async function listEventsForOrganizations(
  organizationIds: string[],
  limit = 40,
): Promise<EventRecord[]> {
  if (organizationIds.length === 0) return [];
  return listUpcomingEvents(limit, { organizationIds });
}

/** Every event a user organizes, past or future, cancelled included — the
 *  Studio tab's "what have I made" view, unlike `listUpcomingEvents` which
 *  is a public discovery query gated to future/uncancelled/public events. */
export async function listEventsByOrganizer(
  userId: string,
  limit = 100,
): Promise<EventRecord[]> {
  const rows = await prisma.event.findMany({
    where: { organizerId: userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: eventInclude,
  });
  return Promise.all(rows.map(async (row) => mapEvent(row, await rsvpCounts(row.id))));
}
