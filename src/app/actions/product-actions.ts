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
import { createProduct, deleteProduct, updateProduct } from "@/repositories/product-repository";
import { createId } from "@/lib/ids";

/**
 * Product catalogue CRUD (§ products). Catalogue-only, same trust model as
 * `donationUrl`: `purchaseUrl` sends the buyer elsewhere, this platform never
 * takes payment, so there is nothing here beyond name/photo/price-display/
 * description/link.
 */

const MAX_NAME = 160;
const MAX_DESCRIPTION = 2000;
const MAX_PRICE = 40;

export type ProductActionResult = { ok: true } | { ok: false; error: string };

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

/** Media must be a path this app's own upload route produced (matches organization-actions.ts). */
function sanitizeMediaPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!/^\/media\/[A-Za-z0-9._-]+$/.test(value)) return null;
  if (value.includes("..")) return null;
  return value;
}

export async function createProductAction(input: {
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  price?: string;
  purchaseUrl: string;
}): Promise<ProductActionResult> {
  const gate = await requireOrgAdmin(input.slug);
  if ("error" in gate) return { ok: false, error: gate.error };

  const name = input.name.trim().slice(0, MAX_NAME);
  if (!name) return { ok: false, error: "name_required" };

  const purchaseUrl = input.purchaseUrl.trim();
  if (!/^https?:\/\//i.test(purchaseUrl)) {
    return { ok: false, error: "purchase_url_invalid" };
  }

  const locale = await getLocale();

  try {
    await createProduct({
      id: `product_${createId()}`,
      organizationId: gate.org.id,
      name: { [locale]: name },
      description: input.description?.trim()
        ? { [locale]: input.description.trim().slice(0, MAX_DESCRIPTION) }
        : undefined,
      imageUrl: sanitizeMediaPath(input.imageUrl),
      price: input.price?.trim().slice(0, MAX_PRICE) || null,
      purchaseUrl,
    });

    await writeAuditLog({
      actorId: gate.user.id,
      action: "product:create",
      targetType: "product",
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

export async function updateProductAction(input: {
  slug: string;
  id: string;
  name?: string;
  description?: string;
  imageUrl?: string | null;
  price?: string;
  purchaseUrl?: string;
  active?: boolean;
}): Promise<ProductActionResult> {
  const gate = await requireOrgAdmin(input.slug);
  if ("error" in gate) return { ok: false, error: gate.error };

  if (input.purchaseUrl !== undefined && !/^https?:\/\//i.test(input.purchaseUrl.trim())) {
    return { ok: false, error: "purchase_url_invalid" };
  }

  const locale = await getLocale();

  try {
    await updateProduct(input.id, gate.org.id, {
      name: input.name?.trim() ? { [locale]: input.name.trim().slice(0, MAX_NAME) } : undefined,
      description:
        input.description !== undefined
          ? input.description.trim()
            ? { [locale]: input.description.trim().slice(0, MAX_DESCRIPTION) }
            : null
          : undefined,
      imageUrl: input.imageUrl !== undefined ? sanitizeMediaPath(input.imageUrl) : undefined,
      price: input.price !== undefined ? input.price.trim().slice(0, MAX_PRICE) || null : undefined,
      purchaseUrl: input.purchaseUrl?.trim(),
      active: input.active,
    });

    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}

export async function deleteProductAction(
  slug: string,
  id: string,
): Promise<ProductActionResult> {
  const gate = await requireOrgAdmin(slug);
  if ("error" in gate) return { ok: false, error: gate.error };

  try {
    await deleteProduct(id, gate.org.id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}
