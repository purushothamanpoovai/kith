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

export async function listBookmarks(userId: string) {
  const rows = await prisma.bookmark.findMany({
    where: { userId },
    include: {
      content: {
        include: {
          author: { select: { name: true, slug: true } },
          scopes: { select: { scopeId: true } },
          _count: { select: { reactions: true, comments: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => r.content);
}

export async function listReactions(userId: string) {
  const rows = await prisma.reaction.findMany({
    where: { userId },
    include: {
      content: {
        include: {
          author: { select: { name: true, slug: true } },
          scopes: { select: { scopeId: true } },
          _count: { select: { reactions: true, comments: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => r.content);
}

export async function listComments(contentId: string) {
  return prisma.comment.findMany({
    where: { contentId },
    include: { user: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addComment(
  userId: string,
  contentId: string,
  body: string,
  parentId?: string | null,
) {
  return prisma.comment.create({
    data: { userId, contentId, body: body.trim(), parentId: parentId ?? null },
    include: { user: { select: { name: true, slug: true } } },
  });
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
 * Scope-level reactions and comments (§24) — a scope's own discovery page
 * (a religion, tradition, topic, region or language) can be reacted to and
 * discussed the same way a piece of content can, using the same two models
 * with `targetType: "scope"` and `scopeId` set instead of `contentId`.
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

export async function listScopeComments(scopeId: string) {
  return prisma.comment.findMany({
    where: { scopeId },
    include: { user: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addScopeComment(
  userId: string,
  scopeId: string,
  body: string,
  parentId?: string | null,
) {
  return prisma.comment.create({
    data: {
      userId,
      scopeId,
      targetType: "scope",
      body: body.trim(),
      parentId: parentId ?? null,
    },
    include: { user: { select: { name: true, slug: true } } },
  });
}
