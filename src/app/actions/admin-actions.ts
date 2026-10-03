"use server";

import { revalidatePath } from "next/cache";
import type { OrganizationKind, OrganizationMemberRole } from "@/generated/prisma/client";
import { requireSuperAdminPage } from "@/app/actions/moderation-actions";
import {
  assignOrganizationMember,
  createOrganization,
  writeAuditLog,
} from "@/repositories/organization-repository";
import { PermissionAction } from "@/domain/permissions/actions";
import { can } from "@/services/permission-service";

export async function createOrganizationAction(input: {
  id: string;
  slug: string;
  name: Record<string, string>;
  kind: OrganizationKind;
  scopeIds?: string[];
  adminUserId?: string;
}) {
  const actor = await requireSuperAdminPage();
  const allowed = await can(actor, PermissionAction.ORGANIZATION_CREATE);
  if (!allowed) return { ok: false as const, error: "forbidden" as const };

  await createOrganization({
    id: input.id,
    slug: input.slug,
    name: input.name,
    kind: input.kind,
    status: "verified",
    scopeIds: input.scopeIds,
    createdById: actor.id,
  });

  if (input.adminUserId) {
    await assignOrganizationMember(input.id, input.adminUserId, "org_admin");
  }

  await writeAuditLog({
    actorId: actor.id,
    action: "organization:create",
    targetType: "organization",
    targetId: input.id,
    organizationId: input.id,
    newState: input,
  });

  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function assignOrganizationRoleAction(input: {
  organizationId: string;
  userId: string;
  role: OrganizationMemberRole;
}) {
  const actor = await requireSuperAdminPage();
  const allowed = await can(actor, PermissionAction.ORGANIZATION_ASSIGN_ROLES, {
    organizationId: input.organizationId,
  });
  if (!allowed && !(await can(actor, PermissionAction.ORGANIZATION_MANAGE, {
    organizationId: input.organizationId,
  }))) {
    return { ok: false as const, error: "forbidden" as const };
  }

  await assignOrganizationMember(input.organizationId, input.userId, input.role);

  await writeAuditLog({
    actorId: actor.id,
    action: "organization:assign_role",
    targetType: "organization_membership",
    targetId: `${input.organizationId}:${input.userId}`,
    organizationId: input.organizationId,
    newState: input,
  });

  revalidatePath("/", "layout");
  return { ok: true as const };
}
