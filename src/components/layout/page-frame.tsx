import type { ReactNode } from "react";

/**
 * The shared page shell: a masthead, an optional discovery rail, and content.
 *
 * The masthead is a single band — kicker, title, lede, actions — with the
 * actions pulled to the inline end on wide screens so the header stays one
 * screen-inch tall instead of stacking (§9).
 */
export function PageFrame({
  eyebrow,
  title,
  lede,
  actions,
  breadcrumbs,
  children,
  sidebar,
  /** Narrow the measure for reading-first pages. */
  narrow = false,
  /** Tighter header spacing for tool-like pages (e.g. the composer), where
   *  the work surface should start as soon as possible. */
  compact = false,
}: {
  eyebrow?: string;
  title?: string;
  lede?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  children?: ReactNode;
  sidebar?: ReactNode;
  narrow?: boolean;
  compact?: boolean;
}) {
  const hasHeader = Boolean(eyebrow || title || lede || actions);

  const header = hasHeader ? (
    <header
      className={[
        "ds-page-mast",
        actions ? "ds-page-mast--split" : "",
        compact ? "ds-page-mast--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {eyebrow ? <span className="ds-kicker ds-caps">{eyebrow}</span> : null}
      {title ? <h1 className="ds-page-mast__title">{title}</h1> : null}
      {lede ? <p className="ds-page-mast__lede">{lede}</p> : null}
      {actions ? <div className="ds-page-mast__actions">{actions}</div> : null}
    </header>
  ) : null;

  const body = (
    <>
      {breadcrumbs}
      {header}
      {children}
    </>
  );

  if (sidebar) {
    return (
      <div className="ds-animate-in">
        {breadcrumbs}
        {header}
        <div className="ds-columns">
          <div className="ds-columns__main">{children}</div>
          <aside className="ds-columns__aside">{sidebar}</aside>
        </div>
      </div>
    );
  }

  return (
    <div className={`ds-animate-in${narrow ? " ds-container--narrow" : ""}`}>
      {body}
    </div>
  );
}
