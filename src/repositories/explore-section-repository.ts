import type { ScopeType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { LocalizedString } from "@/lib/localized";

export type ExploreSectionRecord = {
  id: string;
  key: string;
  scopeType: ScopeType | null;
  label: LocalizedString | null;
  imageUrl: string | null;
  icon: string | null;
  href: string;
  sortOrder: number;
  active: boolean;
};

function asLocalized(value: unknown): LocalizedString | null {
  if (!value || typeof value !== "object") return null;
  return value as LocalizedString;
}

function mapSection(row: {
  id: string;
  key: string;
  scopeType: ScopeType | null;
  label: unknown;
  imageUrl: string | null;
  icon: string | null;
  href: string;
  sortOrder: number;
  active: boolean;
}): ExploreSectionRecord {
  return {
    id: row.id,
    key: row.key,
    scopeType: row.scopeType,
    label: asLocalized(row.label),
    imageUrl: row.imageUrl,
    icon: row.icon,
    href: row.href,
    sortOrder: row.sortOrder,
    active: row.active,
  };
}

/** Explore itself only ever renders the sections an admin left switched on. */
export async function listActiveExploreSections(): Promise<ExploreSectionRecord[]> {
  const rows = await prisma.exploreSection.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });
  return rows.map(mapSection);
}

/** The admin console needs the hidden ones too, so it can switch them back on. */
export async function listAllExploreSections(): Promise<ExploreSectionRecord[]> {
  const rows = await prisma.exploreSection.findMany({
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });
  return rows.map(mapSection);
}

export async function getExploreSectionById(
  id: string,
): Promise<ExploreSectionRecord | null> {
  const row = await prisma.exploreSection.findUnique({ where: { id } });
  return row ? mapSection(row) : null;
}

export type UpdateExploreSectionInput = {
  label?: LocalizedString | null;
  imageUrl?: string | null;
  icon?: string | null;
  sortOrder?: number;
  active?: boolean;
};

export async function updateExploreSection(
  id: string,
  input: UpdateExploreSectionInput,
) {
  return prisma.exploreSection.update({
    where: { id },
    data: {
      ...(input.label !== undefined ? { label: input.label ?? undefined } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
}

/** Bulk reorder, so dragging/renumbering the whole list is one round trip. */
export async function reorderExploreSections(
  order: Array<{ id: string; sortOrder: number }>,
) {
  return prisma.$transaction(
    order.map(({ id, sortOrder }) =>
      prisma.exploreSection.update({ where: { id }, data: { sortOrder } }),
    ),
  );
}
