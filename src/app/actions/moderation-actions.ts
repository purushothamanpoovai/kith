"use server";

import { revalidatePath } from "next/cache";
import type { ModerationActionKind, ReportReason, ReportTargetType } from "@/generated/prisma/client";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getCurrentUser } from "@/services/auth-service";
import { canAccessAdmin, canModerate } from "@/lib/permissions";
import {
  applyModerationAction,
  submitReport,
} from "@/services/moderation-service";

export async function reportAction(input: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  explanation?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "auth_required" as const };
  await submitReport(user, input);
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function moderateReportAction(input: {
  reportId: string;
  targetType: ReportTargetType;
  targetId: string;
  kind: ModerationActionKind;
  note?: string;
}) {
  const user = await getCurrentUser();
  if (!user || !(await canModerate(user))) return { ok: false as const };

  const reportStatus =
    input.kind === "dismiss_report"
      ? "dismissed"
      : input.kind === "escalate"
        ? "reviewing"
        : "resolved";

  await applyModerationAction({
    moderatorId: user.id,
    reportId: input.reportId,
    targetType: input.targetType,
    targetId: input.targetId,
    kind: input.kind,
    note: input.note,
    reportStatus,
  });
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function requireModeratorPage() {
  const user = await getCurrentUser();
  const locale = await getLocale();
  if (!user || !(await canModerate(user))) {
    return redirect({ href: "/login", locale });
  }
  return user;
}

export async function requireSuperAdminPage() {
  const user = await getCurrentUser();
  const locale = await getLocale();
  if (!user || !(await canAccessAdmin(user))) {
    return redirect({ href: "/login", locale });
  }
  return user;
}
