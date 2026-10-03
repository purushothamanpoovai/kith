import { prisma } from "@/lib/db";
import type { LocalizedString } from "@/lib/localized";

export type EventTicketTierRecord = {
  id: string;
  eventId: string;
  name: LocalizedString;
  description: LocalizedString | null;
  capacity: number | null;
  sortOrder: number;
  /** Going + maybe RSVPs booked against this tier, for "N of capacity left". */
  bookedCount: number;
};

function asLocalized(value: unknown): LocalizedString | null {
  if (!value || typeof value !== "object") return null;
  return value as LocalizedString;
}

/** Every tier for an event, with a booked-count derived from non-cancelled RSVPs. */
export async function listEventTicketTiers(eventId: string): Promise<EventTicketTierRecord[]> {
  const rows = await prisma.eventTicketTier.findMany({
    where: { eventId },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { rsvps: { where: { status: { in: ["going", "maybe"] } } } } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    eventId: row.eventId,
    name: asLocalized(row.name) ?? {},
    description: asLocalized(row.description),
    capacity: row.capacity,
    sortOrder: row.sortOrder,
    bookedCount: row._count.rsvps,
  }));
}

export type CreateEventTicketTierInput = {
  id: string;
  eventId: string;
  name: LocalizedString;
  description?: LocalizedString | null;
  capacity?: number | null;
  sortOrder?: number;
};

export async function createEventTicketTier(input: CreateEventTicketTierInput) {
  return prisma.eventTicketTier.create({
    data: {
      id: input.id,
      eventId: input.eventId,
      name: input.name,
      description: input.description ?? undefined,
      capacity: input.capacity ?? null,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export type UpdateEventTicketTierInput = {
  name?: LocalizedString;
  description?: LocalizedString | null;
  capacity?: number | null;
  sortOrder?: number;
};

export async function updateEventTicketTier(
  id: string,
  eventId: string,
  input: UpdateEventTicketTierInput,
) {
  return prisma.eventTicketTier.updateMany({
    where: { id, eventId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description ?? undefined } : {}),
      ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });
}

export async function deleteEventTicketTier(id: string, eventId: string) {
  return prisma.eventTicketTier.deleteMany({ where: { id, eventId } });
}

/**
 * Attendee counts per tier for an event, for the manage console's read-only
 * RSVP report. Grouped by (tierId, status) in one query rather than N+1.
 */
export async function getEventTierBookingReport(eventId: string) {
  const [tiers, grouped] = await Promise.all([
    listEventTicketTiers(eventId),
    prisma.rsvp.groupBy({
      by: ["tierId", "status"],
      where: { eventId },
      _count: true,
    }),
  ]);
  return tiers.map((tier) => ({
    tier,
    going: grouped.find((g) => g.tierId === tier.id && g.status === "going")?._count ?? 0,
    maybe: grouped.find((g) => g.tierId === tier.id && g.status === "maybe")?._count ?? 0,
  }));
}
