"use server";

import { revalidatePath } from "next/cache";
import type { RsvpStatus } from "@/generated/prisma/client";
import { upsertRsvp } from "@/repositories/event-repository";
import { getCurrentUser } from "@/services/auth-service";

export async function rsvpAction(eventId: string, status: RsvpStatus, guestCount = 1) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "auth_required" };
  await upsertRsvp(eventId, user.id, status, guestCount);
  revalidatePath("/", "layout");
  return { ok: true as const, status };
}
