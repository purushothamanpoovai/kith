"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { PermissionAction } from "@/domain/permissions/actions";
import { can } from "@/services/permission-service";
import { getCurrentUser } from "@/services/auth-service";
import {
  getOrganizationBySlug,
  updateOrganizationProfile,
  writeAuditLog,
} from "@/repositories/organization-repository";
import type { LocalizedString } from "@/lib/localized";

/**
 * Organization self-management (§organizations).
 *
 * An org admin may edit how their institution presents itself, but not what
 * the platform asserts about it: `status`, `verifiedAt` and `kind` are absent
 * from this action by design. A verified badge an organization can grant
 * itself tells a visitor nothing, and for religious institutions — where the
 * badge is the main signal that a listing is genuine and not an impersonation
 * — that distinction matters more than usual.
 */

const MAX_NAME = 160;
const MAX_DESCRIPTION = 2000;
const MAX_FIELD = 200;

export type UpdateOrgResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateOrganizationProfileAction(input: {
  slug: string;
  name?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  location?: string;
  logoPath?: string | null;
  coverImage?: string | null;
}): Promise<UpdateOrgResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "auth_required" };

  const org = await getOrganizationBySlug(input.slug);
  if (!org) return { ok: false, error: "not_found" };

  const allowed = await can(user, PermissionAction.ORGANIZATION_MANAGE, {
    organizationId: org.id,
  });
  if (!allowed) return { ok: false, error: "not_authorized" };

  const locale = await getLocale();

  const name = input.name?.trim().slice(0, MAX_NAME);
  if (input.name !== undefined && !name) {
    return { ok: false, error: "name_required" };
  }

  const website = input.website?.trim();
  // Only http(s) links: a `javascript:` or `data:` URL here would become a
  // clickable link on a public page.
  if (website && !/^https?:\/\//i.test(website)) {
    return { ok: false, error: "website_invalid" };
  }

  const contactEmail = input.contactEmail?.trim();
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { ok: false, error: "email_invalid" };
  }

  // Localized fields merge into the existing map rather than replacing it, so
  // editing the English name does not silently delete the Tamil one.
  const mergeLocalized = (
    existing: LocalizedString | null | undefined,
    value: string | undefined,
  ): LocalizedString | undefined => {
    if (value === undefined) return undefined;
    return { ...(existing ?? {}), [locale]: value };
  };

  try {
    await updateOrganizationProfile(org.id, {
      name: mergeLocalized(org.name, name),
      description: mergeLocalized(
        org.description,
        input.description?.trim().slice(0, MAX_DESCRIPTION),
      ),
      location: mergeLocalized(
        org.location,
        input.location?.trim().slice(0, MAX_FIELD),
      ),
      contactEmail: input.contactEmail !== undefined ? contactEmail || null : undefined,
      contactPhone:
        input.contactPhone !== undefined
          ? input.contactPhone.trim().slice(0, 40) || null
          : undefined,
      website: input.website !== undefined ? website || null : undefined,
      logoPath: input.logoPath !== undefined ? sanitizeMediaPath(input.logoPath) : undefined,
      coverImage:
        input.coverImage !== undefined ? sanitizeMediaPath(input.coverImage) : undefined,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "organization:update",
      targetType: "organization",
      targetId: org.id,
      organizationId: org.id,
      newState: { ...input, logoPath: undefined, coverImage: undefined },
    });

    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}

/** Media must be a path this app's own upload route produced. */
function sanitizeMediaPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!/^\/media\/[A-Za-z0-9._-]+$/.test(value)) return null;
  if (value.includes("..")) return null;
  return value;
}
