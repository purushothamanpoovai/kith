import type { UserRole } from "@/generated/prisma/client";
import type { AuthUser } from "@/domain/auth/types";
import { PermissionAction } from "@/domain/permissions/actions";
import {
  can as canAction,
  canPublishAny,
  getRoleDisplay,
  isSuperAdmin,
  loadUserPermissionProfile,
} from "@/services/permission-service";

export type { AuthUser };

/** @deprecated Use permission-service isSuperAdmin / can() instead */
export function isStaff(role: UserRole): boolean {
  return isSuperAdmin(role) || role === "global_moderator";
}

/** Moderation queue access */
export async function canModerate(user: AuthUser | null): Promise<boolean> {
  if (!user) return false;
  return canAction(user, PermissionAction.MODERATION_ACT);
}

/** Legacy sync helper — prefer async canModerate in new code */
export function canModerateSync(user: AuthUser | null): boolean {
  if (!user) return false;
  return isSuperAdmin(user.role) || user.role === "global_moderator" || user.role === "scope_moderator";
}

export function canAccessSignedInArea(user: AuthUser | null): boolean {
  return Boolean(user);
}

export async function canAccessAdmin(user: AuthUser | null): Promise<boolean> {
  if (!user) return false;
  return isSuperAdmin(user.role) || user.role === "admin";
}

export {
  canAction as can,
  canPublishAny,
  getRoleDisplay,
  isSuperAdmin,
  loadUserPermissionProfile,
};
