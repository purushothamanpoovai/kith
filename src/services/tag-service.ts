import { prisma } from "@/lib/db";
import { createId } from "@/lib/ids";
import type { ParsedTag } from "@/domain/tags/normalize";
import { normalizeTagSlug } from "@/domain/tags/normalize";

/**
 * Free-text tags (§search) — the server half.
 *
 * Tags are for finding things, not for deciding who may see them — audience
 * still comes from the scopes attached to a piece. Two writers typing the
 * same idea in different shapes ("Bhakti", "bhakti ", "BHAKTI", "bhakti-yoga"
 * vs "Bhakti Yoga") must land on one row, so every tag is keyed by a
 * normalised slug while keeping the first spelling seen for display.
 *
 * The normalisation rule itself lives in domain/tags/normalize.ts so the
 * composer can apply the identical rule without importing Prisma.
 */

export {
  MAX_TAGS_PER_CONTENT,
  MAX_TAG_LENGTH,
  normalizeTagSlug,
  parseTagInput,
} from "@/domain/tags/normalize";
export type { ParsedTag } from "@/domain/tags/normalize";

/**
 * Resolves tags to rows, creating only those that don't exist yet.
 *
 * The unique index on `slug` is the real guard: two writers publishing the
 * same new tag concurrently would both see "not found", so the create is
 * tolerant of the losing race and falls back to reading the winner's row.
 */
export async function resolveTagIds(tags: ParsedTag[]): Promise<string[]> {
  if (tags.length === 0) return [];

  const slugs = tags.map((t) => t.slug);
  const existing = await prisma.tag.findMany({ where: { slug: { in: slugs } } });
  const bySlug = new Map(existing.map((row) => [row.slug, row.id]));

  const missing = tags.filter((t) => !bySlug.has(t.slug));
  for (const tag of missing) {
    try {
      const created = await prisma.tag.create({
        data: { id: `tag_${createId()}`, slug: tag.slug, label: tag.label },
      });
      bySlug.set(created.slug, created.id);
    } catch {
      // Lost a race against a concurrent create; the winner's row is correct.
      const row = await prisma.tag.findUnique({ where: { slug: tag.slug } });
      if (row) bySlug.set(row.slug, row.id);
    }
  }

  return slugs.map((slug) => bySlug.get(slug)).filter((id): id is string => Boolean(id));
}

/** Replaces the tag set on a piece of content. */
export async function setContentTags(contentId: string, tagIds: string[]) {
  await prisma.contentTag.deleteMany({ where: { contentId } });
  if (tagIds.length === 0) return;
  await prisma.contentTag.createMany({
    data: tagIds.map((tagId) => ({ contentId, tagId })),
    skipDuplicates: true,
  });
}

/** Tags for one piece of content, for display. */
export async function getContentTags(contentId: string) {
  const rows = await prisma.contentTag.findMany({
    where: { contentId },
    include: { tag: true },
  });
  return rows.map((row) => row.tag);
}

/** Type-ahead for the tag input, so writers reuse tags instead of inventing near-duplicates. */
export async function suggestTags(query: string, limit = 8) {
  const slug = normalizeTagSlug(query);
  if (!slug) return [];
  return prisma.tag.findMany({
    where: { slug: { contains: slug } },
    orderBy: { label: "asc" },
    take: limit,
  });
}
