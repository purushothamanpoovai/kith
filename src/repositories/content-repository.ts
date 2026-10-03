import type { ContentStatus, ContentType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { ContentBlock, ContentRecord } from "@/domain/content/types";
import type { LocalizedString } from "@/lib/localized";

function asLocalized(value: unknown): LocalizedString {
  return (value ?? {}) as LocalizedString;
}

function asBlocks(value: unknown): ContentBlock[] | null {
  if (!value || !Array.isArray(value)) return null;
  return value as ContentBlock[];
}

type ContentRow = Prisma.ContentGetPayload<{
  include: {
    author: { select: { name: true; slug: true } };
    publishedBy: { select: { name: true } };
    ownerOrganization: { select: { slug: true; name: true } };
    scopes: { select: { scopeId: true } };
    _count: { select: { reactions: true; comments: true } };
  };
}>;

function mapContent(row: ContentRow): ContentRecord {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    visibility: row.visibility,
    slug: row.slug,
    title: asLocalized(row.title),
    summary: row.summary ? asLocalized(row.summary) : null,
    body: row.body ? asLocalized(row.body) : null,
    blocks: asBlocks(row.blocks),
    authorId: row.authorId,
    authorName: row.author.name,
    authorSlug: row.author.slug,
    originalLanguage: row.originalLanguage,
    coverImage: row.coverImage,
    readingMinutes: row.readingMinutes,
    mediaUrl: row.mediaUrl,
    durationSeconds: row.durationSeconds,
    transcript: row.transcript ? asLocalized(row.transcript) : null,
    originalText: row.originalText ? asLocalized(row.originalText) : null,
    transliteration: row.transliteration ? asLocalized(row.transliteration) : null,
    translation: row.translation ? asLocalized(row.translation) : null,
    contentLabel: row.contentLabel,
    origin: row.origin,
    publishedById: row.publishedById,
    publishedByName: row.publishedBy?.name,
    ownerUserId: row.ownerUserId,
    ownerOrganizationId: row.ownerOrganizationId,
    ownerOrganizationName: row.ownerOrganization
      ? asLocalized(row.ownerOrganization.name)
      : null,
    ownerOrganizationSlug: row.ownerOrganization?.slug ?? null,
    trendingScore: row.trendingScore,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    scopeIds: row.scopes.map((s) => s.scopeId),
    reactionCount: row._count.reactions,
    commentCount: row._count.comments,
  };
}

const contentInclude = {
  author: { select: { name: true, slug: true } },
  publishedBy: { select: { name: true } },
  ownerOrganization: { select: { slug: true, name: true } },
  scopes: { select: { scopeId: true } },
  _count: { select: { reactions: true, comments: true } },
} as const;

export async function getContentBySlug(slug: string): Promise<ContentRecord | null> {
  const row = await prisma.content.findUnique({
    where: { slug },
    include: contentInclude,
  });
  return row ? mapContent(row) : null;
}

export async function listContentByType(
  type: ContentType,
  limit = 24,
): Promise<ContentRecord[]> {
  const rows = await prisma.content.findMany({
    where: { type, status: "published", visibility: "public" },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    include: contentInclude,
  });
  return rows.map(mapContent);
}

export async function listContentByScope(
  scopeId: string,
  types?: ContentType[],
  limit = 24,
): Promise<ContentRecord[]> {
  const rows = await prisma.content.findMany({
    where: {
      status: "published",
      visibility: "public",
      ...(types?.length ? { type: { in: types } } : {}),
      scopes: { some: { scopeId } },
    },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    include: contentInclude,
  });
  return rows.map(mapContent);
}

/** Published content counts by type for a scope, one grouped query — used to
 *  show a count on each kind-filter chip without a query per chip. */
