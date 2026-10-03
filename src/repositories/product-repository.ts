import { prisma } from "@/lib/db";
import type { LocalizedString } from "@/lib/localized";

export type ProductRecord = {
  id: string;
  organizationId: string;
  name: LocalizedString;
  description: LocalizedString | null;
  imageUrl: string | null;
  price: string | null;
  purchaseUrl: string;
  sortOrder: number;
  active: boolean;
};

function asLocalized(value: unknown): LocalizedString | null {
  if (!value || typeof value !== "object") return null;
  return value as LocalizedString;
}

function mapProduct(row: {
  id: string;
  organizationId: string;
  name: unknown;
  description: unknown;
  imageUrl: string | null;
  price: string | null;
  purchaseUrl: string;
  sortOrder: number;
  active: boolean;
}): ProductRecord {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: asLocalized(row.name) ?? {},
    description: asLocalized(row.description),
    imageUrl: row.imageUrl,
    price: row.price,
    purchaseUrl: row.purchaseUrl,
    sortOrder: row.sortOrder,
    active: row.active,
  };
}

/** Public callers (the org page) only ever want the active catalogue. */
export async function listActiveProducts(organizationId: string): Promise<ProductRecord[]> {
  const rows = await prisma.product.findMany({
    where: { organizationId, active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapProduct);
}

/** The manage console needs hidden products too, so it can un-hide them. */
export async function listAllProducts(organizationId: string): Promise<ProductRecord[]> {
  const rows = await prisma.product.findMany({
    where: { organizationId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapProduct);
}

export type CreateProductInput = {
  id: string;
  organizationId: string;
  name: LocalizedString;
  description?: LocalizedString | null;
  imageUrl?: string | null;
  price?: string | null;
  purchaseUrl: string;
  sortOrder?: number;
  active?: boolean;
};

export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({
    data: {
      id: input.id,
      organizationId: input.organizationId,
      name: input.name,
      description: input.description ?? undefined,
      imageUrl: input.imageUrl ?? null,
      price: input.price ?? null,
      purchaseUrl: input.purchaseUrl,
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
    },
  });
}

export type UpdateProductInput = {
  name?: LocalizedString;
  description?: LocalizedString | null;
  imageUrl?: string | null;
  price?: string | null;
  purchaseUrl?: string;
  sortOrder?: number;
  active?: boolean;
};

export async function updateProduct(
  id: string,
  organizationId: string,
  input: UpdateProductInput,
) {
  return prisma.product.updateMany({
    where: { id, organizationId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description ?? undefined } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.purchaseUrl !== undefined ? { purchaseUrl: input.purchaseUrl } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
}

export async function deleteProduct(id: string, organizationId: string) {
  return prisma.product.deleteMany({ where: { id, organizationId } });
}
