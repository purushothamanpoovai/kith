export {
  countAuthorContentByStatus,
  countScopeContentByType,
  getContentBySlug,
  listContentByAuthor,
  listContentByScope,
  listContentByType,
  listFeaturedContent,
  listUserBookmarks,
  searchContent,
} from "@/repositories/content-repository";
export type { AuthorContentFilters } from "@/repositories/content-repository";
export type { ContentRecord } from "@/domain/content/types";
export {
  buildGuestFeed,
  buildPersonalFeed,
  contentHref,
  contentSummary,
  contentTitle,
  MODULE_CONTENT_TYPES,
  KIND_FILTER_CONTENT_TYPES,
  SCOPE_KIND_FILTERS,
  summarizeKindCounts,
} from "@/services/feed-service";
export type { ScopeKindFilter } from "@/services/feed-service";

import { listContentByScope } from "@/repositories/content-repository";
import type { ContentRecord } from "@/domain/content/types";
import {
  KIND_FILTER_CONTENT_TYPES,
  MODULE_CONTENT_TYPES,
  type ScopeKindFilter,
} from "@/services/feed-service";

export async function getScopeModuleContent(
  scopeId: string,
  modules: string[],
): Promise<Record<string, ContentRecord[]>> {
  const contentByModule: Record<string, ContentRecord[]> = {};
  for (const moduleKey of modules) {
    const types = MODULE_CONTENT_TYPES[moduleKey] ?? MODULE_CONTENT_TYPES.overview;
    contentByModule[moduleKey] = await listContentByScope(scopeId, types, 8);
  }
  return contentByModule;
}

/** Flat, kind-filtered content for a scope page's `?kind=` chip rail — every
 *  matching piece in one grid, rather than the curated module bands. */
export async function getScopeContentByKind(
  scopeId: string,
  kind: Exclude<ScopeKindFilter, "all">,
): Promise<ContentRecord[]> {
  return listContentByScope(scopeId, KIND_FILTER_CONTENT_TYPES[kind], 24);
}

