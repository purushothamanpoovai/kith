import type { ReportReason, ReportTargetType } from "@/generated/prisma/client";
import {
  applyModerationAction,
  countOpenReports,
  createReport,
  listModeratorScopeIds,
  listOpenReports,
  listReportsForModerator,
} from "@/repositories/moderation-repository";
import { prisma } from "@/lib/db";
import type { AuthUser } from "@/lib/permissions";
import { canModerate } from "@/lib/permissions";
import { isSuperAdmin } from "@/services/permission-service";

export async function submitReport(
  user: AuthUser,
  input: {
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    explanation?: string;
  },
) {
  const scopeIds = await resolveTargetScopeIds(input.targetType, input.targetId);
  return createReport({
    reporterId: user.id,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    explanation: input.explanation,
    scopeIds,
  });
}

async function resolveTargetScopeIds(
  targetType: ReportTargetType,
  targetId: string,
): Promise<string[]> {
  if (targetType === "content") {
    const rows = await prisma.contentScope.findMany({
      where: { contentId: targetId },
      select: { scopeId: true },
    });
    return rows.map((r) => r.scopeId);
  }
  if (targetType === "event") {
    const rows = await prisma.eventScope.findMany({
      where: { eventId: targetId },
      select: { scopeId: true },
    });
    return rows.map((r) => r.scopeId);
  }
  return [];
}

export async function getModerationQueue(user: AuthUser | null) {
  if (!user || !(await canModerate(user))) return [];
  if (isSuperAdmin(user.role) || user.role === "global_moderator") {
    return listOpenReports();
  }
  const scopeIds = await listModeratorScopeIds(user.id);
  return listReportsForModerator(scopeIds);
}

export async function getOpenReportCount(user: AuthUser | null): Promise<number> {
  if (!user || !(await canModerate(user))) return 0;
  return countOpenReports();
}

export { applyModerationAction };
