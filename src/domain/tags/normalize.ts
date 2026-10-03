/**
 * Tag normalisation shared by client and server.
 *
 * Deliberately dependency-free: the composer's tag input needs the exact
 * same slug rule the server dedupes on, and importing the tag *service*
 * (which reaches for Prisma) into a client component would drag the database
 * client into the browser bundle. The rule lives here so both sides agree.
 */

/** Maximum tags a single piece may carry — a tag cloud is not a keyword dump. */
export const MAX_TAGS_PER_CONTENT = 12;
export const MAX_TAG_LENGTH = 32;

/**
 * Normalises a raw tag into its deduplicating key.
 *
 * Unicode-aware by necessity: this site carries Tamil, Devanagari and Arabic.
 * The character class must keep combining marks (`\p{M}`) alongside letters
 * and numbers — Indic vowel signs are marks, not letters, so a class of only
 * `\p{L}\p{N}` silently mangles "பக்தி" into "பகத" and "भक्ति" into "भकत".
 * (A naive /[^a-z0-9]/ would erase such tags entirely.)
 */
export function normalizeTagSlug(raw: string): string {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}\p{M}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_TAG_LENGTH);
}

/** Tidies the label a reader will see, without lowercasing it. */
export function cleanTagLabel(raw: string): string {
  return raw.normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, MAX_TAG_LENGTH);
}

export type ParsedTag = { slug: string; label: string };

/**
 * Turns raw editor input into a deduplicated, capped list of tags.
 * Duplicates within the same submission collapse here, before any DB work.
 */
export function parseTagInput(raw: string[]): ParsedTag[] {
  const seen = new Map<string, ParsedTag>();
  for (const entry of raw) {
    const label = cleanTagLabel(entry);
    const slug = normalizeTagSlug(label);
    if (!slug) continue;
    if (!seen.has(slug)) seen.set(slug, { slug, label });
    if (seen.size >= MAX_TAGS_PER_CONTENT) break;
  }
  return [...seen.values()];
}
