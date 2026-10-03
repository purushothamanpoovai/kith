import type { ContentStatus, ContentType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { createId } from "@/lib/ids";

/**
 * The content write path (§publishing).
 *
 * Kept apart from content-repository.ts, which is read-only: the queries that
 * serve readers and the mutations that accept writer input have different
 * risks, and mixing them makes it easy to lose track of which inputs have
 * been validated. Everything here assumes the caller has already authorised
 * the actor and sanitised any HTML — this layer does persistence only.
 */

export type CreateArticleInput = {
  authorId: string;
  type: ContentType;
  status: ContentStatus;
  /** Already sanitised HTML. */
  bodyHtml: string;
  title: string;
  summary?: string;
  locale: string;
  coverImage?: string | null;
  backgroundPreset?: string | null;
  readingMinutes?: number | null;
  /** Scope ids inferred from the author — audience, not user input. */
  scopeIds: string[];
  tagIds: string[];
  ownerOrganizationId?: string | null;
};

/** Slugifies a title, keeping non-Latin scripts usable as URLs. */
export function slugifyTitle(title: string): string {
  const base = title
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}\p{M}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  // A title of only punctuation, or an empty one, still needs a usable slug.
  return base || `entry-${createId().slice(-6)}`;
}

/** Finds a free slug, suffixing on collision rather than overwriting. */
async function uniqueSlug(desired: string): Promise<string> {
  const existing = await prisma.content.findUnique({ where: { slug: desired } });
  if (!existing) return desired;
  return `${desired}-${createId().slice(-6)}`;
}

export async function createArticle(input: CreateArticleInput) {
  const slug = await uniqueSlug(slugifyTitle(input.title));
  const id = `content_${createId()}`;

  const title: Prisma.InputJsonValue = { [input.locale]: input.title };
  const body: Prisma.InputJsonValue = { [input.locale]: input.bodyHtml };
  const summary: Prisma.InputJsonValue | undefined = input.summary
    ? { [input.locale]: input.summary }
    : undefined;

  const content = await prisma.content.create({
    data: {
      id,
      slug,
      type: input.type,
      status: input.status,
      visibility: "public",
      origin: input.ownerOrganizationId ? "official" : "community",
      title,
      body,
      summary,
      // `blocks` stays null: a rich-text article is stored as HTML in `body`.
      // The reader falls back to rendering body when blocks are absent.
      authorId: input.authorId,
      publishedById: input.authorId,
      ownerUserId: input.ownerOrganizationId ? null : input.authorId,
      ownerOrganizationId: input.ownerOrganizationId ?? null,
      originalLanguage: input.locale,
      coverImage: input.coverImage ?? null,
      backgroundPreset: input.backgroundPreset ?? null,
      readingMinutes: input.readingMinutes ?? null,
    },
  });

  if (input.scopeIds.length > 0) {
    await prisma.contentScope.createMany({
      data: input.scopeIds.map((scopeId) => ({ contentId: content.id, scopeId })),
      skipDuplicates: true,
    });
  }

  if (input.tagIds.length > 0) {
    await prisma.contentTag.createMany({
      data: input.tagIds.map((tagId) => ({ contentId: content.id, tagId })),
      skipDuplicates: true,
    });
  }

  return content;
}

/**
 * The scopes a writer's work inherits from their own profile.
 *
 * These are deliberately not editable in the composer: they carry audience,
 * so letting a writer type them would let anyone address a community they do
 * not belong to. Missing focus fields simply yield fewer scopes.
 */
export async function inferAuthorScopeIds(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      focusReligionScopeId: true,
      focusLanguageScopeId: true,
      focusRegionScopeId: true,
    },
  });
  if (!user) return [];

  const ids = [
    user.focusReligionScopeId,
    user.focusLanguageScopeId,
    user.focusRegionScopeId,
  ].filter((id): id is string => Boolean(id));

  if (ids.length === 0) return [];

  // Only keep ids that still resolve to a real scope, so a stale profile
  // reference cannot break the create with a foreign-key error.
  const scopes = await prisma.scope.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  return scopes.map((scope) => scope.id);
}
