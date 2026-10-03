import type { SubscriptionTargetType } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type SubscriptionRecord = {
  id: string;
  userId: string;
  targetType: SubscriptionTargetType;
  scopeId: string | null;
  authorId: string | null;
  organizationId: string | null;
  active: boolean;
  notify: boolean;
  feedPriority: number;
  createdAt: Date;
  scopeTitle?: Record<string, string>;
  scopeSlug?: string;
  scopeType?: string;
  organizationName?: Record<string, string>;
  organizationSlug?: string;
};

export async function listUserSubscriptions(userId: string): Promise<SubscriptionRecord[]> {
  const rows = await prisma.subscription.findMany({
    where: { userId, active: true },
    include: { scope: true, organization: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    targetType: row.targetType,
    scopeId: row.scopeId,
    authorId: row.authorId,
    organizationId: row.organizationId,
    active: row.active,
    notify: row.notify,
    feedPriority: row.feedPriority,
    createdAt: row.createdAt,
    scopeTitle: row.scope ? (row.scope.title as Record<string, string>) : undefined,
    scopeSlug: row.scope?.slug,
    scopeType: row.scope?.type,
    organizationName: row.organization
      ? (row.organization.name as Record<string, string>)
      : undefined,
    organizationSlug: row.organization?.slug,
  }));
}

export async function getSubscription(userId: string, scopeId: string) {
  return prisma.subscription.findUnique({
    where: { userId_scopeId: { userId, scopeId } },
  });
}

export async function upsertScopeSubscription(userId: string, scopeId: string) {
  return prisma.subscription.upsert({
    where: { userId_scopeId: { userId, scopeId } },
    create: {
      userId,
      scopeId,
      targetType: "scope",
      active: true,
    },
    update: { active: true },
  });
}

export async function deactivateScopeSubscription(userId: string, scopeId: string) {
  return prisma.subscription.updateMany({
    where: { userId, scopeId },
    data: { active: false },
  });
}

export async function listSubscribedScopeIds(userId: string): Promise<string[]> {
  const rows = await prisma.subscription.findMany({
    where: { userId, active: true, scopeId: { not: null } },
    select: { scopeId: true },
  });
  return rows.map((r) => r.scopeId!).filter(Boolean);
}

export async function countScopeFollowers(scopeId: string): Promise<number> {
  return prisma.subscription.count({
    where: { scopeId, active: true },
  });
}

export async function listScopeFollowers(scopeId: string, limit = 6) {
  const rows = await prisma.subscription.findMany({
    where: { scopeId, active: true },
    include: { user: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => r.user);
}

export async function getOrganizationSubscription(userId: string, organizationId: string) {
  return prisma.subscription.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
}

export async function upsertOrganizationSubscription(userId: string, organizationId: string) {
  return prisma.subscription.upsert({
    where: { userId_organizationId: { userId, organizationId } },
    create: {
      userId,
      organizationId,
      targetType: "organization",
      active: true,
      notify: true,
      feedPriority: 2,
    },
    update: { active: true, notify: true },
  });
}

export async function deactivateOrganizationSubscription(
  userId: string,
  organizationId: string,
) {
  return prisma.subscription.updateMany({
    where: { userId, organizationId },
    data: { active: false },
  });
}

export async function listSubscribedOrganizationIds(userId: string): Promise<string[]> {
  const rows = await prisma.subscription.findMany({
    where: { userId, active: true, organizationId: { not: null } },
    select: { organizationId: true },
  });
  return rows.map((r) => r.organizationId!).filter(Boolean);
}

export async function countOrganizationFollowers(organizationId: string): Promise<number> {
  return prisma.subscription.count({
    where: { organizationId, active: true },
  });
}

/**
 * Author subscriptions ("follow this person's posts") have no unique
 * constraint in the schema — unlike scope/organization targets, a user may
 * only ever have one active row per author, so callers deactivate any
 * existing row before creating a fresh one rather than relying on upsert.
 */
export async function getAuthorSubscription(userId: string, authorId: string) {
  return prisma.subscription.findFirst({
    where: { userId, authorId, targetType: "author" },
  });
}

export async function upsertAuthorSubscription(userId: string, authorId: string) {
  const existing = await getAuthorSubscription(userId, authorId);
  if (existing) {
    return prisma.subscription.update({
      where: { id: existing.id },
      data: { active: true },
    });
  }
  return prisma.subscription.create({
    data: { userId, authorId, targetType: "author", active: true, notify: true },
  });
}

export async function deactivateAuthorSubscription(userId: string, authorId: string) {
  return prisma.subscription.updateMany({
    where: { userId, authorId, targetType: "author" },
    data: { active: false },
  });
}

export async function listFollowedAuthorIds(userId: string): Promise<string[]> {
  const rows = await prisma.subscription.findMany({
    where: { userId, active: true, targetType: "author" },
    select: { authorId: true },
  });
  return rows.map((r) => r.authorId!).filter(Boolean);
}

export async function countAuthorFollowers(authorId: string): Promise<number> {
  return prisma.subscription.count({
    where: { authorId, targetType: "author", active: true },
  });
}

export async function listAuthorFollowers(authorId: string, limit = 6) {
  const rows = await prisma.subscription.findMany({
    where: { authorId, targetType: "author", active: true },
    include: { user: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => r.user);
}
