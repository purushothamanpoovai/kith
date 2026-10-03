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

export type ScopeTreeNode = ScopeRecord & {
  contentCount: number;
  children: ScopeTreeNode[];
};

/**
 * The real Religion → Tradition → Sacred Entity hierarchy, for a tree-shaped
 * Explore view aimed at researchers/journalists scanning structure rather
 * than browsing cards (§ Explore redesign). Unlike Topics/Regions/Languages,
 * which are flat cross-cutting lists that apply across every religion, this
 * chain is a genuine parent/child relationship already modelled by `Scope`'s
 * own self-relation — so this walks that relation rather than inventing one.
 */
export async function listReligionTree(): Promise<ScopeTreeNode[]> {
  const [religions, traditions, entities] = await Promise.all([
    prisma.scope.findMany({
      where: { type: "religion" },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { contentScopes: true } } },
    }),
    prisma.scope.findMany({
      where: { type: "tradition" },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { contentScopes: true } } },
    }),
    prisma.scope.findMany({
      where: { type: "sacred_entity" },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { contentScopes: true } } },
    }),
  ]);

  function toNode(scope: (typeof religions)[number], children: ScopeTreeNode[]): ScopeTreeNode {
    return {
      ...asScope(scope),
      contentCount: scope._count.contentScopes,
      children,
    };
  }

  const entityNodes = entities.map((e) => toNode(e, []));
  const traditionNodes = traditions.map((t) =>
    toNode(
      t,
      entityNodes.filter((e) => e.parentId === t.id),
    ),
  );
  // A sacred entity can be a direct child of a religion (no named tradition
  // in between, e.g. Tiruvalluvar) rather than of a tradition.
  const entitiesUnderReligion = entityNodes.filter(
    (e) => e.parentId && religions.some((r) => r.id === e.parentId),
  );

  return religions.map((r) =>
    toNode(r, [
      ...traditionNodes.filter((t) => t.parentId === r.id),
      ...entitiesUnderReligion.filter((e) => e.parentId === r.id),
    ]),
  );
}

export async function listScopesByTypeWithCounts(
  type: ScopeType,
): Promise<Array<ScopeRecord & { contentCount: number }>> {
  const rows = await prisma.scope.findMany({
    where: { type },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { contentScopes: true } } },
  });
  return rows.map((row) => ({ ...asScope(row), contentCount: row._count.contentScopes }));
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
