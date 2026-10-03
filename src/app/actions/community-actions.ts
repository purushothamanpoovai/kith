"use server";

import { revalidatePath } from "next/cache";
import type { ReactionKind } from "@/generated/prisma/client";
import { PermissionAction } from "@/domain/permissions/actions";
import { can } from "@/services/permission-service";
import {
  createBookmarkFolder,
  deleteBookmarkFolder,
  renameBookmarkFolder,
  setBookmarkFolder,
  toggleBookmark,
  toggleReaction,
  toggleScopeReaction,
  upsertPrivateNote,
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

/**
 * Scope-level reactions (§24), for a scope's own discovery page (a religion,
 * tradition, topic, region or language) rather than a piece of content —
 * same trust model, same action, a different target column. Public comments
 * on a scope page are retired along with content-page comments (§
 * low-liability curated reader, Phase 4).
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

/**
 * Private reflections — visible only to their own author, replacing the
 * public comment-thread UI slot (§ low-liability curated reader, Phase 2/3).
 */

export async function savePrivateNoteAction(contentId: string, body: string) {
  const user = await requireUser();
  if (!(await can(user, PermissionAction.PRIVATE_NOTE_WRITE))) {
    return { ok: false as const, error: "auth_required" as const };
  }
  const note = await upsertPrivateNote(user.id, contentId, body);
  revalidatePath("/", "layout");
  return { ok: true as const, note };
}

/**
 * Bookmark folders — a reader's own private grouping of saved content, never
 * shared or visible to anyone else.
 */

export async function createBookmarkFolderAction(name: string) {
  const user = await requireUser();
  if (!(await can(user, PermissionAction.BOOKMARK_FOLDER_MANAGE))) {
    return { ok: false as const, error: "auth_required" as const };
  }
  if (!name.trim()) return { ok: false as const };
  const folder = await createBookmarkFolder(user.id, name);
  revalidatePath("/", "layout");
  return { ok: true as const, folder };
}

export async function renameBookmarkFolderAction(folderId: string, name: string) {
  const user = await requireUser();
  if (!(await can(user, PermissionAction.BOOKMARK_FOLDER_MANAGE))) {
    return { ok: false as const, error: "auth_required" as const };
  }
  if (!name.trim()) return { ok: false as const };
  await renameBookmarkFolder(user.id, folderId, name);
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function deleteBookmarkFolderAction(folderId: string) {
  const user = await requireUser();
  if (!(await can(user, PermissionAction.BOOKMARK_FOLDER_MANAGE))) {
    return { ok: false as const, error: "auth_required" as const };
  }
  await deleteBookmarkFolder(user.id, folderId);
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function setBookmarkFolderAction(contentId: string, folderId: string | null) {
  const user = await requireUser();
  if (!(await can(user, PermissionAction.BOOKMARK_FOLDER_MANAGE))) {
    return { ok: false as const, error: "auth_required" as const };
  }
  await setBookmarkFolder(user.id, contentId, folderId);
  revalidatePath("/", "layout");
  return { ok: true as const };
}
