/**
 * Avatars.
 *
 * People are round; organizations are squared, so an institution never reads
 * as a person in a byline or a comment thread (§26). Initials are derived from
 * the display name and hidden from assistive tech when a name is already
 * rendered next to the avatar — which is the usual case.
 */

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

/** First letters of up to two words — script-agnostic, so it works for Indic
 *  and Arabic names as well as Latin ones. */
export function initialsOf(name: string): string {
  return [...name.trim().split(/\s+/)]
    .slice(0, 2)
    .map((part) => [...part][0] ?? "")
    .join("");
}

export function Avatar({
  name,
  src,
  size = "md",
  kind = "person",
  /** Pass false when the name is rendered adjacent, to avoid double reading. */
  labelled = false,
  className,
}: {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  kind?: "person" | "organization";
  labelled?: boolean;
  className?: string;
}) {
  const classes = [
    "ds-avatar",
    size !== "md" ? `ds-avatar--${size}` : "",
    kind === "organization" ? "ds-avatar--org" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (src) {
    return (
      <span className={classes}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local /media mount */}
        <img src={src} alt={labelled ? name : ""} loading="lazy" decoding="async" />
      </span>
    );
  }

  return (
    <span className={classes} role={labelled ? "img" : undefined} aria-label={labelled ? name : undefined} aria-hidden={labelled ? undefined : true}>
      {initialsOf(name)}
    </span>
  );
}
