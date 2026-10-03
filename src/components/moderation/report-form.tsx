"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReportReason, ReportTargetType } from "@/generated/prisma/client";
import { reportAction } from "@/app/actions/moderation-actions";
import { Button, IconButton } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";

const REASONS: ReportReason[] = [
  "harassment",
  "hate",
  "misinformation",
  "spam",
  "copyright",
  "impersonation",
  "inappropriate",
  "dangerous_advice",
  "privacy",
  "other",
];

type Props = {
  targetType: ReportTargetType;
  targetId: string;
  signedIn: boolean;
  compact?: boolean;
};

export function ReportForm({ targetType, targetId, signedIn, compact = false }: Props) {
  const t = useTranslations("moderation");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!signedIn) return null;
  if (done) {
    return (
      <p className="ds-field__message ds-field__message--success" role="status">
        {t("reportThanks")}
      </p>
    );
  }

  return (
    <div className={["ds-report-form", compact ? "ds-report-form--compact" : ""].filter(Boolean).join(" ")}>
      {!open ? (
        compact ? (
          <IconButton size="sm" label={t("report")} onClick={() => setOpen(true)}>
            <Flag size={14} strokeWidth={1.75} aria-hidden />
          </IconButton>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
            {t("report")}
          </Button>
        )
      ) : (
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await reportAction({
                targetType,
                targetId,
                reason: String(formData.get("reason")) as ReportReason,
                explanation: String(formData.get("explanation") ?? ""),
              });
              if (result.ok) {
                setDone(true);
                setOpen(false);
              } else {
                setError(result.error === "auth_required" ? tCommon("authRequired") : t("reportFailed"));
              }
            });
          }}
        >
          {/* Both controls go through Field so they carry a real <label>,
              share the focus and error states of every other form in the
              product, and announce their error to assistive tech (P2, P10). */}
          <Field id={`reason-${targetId}`} label={t("reasonLabel")}>
            <Select id={`reason-${targetId}`} name="reason" required defaultValue="other">
              {REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {t(`reasons.${reason}` as "reasons.other")}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            id={`explanation-${targetId}`}
            label={t("explainLabel")}
            optional
            error={error ?? undefined}
          >
            <Textarea
              id={`explanation-${targetId}`}
              name="explanation"
              placeholder={t("explainPlaceholder")}
              rows={3}
            />
          </Field>
          <div className="ds-row">
            <Button type="submit" variant="primary" loading={pending}>
              {t("submitReport")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
