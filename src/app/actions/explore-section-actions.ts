"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { PermissionAction } from "@/domain/permissions/actions";
import { can, isSuperAdmin } from "@/services/permission-service";
import { getCurrentUser } from "@/services/auth-service";
import {
  getExploreSectionById,
  reorderExploreSections,
  updateExploreSection,
} from "@/repositories/explore-section-repository";
import { writeAuditLog } from "@/repositories/organization-repository";
import type { AuthUser } from "@/domain/auth/types";
import type { LocalizedString } from "@/lib/localized";

/**
 * Explore section configuration (§23). Which bands the Explore page shows,
 * in what order, under what label and card art — platform-wide presentation,
 * so every action here is super-admin only.
 */

const MAX_LABEL = 120;
const MAX_ICON = 64;
const MAX_SORT_ORDER = 9999;

export type ExploreSectionActionResult = { ok: true } | { ok: false; error: string };

async function requireSuperAdmin(): Promise<
  { user: AuthUser } | { error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: "auth_required" };
  // Both checks on purpose: `can()` is the app's one permission entry point,
  // and the role test keeps a future ADMIN_ACCESS grant to a lesser role from
  // silently opening the platform-wide Explore configuration.
  const allowed = await can(user, PermissionAction.ADMIN_ACCESS);
  if (!allowed || !isSuperAdmin(user.role)) return { error: "not_authorized" };
  return { user };
}

/** Media must be a path this app's own upload route produced (matches product-actions.ts). */
function sanitizeMediaPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!/^\/media\/[A-Za-z0-9._-]+$/.test(value)) return null;
  if (value.includes("..")) return null;
  return value;
}

export async function updateExploreSectionAction(input: {
  id: string;
  label?: string;
  imageUrl?: string | null;
  icon?: string | null;
  sortOrder?: number;
  active?: boolean;
}): Promise<ExploreSectionActionResult> {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return { ok: false, error: gate.error };

  const section = await getExploreSectionById(input.id);
  if (!section) return { ok: false, error: "not_found" };

  if (input.sortOrder !== undefined) {
    if (!Number.isInteger(input.sortOrder)) {
      return { ok: false, error: "sort_order_invalid" };
    }
    if (input.sortOrder < 0 || input.sortOrder > MAX_SORT_ORDER) {
      return { ok: false, error: "sort_order_invalid" };
    }
  }

  if (input.imageUrl) {
    if (!sanitizeMediaPath(input.imageUrl)) {
      return { ok: false, error: "image_invalid" };
    }
  }

  const locale = await getLocale();

  // Editing the English label must not erase the Tamil one — same merge
  // rationale as organization-actions.ts. Clearing it drops only this locale.
  let label: LocalizedString | null | undefined;
  if (input.label !== undefined) {
    const trimmed = input.label.trim().slice(0, MAX_LABEL);
    const next = { ...(section.label ?? {}) };
    if (trimmed) {
      next[locale] = trimmed;
    } else {
      delete next[locale];
    }
    label = Object.keys(next).length > 0 ? next : null;
  }

  try {
    await updateExploreSection(section.id, {
      label,
      imageUrl:
        input.imageUrl !== undefined ? sanitizeMediaPath(input.imageUrl) : undefined,
      icon:
        input.icon !== undefined
          ? input.icon?.trim().slice(0, MAX_ICON) || null
          : undefined,
      sortOrder: input.sortOrder,
      active: input.active,
    });

    await writeAuditLog({
      actorId: gate.user.id,
      action: "explore_section:update",
      targetType: "explore_section",
      targetId: section.id,
      previousState: section,
      newState: input,
    });

    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}

export async function setExploreSectionActiveAction(input: {
  id: string;
  active: boolean;
}): Promise<ExploreSectionActionResult> {
  return updateExploreSectionAction({ id: input.id, active: input.active });
}

export async function reorderExploreSectionsAction(input: {
  order: Array<{ id: string; sortOrder: number }>;
}): Promise<ExploreSectionActionResult> {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return { ok: false, error: gate.error };

  const invalid = input.order.some(
    (item) =>
      !item.id ||
      !Number.isInteger(item.sortOrder) ||
      item.sortOrder < 0 ||
      item.sortOrder > MAX_SORT_ORDER,
  );
  if (invalid) return { ok: false, error: "sort_order_invalid" };

  try {
    await reorderExploreSections(input.order);

    await writeAuditLog({
      actorId: gate.user.id,
      action: "explore_section:reorder",
      targetType: "explore_section",
      targetId: "all",
      newState: input.order,
    });

    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}
