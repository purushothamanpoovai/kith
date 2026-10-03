"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import type { AuthUser } from "@/domain/auth/types";
import { PermissionAction } from "@/domain/permissions/actions";
import { can } from "@/services/permission-service";
import { getCurrentUser } from "@/services/auth-service";
import {
  bookEventTicketTier,
  getEventById,
  type EventRecord,
} from "@/repositories/event-repository";
import {
  createEventTicketTier,
  deleteEventTicketTier,
  listEventTicketTiers,
  updateEventTicketTier,
} from "@/repositories/event-ticket-tier-repository";
import { createId } from "@/lib/ids";

/**
 * Ticket-tier CRUD (org_admin / event_manager) and tier booking (any signed-in
 * visitor). Still no payment — a tier is structured access + headcount, not a
 * purchase, consistent with the platform's no-in-app-payment pattern.
 */

const MAX_NAME = 80;
const MAX_DESCRIPTION = 500;

export type TierActionResult = { ok: true } | { ok: false; error: string };

type EventManagerGate =
  | { error: "auth_required" | "not_found" | "not_authorized" }
  | { user: AuthUser; event: EventRecord };

async function requireEventManager(eventId: string): Promise<EventManagerGate> {
  const user = await getCurrentUser();
  if (!user) return { error: "auth_required" };

  const event = await getEventById(eventId);
  if (!event) return { error: "not_found" };

  const allowed = await can(user, PermissionAction.EVENT_MANAGE, {
    organizationId: event.organizationId ?? undefined,
    eventId,
  });
  if (!allowed) return { error: "not_authorized" };

  return { user, event };
}

export async function createEventTicketTierAction(input: {
  eventId: string;
  name: string;
  description?: string;
  capacity?: number | null;
}): Promise<TierActionResult> {
  const gate = await requireEventManager(input.eventId);
  if ("error" in gate) return { ok: false, error: gate.error };

  const name = input.name.trim().slice(0, MAX_NAME);
  if (!name) return { ok: false, error: "name_required" };
  if (input.capacity !== undefined && input.capacity !== null && input.capacity < 0) {
    return { ok: false, error: "capacity_invalid" };
  }

  const locale = await getLocale();

  try {
    const existing = await listEventTicketTiers(input.eventId);
    await createEventTicketTier({
      id: `tier_${createId()}`,
      eventId: input.eventId,
      name: { [locale]: name },
      description: input.description?.trim()
        ? { [locale]: input.description.trim().slice(0, MAX_DESCRIPTION) }
        : undefined,
      capacity: input.capacity ?? null,
      sortOrder: existing.length,
    });

    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}

export async function updateEventTicketTierAction(input: {
  eventId: string;
  id: string;
  name?: string;
  description?: string;
  capacity?: number | null;
}): Promise<TierActionResult> {
  const gate = await requireEventManager(input.eventId);
  if ("error" in gate) return { ok: false, error: gate.error };

  if (input.capacity !== undefined && input.capacity !== null && input.capacity < 0) {
    return { ok: false, error: "capacity_invalid" };
  }

  const locale = await getLocale();

  try {
    await updateEventTicketTier(input.id, input.eventId, {
      name: input.name?.trim() ? { [locale]: input.name.trim().slice(0, MAX_NAME) } : undefined,
      description:
        input.description !== undefined
          ? input.description.trim()
            ? { [locale]: input.description.trim().slice(0, MAX_DESCRIPTION) }
            : null
          : undefined,
      capacity: input.capacity,
    });

    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}

export async function deleteEventTicketTierAction(
  eventId: string,
  id: string,
): Promise<TierActionResult> {
  const gate = await requireEventManager(eventId);
  if ("error" in gate) return { ok: false, error: gate.error };

  try {
    await deleteEventTicketTier(id, eventId);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}

export type BookTierResult =
  | { ok: true }
  | { ok: false; error: "auth_required" | "not_found" | "tier_full" | "save_failed" };

/**
 * Books a signed-in visitor into a specific tier — an RSVP with `tierId` set.
 * The capacity check and the write happen inside one serializable transaction
 * (`bookEventTicketTier`), not a check here followed by a separate write, so
 * two visitors racing for the last slot cannot both get seated.
 */
export async function bookEventTierAction(
  eventId: string,
  tierId: string,
): Promise<BookTierResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "auth_required" };

  const allowed = await can(user, PermissionAction.EVENT_RSVP);
  if (!allowed) return { ok: false, error: "auth_required" };

  try {
    const result = await bookEventTicketTier(eventId, user.id, tierId);
    if (result === "tier_full") return { ok: false, error: "tier_full" };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    // Includes a serialization failure under real contention for the same
    // tier — surfaced as a generic retryable failure rather than a 500.
    return { ok: false, error: "save_failed" };
  }
}
