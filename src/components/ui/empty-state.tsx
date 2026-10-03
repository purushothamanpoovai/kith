import type { ReactNode } from "react";

/**
 * Empty states (§35).
 *
 * "No data" tells the reader nothing. An empty state names what is missing in
 * the reader's own terms, says what it would be good for, and offers the one
 * action that fills it.
 */
export function EmptyState({
  title,
  body,
  actions,
  mark,
  inline = false,
  /** Heading level, so the surrounding page keeps a valid outline (§38). */
  as: Heading = "h3",
}: {
  title: string;
  body?: string;
  actions?: ReactNode;
  mark?: ReactNode;
  inline?: boolean;
  as?: "h2" | "h3" | "h4" | "p";
}) {
  return (
    <div className={["ds-empty", inline ? "ds-empty--inline" : ""].filter(Boolean).join(" ")}>
      {mark ? (
        <span className="ds-empty__mark" aria-hidden>
          {mark}
        </span>
      ) : null}
      <Heading className="ds-empty__title">{title}</Heading>
      {body ? <p className="ds-empty__body">{body}</p> : null}
      {actions ? <div className="ds-empty__actions">{actions}</div> : null}
    </div>
  );
}
