// `ScopeType` is imported as a TYPE ONLY — never the runtime enum object.
// This file is reachable from client components (e.g. the My Space following
// panel), and the runtime import pulls in the whole generated Prisma client
// module (and, through it, Node-only internals like `node:module`), which a
// browser bundle cannot resolve. Plain string literals give the identical
// values with no such dependency.
import type { ScopeType } from "@/generated/prisma/client";

/** URL segment for each browsable scope type. */
export const SCOPE_ROUTE_SEGMENT: Partial<Record<ScopeType, string>> = {
  religion: "religions",
  tradition: "traditions",
  sacred_entity: "entities",
  topic: "topics",
  region: "regions",
  language: "languages",
  sacred_text: "texts",
  festival: "festivals",
  community: "community",
  organization: "organizations",
  cultural_group: "groups",
};

export const ROUTE_TO_SCOPE_TYPE: Partial<Record<string, ScopeType>> =
  Object.fromEntries(
    Object.entries(SCOPE_ROUTE_SEGMENT).map(([type, segment]) => [
      segment,
      type as ScopeType,
    ]),
  );

export const EXPLORE_SCOPE_TYPES = [
  "sacred_entity",
  "language",
  "region",
  "religion",
  "topic",
  "tradition",
] as const satisfies readonly ScopeType[];

export function scopeHref(type: ScopeType, slug: string): string {
  const segment = SCOPE_ROUTE_SEGMENT[type];
  if (!segment) {
    return "/explore";
  }
  return `/${segment}/${slug}`;
}

export function scopeListHref(type: ScopeType): string | null {
  const segment = SCOPE_ROUTE_SEGMENT[type];
  return segment ? `/${segment}` : null;
}

export function isScopeListRoute(segment: string): segment is keyof typeof ROUTE_TO_SCOPE_TYPE {
  return segment in ROUTE_TO_SCOPE_TYPE;
}
