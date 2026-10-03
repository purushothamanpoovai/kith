import type { ContentRecord } from "@/domain/content/types";
import { listContentByScopes } from "@/repositories/content-repository";

const PRACTICE_TOPICS = [
  "topic-meditation",
  "topic-devotion",
  "topic-prayer",
  "topic-yoga",
  "topic-gratitude",
];

/**
 * Short listen/read items for the home "today" band. Prefers the viewer's
 * region, then the practice topics, without changing the rest of the feed.
 */
export async function listTodayPractice(options: {
  regionScopeId?: string | null;
  languageScopeId?: string | null;
  limit?: number;
}): Promise<ContentRecord[]> {
  const scopeIds = [
    options.regionScopeId,
    options.languageScopeId,
    ...PRACTICE_TOPICS,
  ].filter((id): id is string => Boolean(id));

  const items = await listContentByScopes(
    scopeIds,
    ["audio", "article", "post", "poem"],
    24,
  );

  const region = options.regionScopeId;
  const ranked = [...items].sort((a, b) => {
    const aLocal = region && a.scopeIds.includes(region) ? 1 : 0;
    const bLocal = region && b.scopeIds.includes(region) ? 1 : 0;
    if (bLocal !== aLocal) return bLocal - aLocal;
    const aShort = (a.readingMinutes ?? 99) <= 8 || (a.durationSeconds ?? 9_999) <= 600 ? 1 : 0;
    const bShort = (b.readingMinutes ?? 99) <= 8 || (b.durationSeconds ?? 9_999) <= 600 ? 1 : 0;
    return bShort - aShort;
  });

  const seen = new Set<string>();
  const picked: ContentRecord[] = [];
  for (const item of ranked) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    picked.push(item);
    if (picked.length >= (options.limit ?? 2)) break;
  }
  return picked;
}
