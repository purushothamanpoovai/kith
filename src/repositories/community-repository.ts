import type { ReactionKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export async function toggleReaction(
  userId: string,
  contentId: string,
  kind: ReactionKind = "heart",
) {
  const existing = await prisma.reaction.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return { active: false };
  }
  await prisma.reaction.create({ data: { userId, contentId, kind } });
  return { active: true };
}

export async function toggleBookmark(userId: string, contentId: string) {
  const existing = await prisma.bookmark.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });
  if (existing) {
    await prisma.bookmark.delete({
      where: { userId_contentId: { userId, contentId } },
    });
    return { active: false };
  }
  await prisma.bookmark.create({ data: { userId, contentId } });
  return { active: true };
}

export async function listBookmarks(userId: string, folderId?: string | null) {
  const rows = await prisma.bookmark.findMany({
    where: { userId, ...(folderId !== undefined ? { folderId } : {}) },
    include: {
      content: {
        include: {
          author: { select: { name: true, slug: true } },
          scopes: { select: { scopeId: true } },
          _count: { select: { reactions: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => r.content);
}

export async function setBookmarkFolder(
  userId: string,
  contentId: string,
  folderId: string | null,
) {
  await prisma.bookmark.update({
    where: { userId_contentId: { userId, contentId } },
    data: { folderId },
  });
}

export async function listBookmarkFolders(userId: string) {
  return prisma.bookmarkFolder.findMany({
    where: { userId },
    include: { _count: { select: { bookmarks: true } } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function createBookmarkFolder(userId: string, name: string) {
  const last = await prisma.bookmarkFolder.findFirst({
    where: { userId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return prisma.bookmarkFolder.create({
    data: { userId, name: name.trim(), sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
}

export async function renameBookmarkFolder(userId: string, folderId: string, name: string) {
  await prisma.bookmarkFolder.updateMany({
    where: { id: folderId, userId },
    data: { name: name.trim() },
  });
}

export async function deleteBookmarkFolder(userId: string, folderId: string) {
  await prisma.bookmarkFolder.deleteMany({ where: { id: folderId, userId } });
}

export async function getPrivateNote(userId: string, contentId: string) {
  return prisma.privateNote.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });
}

export async function upsertPrivateNote(userId: string, contentId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) {
    await prisma.privateNote.deleteMany({ where: { userId, contentId } });
    return null;
  }
  return prisma.privateNote.upsert({
    where: { userId_contentId: { userId, contentId } },
    update: { body: trimmed },
    create: { userId, contentId, body: trimmed },
  });
}

export async function listReactions(userId: string) {
  const rows = await prisma.reaction.findMany({
    where: { userId },
    include: {
      content: {
        include: {
          author: { select: { name: true, slug: true } },
          scopes: { select: { scopeId: true } },
          _count: { select: { reactions: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => r.content);
}

export async function getUserReactionIds(userId: string, contentIds: string[]) {
  if (!contentIds.length) return new Set<string>();
  const rows = await prisma.reaction.findMany({
    where: { userId, contentId: { in: contentIds } },
    select: { contentId: true },
  });
  return new Set(rows.map((r) => r.contentId));
}

export async function getUserBookmarkIds(userId: string, contentIds: string[]) {
  if (!contentIds.length) return new Set<string>();
  const rows = await prisma.bookmark.findMany({
    where: { userId, contentId: { in: contentIds } },
    select: { contentId: true },
  });
  return new Set(rows.map((r) => r.contentId));
}

/**
 * Scope-level reactions (§24) — a scope's own discovery page (a religion,
 * tradition, topic, region or language) can be reacted to the same way a
 * piece of content can, using the same model with `targetType: "scope"` and
 * `scopeId` set instead of `contentId`.
 */

export async function toggleScopeReaction(
  userId: string,
  scopeId: string,
  kind: ReactionKind = "heart",
) {
  const existing = await prisma.reaction.findUnique({
    where: { userId_scopeId: { userId, scopeId } },
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return { active: false };
  }
  await prisma.reaction.create({
    data: { userId, scopeId, kind, targetType: "scope" },
  });
  return { active: true };
}

export async function getUserScopeReactionIds(userId: string, scopeIds: string[]) {
  if (!scopeIds.length) return new Set<string>();
  const rows = await prisma.reaction.findMany({
    where: { userId, scopeId: { in: scopeIds } },
    select: { scopeId: true },
  });
  return new Set(rows.map((r) => r.scopeId).filter((id): id is string => Boolean(id)));
}

export async function countScopeReactions(scopeId: string): Promise<number> {
  return prisma.reaction.count({ where: { scopeId } });
}
