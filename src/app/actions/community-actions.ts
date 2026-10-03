"use server";

import { revalidatePath } from "next/cache";
import type { ReactionKind } from "@/generated/prisma/client";
import { PermissionAction } from "@/domain/permissions/actions";
import { can } from "@/services/permission-service";
import {
  addComment,
  addScopeComment,
  toggleBookmark,
  toggleReaction,
  toggleScopeReaction,
} from "@/repositories/community-repository";
import { getCurrentUser } from "@/services/auth-service";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("auth_required");
  return user;
}

export async function reactAction(contentId: string, kind: ReactionKind = "heart") {
  const user = await requireUser();
  if (!(await can(user, PermissionAction.CONTENT_REACT))) {
    throw new Error("auth_required");
  }
  const result = await toggleReaction(user.id, contentId, kind);
  revalidatePath("/", "layout");
  return result;
}

export async function bookmarkAction(contentId: string) {
  const user = await requireUser();
  if (!(await can(user, PermissionAction.CONTENT_BOOKMARK))) {
    throw new Error("auth_required");
  }
  const result = await toggleBookmark(user.id, contentId);
  revalidatePath("/", "layout");
  return result;
}

export async function commentAction(
  contentId: string,
  body: string,
  parentId?: string | null,
) {
  const user = await requireUser();
  if (!(await can(user, PermissionAction.CONTENT_COMMENT))) {
    return { ok: false as const, error: "auth_required" as const };
  }
  if (!body.trim()) return { ok: false as const };
  await addComment(user.id, contentId, body, parentId);
  revalidatePath("/", "layout");
  return { ok: true as const };
}

/**
 * Scope-level reactions and comments (§24), for a scope's own discovery page
 * (a religion, tradition, topic, region or language) rather than a piece of
 * content — same trust model, same actions, a different target column.
 */

export async function reactToScopeAction(scopeId: string, kind: ReactionKind = "heart") {
  const user = await requireUser();
  if (!(await can(user, PermissionAction.SCOPE_REACT))) {
    throw new Error("auth_required");
  }
  const result = await toggleScopeReaction(user.id, scopeId, kind);
  revalidatePath("/", "layout");
  return result;
}

export async function commentOnScopeAction(
  scopeId: string,
  body: string,
  parentId?: string | null,
) {
  const user = await requireUser();
  if (!(await can(user, PermissionAction.SCOPE_COMMENT))) {
    return { ok: false as const, error: "auth_required" as const };
  }
  if (!body.trim()) return { ok: false as const };
  await addScopeComment(user.id, scopeId, body, parentId);
  revalidatePath("/", "layout");
  return { ok: true as const };
}
