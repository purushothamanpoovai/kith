import type {
  ModerationActionKind,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export async function createReport(input: {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  explanation?: string;
  scopeIds?: string[];
}) {
  return prisma.report.create({
    data: {
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      explanation: input.explanation?.trim() || undefined,
      scopeIds: input.scopeIds ?? [],
    },
  });
}

export async function listOpenReports(limit = 30) {
  return prisma.report.findMany({
    where: { status: { in: ["open", "reviewing"] } },
    include: { reporter: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function listReportsForModerator(
  moderatorScopeIds: string[],
  limit = 30,
) {
  if (moderatorScopeIds.length === 0) {
    return listOpenReports(limit);
  }
  return prisma.report.findMany({
    where: {
      status: { in: ["open", "reviewing"] },
      OR: [
        { scopeIds: { isEmpty: true } },
        { scopeIds: { hasSome: moderatorScopeIds } },
      ],
    },
    include: { reporter: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function getReportById(id: string) {
  return prisma.report.findUnique({
    where: { id },
    include: {
      reporter: { select: { name: true } },
      actions: { include: { moderator: { select: { name: true } } } },
    },
  });
}

export async function applyModerationAction(input: {
  moderatorId: string;
  reportId: string;
  targetType: ReportTargetType;
  targetId: string;
  kind: ModerationActionKind;
  note?: string;
  reportStatus: ReportStatus;
}) {
  return prisma.$transaction(async (tx) => {
    const action = await tx.moderationAction.create({
      data: {
        moderatorId: input.moderatorId,
        reportId: input.reportId,
        targetType: input.targetType,
        targetId: input.targetId,
        kind: input.kind,
        note: input.note,
      },
    });

    await tx.report.update({
      where: { id: input.reportId },
      data: { status: input.reportStatus },
    });

    if (input.targetType === "content" && input.kind === "hide") {
      await tx.content.update({
        where: { id: input.targetId },
        data: { status: "hidden" },
      });
    }
    if (input.targetType === "content" && input.kind === "remove") {
      await tx.content.update({
        where: { id: input.targetId },
        data: { status: "removed" },
      });
    }
    if (input.targetType === "content" && input.kind === "restore") {
      await tx.content.update({
        where: { id: input.targetId },
        data: { status: "published" },
      });
    }

    return action;
  });
}

export async function listModeratorScopeIds(userId: string): Promise<string[]> {
  const rows = await prisma.scopeModerator.findMany({
    where: { userId },
    select: { scopeId: true },
  });
  return rows.map((r) => r.scopeId);
}

export async function countOpenReports(): Promise<number> {
  return prisma.report.count({ where: { status: { in: ["open", "reviewing"] } } });
}
