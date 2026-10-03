"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { PermissionAction } from "@/domain/permissions/actions";
import { can } from "@/services/permission-service";
import { getCurrentUser } from "@/services/auth-service";
import {
  getOrganizationBySlug,
  updateOrganizationVisitInfo,
  writeAuditLog,
} from "@/repositories/organization-repository";
import type { LocalizedString } from "@/lib/localized";

/**
 * Visit-planning fields (§ visit info) — address, how to reach, dress code,
 * entry rules, accessibility, donation link. Gated the same way as
 * `updateOrganizationProfileAction`: org_admin only, since these are
 * institutional claims a visitor plans a trip around.
 */

const MAX_FIELD = 2000;

export type UpdateVisitInfoResult = { ok: true } | { ok: false; error: string };

export async function updateOrganizationVisitInfoAction(input: {
  slug: string;
  timezone?: string;
  address?: string;
  howToReach?: string;
  dressCode?: string;
  entryRules?: string;
  accessibility?: string;
  donationUrl?: string;
}): Promise<UpdateVisitInfoResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "auth_required" };

  const org = await getOrganizationBySlug(input.slug);
  if (!org) return { ok: false, error: "not_found" };

  const allowed = await can(user, PermissionAction.ORGANIZATION_MANAGE, {
    organizationId: org.id,
  });
  if (!allowed) return { ok: false, error: "not_authorized" };

  const donationUrl = input.donationUrl?.trim();
  if (donationUrl && !/^https?:\/\//i.test(donationUrl)) {
    return { ok: false, error: "donation_url_invalid" };
  }

  const locale = await getLocale();

  // Merge into the existing localized map, same rationale as
  // organization-actions.ts: editing the English dress code must not erase
  // the Tamil one.
  const mergeLocalized = (
    existing: LocalizedString | null | undefined,
    value: string | undefined,
  ): LocalizedString | undefined => {
    if (value === undefined) return undefined;
    const trimmed = value.trim().slice(0, MAX_FIELD);
    return { ...(existing ?? {}), [locale]: trimmed };
  };

  try {
    await updateOrganizationVisitInfo(org.id, {
      timezone: input.timezone?.trim() || undefined,
      address: mergeLocalized(org.address, input.address),
      howToReach: mergeLocalized(org.howToReach, input.howToReach),
      dressCode: mergeLocalized(org.dressCode, input.dressCode),
      entryRules: mergeLocalized(org.entryRules, input.entryRules),
      accessibility: mergeLocalized(org.accessibility, input.accessibility),
      donationUrl: input.donationUrl !== undefined ? donationUrl || null : undefined,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "organization:visit_info:update",
      targetType: "organization",
      targetId: org.id,
      organizationId: org.id,
      newState: input,
    });

    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}