export async function countScopeContentByType(
  scopeId: string,
): Promise<Partial<Record<ContentType, number>>> {
  const rows = await prisma.content.groupBy({
    by: ["type"],
    where: {
      status: "published",
      visibility: "public",
      scopes: { some: { scopeId } },
    },
    _count: { _all: true },
  });
  const counts: Partial<Record<ContentType, number>> = {};
  for (const row of rows) {
    counts[row.type] = row._count._all;
  }
  return counts;
}

export async function listContentByScopes(
  scopeIds: string[],
  types?: ContentType[],
  limit = 24,
): Promise<ContentRecord[]> {
  if (scopeIds.length === 0) return [];
  const rows = await prisma.content.findMany({
    where: {
      status: "published",
      visibility: "public",
      ...(types?.length ? { type: { in: types } } : {}),
      scopes: { some: { scopeId: { in: scopeIds } } },
    },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    include: contentInclude,
  });
  return rows.map(mapContent);
}

export async function listContentByOrganizationIds(
  organizationIds: string[],
  types?: ContentType[],
  limit = 24,
): Promise<ContentRecord[]> {
  if (organizationIds.length === 0) return [];
  const rows = await prisma.content.findMany({
    where: {
      status: "published",
      visibility: "public",
      ownerOrganizationId: { in: organizationIds },
      ...(types?.length ? { type: { in: types } } : {}),
    },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    include: contentInclude,
  });
  return rows.map(mapContent);
}

export async function listFeaturedContent(limit = 6): Promise<ContentRecord[]> {
  const rows = await prisma.content.findMany({
    where: { status: "published", visibility: "public", type: "article" },
    orderBy: [{ trendingScore: "desc" }, { publishedAt: "desc" }],
    take: limit,
    include: contentInclude,
  });
  return rows.map(mapContent);
}

export async function searchContent(query: string, limit = 20): Promise<ContentRecord[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.content.findMany({
    where: {
      status: "published",
      visibility: "public",
      OR: [
        { slug: { contains: q, mode: "insensitive" } },
        { title: { path: ["en"], string_contains: q } },
        { title: { path: ["ta"], string_contains: q } },
        { title: { path: ["hi"], string_contains: q } },
      ],
    },
    take: limit,
    include: contentInclude,
  });
  return rows.map(mapContent);
}

export type AuthorContentFilters = {
  types?: ContentType[];
  statuses?: ContentStatus[];
  organizationIds?: string[];
};

/** Everything a user authored, any status — the Studio tab's "what have I
 *  made" view, so unlike every other list here it does not gate on
 *  status:"published"/visibility:"public" (an author must see their own
 *  drafts). Sorted by most recently touched, using `updatedAt` rather than
 *  `publishedAt` since a draft has no publish date yet. */
export async function listContentByAuthor(
  userId: string,
  filters?: AuthorContentFilters,
  limit = 100,
): Promise<ContentRecord[]> {
  const rows = await prisma.content.findMany({
    where: {
      authorId: userId,
      ...(filters?.types?.length ? { type: { in: filters.types } } : {}),
      ...(filters?.statuses?.length ? { status: { in: filters.statuses } } : {}),
      ...(filters?.organizationIds?.length
        ? { ownerOrganizationId: { in: filters.organizationIds } }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
    include: contentInclude,
  });
  return rows.map(mapContent);
}

/** Status/type counts for one author's content in a single grouped query —
 *  mirrors `countScopeContentByType`'s "one query for every chip" shape, so
 *  the Studio filter rail can omit empty chips without N queries. */
export async function countAuthorContentByStatus(
  userId: string,
): Promise<Partial<Record<ContentStatus, number>>> {
  const rows = await prisma.content.groupBy({
    by: ["status"],
    where: { authorId: userId },
    _count: { _all: true },
  });
  const counts: Partial<Record<ContentStatus, number>> = {};
  for (const row of rows) {
    counts[row.status] = row._count._all;
  }
  return counts;
}

export async function listUserBookmarks(userId: string): Promise<ContentRecord[]> {
  const rows = await prisma.bookmark.findMany({
    where: { userId },
    include: { content: { include: contentInclude } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => mapContent(row.content));
}
