"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import type { ModerationActionKind, ReportTargetType } from "@/generated/prisma/client";
import { moderateReportAction } from "@/app/actions/moderation-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";

type ReportItem = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  explanation: string | null;
  status: string;
  createdAt: Date;
  reporter: { name: string };
};

type Props = {
  reports: ReportItem[];
};

/**
 * The moderation queue.
 *
 * Two principles drove this rewrite:
 *
 *  - Consistency (P2). The three actions were bare <button> elements with no
 *    class, so they rendered as browser default controls — the only place in
 *    the product that happened. They now use the shared button system, with
 *    the destructive one carrying the danger variant.
 *  - User control and error prevention (P3, P6). "Remove" permanently takes
 *    content down and had no confirmation: a mis-click was unrecoverable.
 *    It now asks first, and names the thing being removed so the moderator
 *    can tell they are acting on the report they meant.
 */
export function ModerationQueue({ reports }: Props) {
  const t = useTranslations("moderation");
  const tCommon = useTranslations("common");
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<ReportItem | null>(null);

  if (reports.length === 0) {
    return (
      <EmptyState
        title={t("queueEmpty")}
        mark={<ShieldAlert size={26} strokeWidth={1.25} />}
        as="h2"
      />
    );
  }

  function act(report: ReportItem, kind: ModerationActionKind) {
    startTransition(() => {
      void moderateReportAction({
        reportId: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        kind,
      });
    });
  }

  return (
    <>
      <div className="ds-stack" aria-busy={pending}>
        {reports.map((report) => (
          <article key={report.id} className="ds-queue-item">
            <header className="ds-queue-item__head">
              <Badge tone="warning">
                {t(`reasons.${report.reason}` as "reasons.other")}
              </Badge>
              <Badge tone="neutral">
                {t(`targetTypes.${report.targetType}` as "targetTypes.content")}
              </Badge>
              <span className="ds-metadata">{report.reporter.name}</span>
              <time className="ds-metadata" dateTime={report.createdAt.toISOString()}>
                {report.createdAt.toLocaleDateString()}
              </time>
            </header>

            {report.explanation ? (
              <p className="ds-queue-item__reason">{report.explanation}</p>
            ) : null}

            <div className="ds-queue-item__actions">
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => act(report, "dismiss_report")}
              >
                {t("dismiss")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => act(report, "hide")}
              >
                {t("hide")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={pending}
                onClick={() => setConfirming(report)}
              >
                {t("remove")}
              </Button>
            </div>
          </article>
        ))}
      </div>

      <Dialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        title={t("confirmRemoveTitle")}
        closeLabel={tCommon("cancel")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              variant="danger"
              loading={pending}
              onClick={() => {
                if (confirming) act(confirming, "remove");
                setConfirming(null);
              }}
            >
              {t("remove")}
            </Button>
          </>
        }
      >
        <p className="ds-body">{t("confirmRemoveBody")}</p>
        {confirming ? (
          <p className="ds-metadata" style={{ marginBlockStart: "var(--ds-space-3)" }}>
            {t(`reasons.${confirming.reason}` as "reasons.other")}
            {" · "}
            {t(`targetTypes.${confirming.targetType}` as "targetTypes.content")}
          </p>
        ) : null}
      </Dialog>
    </>
  );
}
