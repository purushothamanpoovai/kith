import { prisma } from "@/lib/db";
import type { LocalizedString } from "@/lib/localized";

export type OrganizationServiceRecord = {
  id: string;
  organizationId: string;
  name: LocalizedString;
  language: string;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string | null;
  note: LocalizedString | null;
  sortOrder: number;
  verifiedAt: Date | null;
};

function asLocalized(value: unknown): LocalizedString | null {
  if (!value || typeof value !== "object") return null;
  return value as LocalizedString;
}

function mapService(row: {
  id: string;
  organizationId: string;
  name: unknown;
  language: string;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string | null;
  note: unknown;
  sortOrder: number;
  verifiedAt: Date | null;
}): OrganizationServiceRecord {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: asLocalized(row.name) ?? {},
    language: row.language,
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    note: asLocalized(row.note),
    sortOrder: row.sortOrder,
    verifiedAt: row.verifiedAt,
  };
}

export async function listOrganizationServices(
  organizationId: string,
): Promise<OrganizationServiceRecord[]> {
  const rows = await prisma.organizationService.findMany({
    where: { organizationId },
    orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }],
  });
  return rows.map(mapService);
}

export type CreateOrganizationServiceInput = {
  id: string;
  organizationId: string;
  name: LocalizedString;
  language?: string;
  dayOfWeek?: number | null;
  startTime: string;
  endTime?: string | null;
  note?: LocalizedString | null;
  sortOrder?: number;
};

export async function createOrganizationService(input: CreateOrganizationServiceInput) {
  return prisma.organizationService.create({
    data: {
      id: input.id,
      organizationId: input.organizationId,
      name: input.name,
      language: input.language ?? "en",
      dayOfWeek: input.dayOfWeek ?? null,
      startTime: input.startTime,
      endTime: input.endTime ?? null,
      note: input.note ?? undefined,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export type UpdateOrganizationServiceInput = {
  name?: LocalizedString;
  language?: string;
  dayOfWeek?: number | null;
  startTime?: string;
  endTime?: string | null;
  note?: LocalizedString | null;
  sortOrder?: number;
  verifiedAt?: Date | null;
};

/**
 * Scoped by `organizationId` via `updateMany` (rather than `update` by id
 * alone) so a caller can never touch another organization's row just by
 * guessing an id — the same defence `deleteOrganizationService` uses below.
 */
export async function updateOrganizationService(
  id: string,
  organizationId: string,
  input: UpdateOrganizationServiceInput,
) {
  return prisma.organizationService.updateMany({
    where: { id, organizationId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.dayOfWeek !== undefined ? { dayOfWeek: input.dayOfWeek } : {}),
      ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
      ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
      ...(input.note !== undefined ? { note: input.note ?? undefined } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.verifiedAt !== undefined ? { verifiedAt: input.verifiedAt } : {}),
    },
  });
}

export async function deleteOrganizationService(id: string, organizationId: string) {
  return prisma.organizationService.deleteMany({ where: { id, organizationId } });
}
