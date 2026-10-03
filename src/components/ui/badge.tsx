import type { ReactNode } from "react";
import { BadgeCheck } from "lucide-react";

/**
 * Badges (§26).
 *
 * The official/community distinction has to be legible at a glance but must
 * not shout: `official` is an outlined ink chip, `community` a quiet filled
 * one. Neither uses colour alone to carry the meaning — each has a word.
 */

export type BadgeTone =
  | "neutral"
  | "official"
  | "community"
  | "verified"
  | "accent"
  | "success"
  | "warning"
  | "danger";

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={["ds-badge", `ds-badge--${tone}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? (
        <span className="ds-badge__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}

/** A verified organization mark. The word is part of the badge, not a tooltip. */
export function VerifiedBadge({ label }: { label: string }) {
  return (
    <Badge tone="verified" icon={<BadgeCheck size={12} strokeWidth={2} />}>
      {label}
    </Badge>
  );
}
