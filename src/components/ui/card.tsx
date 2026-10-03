import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * The generic card shell. Content-type cards (article, media, poetry, event,
 * heritage, organization…) compose on top of this rather than reusing one
 * "white rectangle with a shadow" everywhere (§29).
 */
export function Card({
  children,
  pad = true,
  flush = false,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  pad?: boolean;
  /** Clips children to the radius — for cards that start with a cover. */
  flush?: boolean;
  className?: string;
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <As
      className={[
        "ds-card",
        pad ? "ds-card--pad" : "",
        flush ? "ds-card--flush" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </As>
  );
}

/** A card whose whole surface is one link. */
export function CardLink({
  href,
  children,
  pad = false,
  className,
}: {
  href: string;
  children: ReactNode;
  pad?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "ds-card",
        "ds-card--interactive",
        "ds-card--flush",
        pad ? "ds-card--pad" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Link>
  );
}
