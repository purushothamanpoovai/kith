"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import type { AuthUser } from "@/domain/auth/types";
import { PermissionAction } from "@/domain/permissions/actions";
import { can } from "@/services/permission-service";
import { getCurrentUser } from "@/services/auth-service";
import {
  getOrganizationBySlug,
  writeAuditLog,
  type OrganizationRecord,
} from "@/repositories/organization-repository";
import {
  createOrganizationService,
  deleteOrganizationService,
  updateOrganizationService,
} from "@/repositories/organization-service-repository";
import { createId } from "@/lib/ids";

/**
 * CRUD for recurring service timings (mass/aarti/namaz/darshan windows).
 * Gated the same as visit-info: an org_admin sets the institution's own
 * schedule, since a wrong timing here means a wasted pilgrimage.
 */

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export type ServiceActionResult = { ok: true } | { ok: false; error: string };

type OrgAdminGate =
  | { error: "auth_required" | "not_found" | "not_authorized" }
  | { user: AuthUser; org: OrganizationRecord };

async function requireOrgAdmin(slug: string): Promise<OrgAdminGate> {
  const user = await getCurrentUser();
  if (!user) return { error: "auth_required" };

  const org = await getOrganizationBySlug(slug);
  if (!org) return { error: "not_found" };

  const allowed = await can(user, PermissionAction.ORGANIZATION_MANAGE, {
    organizationId: org.id,
  });
  if (!allowed) return { error: "not_authorized" };

  return { user, org };
}

export async function createOrganizationServiceAction(input: {
  slug: string;
  name: string;
  language: string;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  note?: string;
}): Promise<ServiceActionResult> {
  const gate = await requireOrgAdmin(input.slug);
  if ("error" in gate) return { ok: false, error: gate.error };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "name_required" };
  if (!TIME_PATTERN.test(input.startTime)) return { ok: false, error: "start_time_invalid" };
  if (input.endTime && !TIME_PATTERN.test(input.endTime)) {
    return { ok: false, error: "end_time_invalid" };
  }

  const locale = await getLocale();

  try {
    await createOrganizationService({
      id: `orgsvc_${createId()}`,
      organizationId: gate.org.id,
      name: { [locale]: name },
      language: input.language || "en",
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime || null,
      note: input.note?.trim() ? { [locale]: input.note.trim() } : undefined,
    });

    await writeAuditLog({
      actorId: gate.user.id,
      action: "organization_service:create",
      targetType: "organization_service",
      targetId: gate.org.id,
      organizationId: gate.org.id,
      newState: input,
    });

    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}

export async function updateOrganizationServiceAction(input: {
  slug: string;
  id: string;
  name?: string;
  language?: string;
  dayOfWeek?: number | null;
  startTime?: string;
  endTime?: string | null;
  note?: string;
  verified?: boolean;
}): Promise<ServiceActionResult> {
  const gate = await requireOrgAdmin(input.slug);
  if ("error" in gate) return { ok: false, error: gate.error };

  if (input.startTime !== undefined && !TIME_PATTERN.test(input.startTime)) {
    return { ok: false, error: "start_time_invalid" };
  }
  if (input.endTime && !TIME_PATTERN.test(input.endTime)) {
    return { ok: false, error: "end_time_invalid" };
  }

  const locale = await getLocale();

  try {
    await updateOrganizationService(input.id, gate.org.id, {
      name: input.name?.trim() ? { [locale]: input.name.trim() } : undefined,
      language: input.language,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      note: input.note !== undefined ? (input.note.trim() ? { [locale]: input.note.trim() } : null) : undefined,
      verifiedAt: input.verified ? new Date() : undefined,
    });

    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}

export async function deleteOrganizationServiceAction(
  slug: string,
  id: string,
): Promise<ServiceActionResult> {
  const gate = await requireOrgAdmin(slug);
  if ("error" in gate) return { ok: false, error: gate.error };

  try {
    await deleteOrganizationService(id, gate.org.id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}
