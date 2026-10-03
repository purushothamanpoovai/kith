import { ScopeType, type Scope } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { LocalizedString } from "@/lib/localized";

export type ScopeRecord = Omit<Scope, "title" | "description" | "modules"> & {
  title: LocalizedString;
  description: LocalizedString | null;
  modules: string[];
};

function asScope(scope: Scope): ScopeRecord {
  return {
    ...scope,
    title: (scope.title ?? {}) as LocalizedString,
    description: (scope.description as LocalizedString | null) ?? null,
    modules: Array.isArray(scope.modules) ? (scope.modules as string[]) : [],
  };
}

export async function listScopesByType(type: ScopeType): Promise<ScopeRecord[]> {
  const rows = await prisma.scope.findMany({
    where: { type },
    orderBy: { slug: "asc" },
  });
  return rows.map(asScope);
}

export async function getScopeBySlug(
  type: ScopeType,
  slug: string,
): Promise<ScopeRecord | null> {
  const row = await prisma.scope.findUnique({
    where: { type_slug: { type, slug } },
  });
  return row ? asScope(row) : null;
}

export async function getScopeById(id: string): Promise<ScopeRecord | null> {
  const row = await prisma.scope.findUnique({ where: { id } });
  return row ? asScope(row) : null;
}

export async function listChildScopes(parentId: string): Promise<ScopeRecord[]> {
  const rows = await prisma.scope.findMany({
    where: { parentId },
    orderBy: { slug: "asc" },
  });
  return rows.map(asScope);
}

export async function listScopeAncestors(id: string): Promise<ScopeRecord[]> {
  const ancestors: ScopeRecord[] = [];
  let current = await getScopeById(id);
  while (current?.parentId) {
    const parent = await getScopeById(current.parentId);
    if (!parent) {
      break;
    }
    ancestors.unshift(parent);
    current = parent;
  }
  return ancestors;
}

export async function countScopesByType(type: ScopeType): Promise<number> {
  return prisma.scope.count({ where: { type } });
}

export async function countScopes(): Promise<number> {
  return prisma.scope.count();
}

export async function searchScopes(query: string, limit = 12): Promise<ScopeRecord[]> {
  const q = query.trim();
  if (!q) return [];
  const rows = await prisma.scope.findMany({
    where: {
      OR: [
        { slug: { contains: q, mode: "insensitive" } },
        { title: { path: ["en"], string_contains: q } },
        { title: { path: ["ta"], string_contains: q } },
        { title: { path: ["hi"], string_contains: q } },
      ],
    },
    take: limit,
    orderBy: { slug: "asc" },
  });
  return rows.map(asScope);
}

export async function listAllScopes(): Promise<ScopeRecord[]> {
  const rows = await prisma.scope.findMany({ orderBy: { slug: "asc" } });
  return rows.map(asScope);
}
