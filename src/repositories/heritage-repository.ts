import type {
  ContentVisibility,
  HeritageArchiveTier,
  MediaRights,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { LocalizedString } from "@/lib/localized";

export type HeritageRecord = {
  id: string;
  slug: string;
  title: LocalizedString;
  summary: LocalizedString | null;
  body: LocalizedString | null;
  transcript: LocalizedString | null;
  authorId: string;
  authorName: string;
  originalLanguage: string;
  coverImage: string | null;
  mediaUrl: string | null;
  durationSeconds: number | null;
  visibility: ContentVisibility;
  scopeIds: string[];
  lineage: {
    id: string;
    recordedByName: string | null;
    originallyToldBy: string | null;
    location: LocalizedString | null;
    approximatePeriod: string | null;
    sourceNote: string | null;
    rights: MediaRights;
    archiveTier: HeritageArchiveTier;
  };
};

const include = {
  author: { select: { name: true } },
  scopes: { select: { scopeId: true } },
  heritageLineage: true,
} as const;

type Row = Prisma.ContentGetPayload<{ include: typeof include }>;

function asLocalized(value: unknown): LocalizedString | null {
  if (!value || typeof value !== "object") return null;
  return value as LocalizedString;
}

function mapHeritage(row: Row): HeritageRecord | null {
  if (!row.heritageLineage) return null;
  const lineage = row.heritageLineage;
  return {
    id: row.id,
    slug: row.slug,
    title: asLocalized(row.title) ?? {},
    summary: asLocalized(row.summary),
    body: asLocalized(row.body),
    transcript: asLocalized(row.transcript),
    authorId: row.authorId,
    authorName: row.author.name,
    originalLanguage: row.originalLanguage,
    coverImage: row.coverImage,
    mediaUrl: row.mediaUrl,
    durationSeconds: row.durationSeconds,
    visibility: row.visibility,
    scopeIds: row.scopes.map((s) => s.scopeId),
    lineage: {
      id: lineage.id,
      recordedByName: lineage.recordedByName,
      originallyToldBy: lineage.originallyToldBy,
      location: asLocalized(lineage.location),
      approximatePeriod: lineage.approximatePeriod,
      sourceNote: lineage.sourceNote,
      rights: lineage.rights,
      archiveTier: lineage.archiveTier,
    },
  };
}

const publicTiers: HeritageArchiveTier[] = ["community", "public"];

export async function listHeritageArchive(limit = 24): Promise<HeritageRecord[]> {
  const rows = await prisma.content.findMany({
    where: {
      type: "oral_history",
      status: "published",
      heritageLineage: { archiveTier: { in: publicTiers } },
      visibility: { in: ["public", "community"] },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include,
  });
  return rows.map(mapHeritage).filter(Boolean) as HeritageRecord[];
}

export async function getHeritageBySlug(slug: string): Promise<HeritageRecord | null> {
  const row = await prisma.content.findUnique({
    where: { slug },
    include,
  });
  if (!row || row.type !== "oral_history" || !row.heritageLineage) return null;
  return mapHeritage(row);
}

export async function searchHeritage(query: string, limit = 12): Promise<HeritageRecord[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.content.findMany({
    where: {
      type: "oral_history",
      status: "published",
      heritageLineage: { archiveTier: { in: publicTiers } },
      visibility: { in: ["public", "community"] },
      OR: [
        { slug: { contains: q, mode: "insensitive" } },
        { title: { path: ["en"], string_contains: q } },
        { title: { path: ["ta"], string_contains: q } },
      ],
    },
    take: limit,
    include,
  });
  return rows.map(mapHeritage).filter(Boolean) as HeritageRecord[];
}
