import type {
  OrganizationKind,
  OrganizationMemberRole,
  OrganizationPublishMode,
  OrganizationStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { LocalizedString } from "@/lib/localized";

export type OrganizationRecord = {
  id: string;
  slug: string;
  name: LocalizedString;
  description?: LocalizedString | null;
  kind: OrganizationKind;
  status: OrganizationStatus;
  publishMode: OrganizationPublishMode;
  verifiedAt: Date | null;
  logoPath?: string | null;
  coverImage?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  /** Localized place name, e.g. {"en": "Velankanni, Tamil Nadu"}. */
  location?: LocalizedString | null;
  scopeIds: string[];
  timezone: string;
  address: LocalizedString | null;
  howToReach: LocalizedString | null;
  dressCode: LocalizedString | null;
  entryRules: LocalizedString | null;
  accessibility: LocalizedString | null;
  donationUrl: string | null;
};

export type OrganizationMembershipRecord = {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationMemberRole;
  active: boolean;
  userName: string;
  userEmail: string;
};

function asLocalized(value: unknown): LocalizedString {
  return (value ?? {}) as LocalizedString;
}

/** The one place a database row becomes an OrganizationRecord, so the two
 *  query paths below cannot drift apart when a field is added. */
type OrganizationRow = Awaited<
  ReturnType<typeof prisma.organization.findUnique>
> & { scopes: { scopeId: string }[] };

function toOrganizationRecord(row: NonNullable<OrganizationRow>): OrganizationRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: asLocalized(row.name),
    description: row.description ? asLocalized(row.description) : null,
    kind: row.kind,
    status: row.status,
    publishMode: row.publishMode,
    verifiedAt: row.verifiedAt,
    logoPath: row.logoPath,
    coverImage: row.coverImage,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    website: row.website,
    location: row.location ? asLocalized(row.location) : null,
    scopeIds: row.scopes.map((s) => s.scopeId),
    timezone: row.timezone ?? "Asia/Kolkata",
    address: row.address ? asLocalized(row.address) : null,
    howToReach: row.howToReach ? asLocalized(row.howToReach) : null,
    dressCode: row.dressCode ? asLocalized(row.dressCode) : null,
    entryRules: row.entryRules ? asLocalized(row.entryRules) : null,
    accessibility: row.accessibility ? asLocalized(row.accessibility) : null,
    donationUrl: row.donationUrl ?? null,
  };
}

export async function getOrganizationBySlug(slug: string): Promise<OrganizationRecord | null> {
  const row = await prisma.organization.findUnique({
    where: { slug },
    include: { scopes: { select: { scopeId: true } } },
  });
  if (!row) return null;
  return toOrganizationRecord(row as NonNullable<OrganizationRow>);
}

/**
 * Looks an organization up by id — used on write paths (e.g. publishing as
 * an organization) where the caller already has a trusted id, typically from
 * the actor's own membership list, rather than a client-submitted slug.
 */
export async function getOrganizationById(id: string): Promise<OrganizationRecord | null> {
  const row = await prisma.organization.findUnique({
    where: { id },
    include: { scopes: { select: { scopeId: true } } },
  });
  if (!row) return null;
  return toOrganizationRecord(row as NonNullable<OrganizationRow>);
}

export async function listOrganizations(limit = 50): Promise<OrganizationRecord[]> {
  const rows = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    take: limit,
    include: { scopes: { select: { scopeId: true } } },
  });
  return rows.map((row) => toOrganizationRecord(row as NonNullable<OrganizationRow>));
}

export async function listOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMembershipRecord[]> {
  const rows = await prisma.organizationMembership.findMany({
    where: { organizationId, active: true },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    role: row.role,
    active: row.active,
    userName: row.user.name,
    userEmail: row.user.email,
  }));
}

export type CreateOrganizationInput = {
  id: string;
  slug: string;
  name: LocalizedString;
  description?: LocalizedString;
  kind: OrganizationKind;
  status?: OrganizationStatus;
  scopeIds?: string[];
  createdById?: string;
};

export async function createOrganization(input: CreateOrganizationInput) {
  return prisma.organization.create({
    data: {
      id: input.id,
      slug: input.slug,
      name: input.name,
      description: input.description,
      kind: input.kind,
      status: input.status ?? "verified",
      verifiedAt: input.status === "verified" ? new Date() : undefined,
      createdById: input.createdById,
      scopes: input.scopeIds?.length
        ? { create: input.scopeIds.map((scopeId) => ({ scopeId })) }
        : undefined,
    },
  });
}

/**
 * Fields an organization's own admin may edit.
 *
 * Deliberately excludes `status`, `verifiedAt`, `kind` and `slug`: verification
 * is a claim the platform makes about an organization, not one the
 * organization makes about itself, so it stays with platform moderators. An
 * org admin editing its own badge would make the badge worthless.
 */
export type UpdateOrganizationProfileInput = {
  name?: LocalizedString;
  description?: LocalizedString | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  location?: LocalizedString | null;
  logoPath?: string | null;
  coverImage?: string | null;
};

export async function updateOrganizationProfile(
  organizationId: string,
  input: UpdateOrganizationProfileInput,
) {
  return prisma.organization.update({
    where: { id: organizationId },
    data: {
      // `undefined` leaves a column untouched; `null` clears it. Callers rely
      // on that distinction to do partial updates.
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description ?? undefined }
        : {}),
      ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
      ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.location !== undefined
        ? { location: input.location ?? undefined }
        : {}),
      ...(input.logoPath !== undefined ? { logoPath: input.logoPath } : {}),
      ...(input.coverImage !== undefined ? { coverImage: input.coverImage } : {}),
    },
  });
}

/**
 * Visit-planning fields — kept separate from `UpdateOrganizationProfileInput`
 * because they answer a different question ("can I go, when, what do I
 * wear") than identity fields do, and because plain text is enough for all
 * of them (no rich-text/HTML sanitisation needed, per field).
 */
export type UpdateOrganizationVisitInfoInput = {
  timezone?: string;
  address?: LocalizedString | null;
  howToReach?: LocalizedString | null;
  dressCode?: LocalizedString | null;
  entryRules?: LocalizedString | null;
  accessibility?: LocalizedString | null;
  donationUrl?: string | null;
};

export async function updateOrganizationVisitInfo(
  organizationId: string,
  input: UpdateOrganizationVisitInfoInput,
) {
  return prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      ...(input.address !== undefined ? { address: input.address ?? undefined } : {}),
      ...(input.howToReach !== undefined ? { howToReach: input.howToReach ?? undefined } : {}),
      ...(input.dressCode !== undefined ? { dressCode: input.dressCode ?? undefined } : {}),
      ...(input.entryRules !== undefined ? { entryRules: input.entryRules ?? undefined } : {}),
      ...(input.accessibility !== undefined
        ? { accessibility: input.accessibility ?? undefined }
        : {}),
      ...(input.donationUrl !== undefined ? { donationUrl: input.donationUrl } : {}),
    },
  });
}

export async function assignOrganizationMember(
  organizationId: string,
  userId: string,
  role: OrganizationMemberRole,
) {
  return prisma.organizationMembership.upsert({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    create: { organizationId, userId, role },
    update: { role, active: true },
  });
}

export async function writeAuditLog(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  organizationId?: string;
  scopeId?: string;
  previousState?: unknown;
  newState?: unknown;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      organizationId: input.organizationId,
      scopeId: input.scopeId,
      previousState: input.previousState as object | undefined,
      newState: input.newState as object | undefined,
    },
  });
}
