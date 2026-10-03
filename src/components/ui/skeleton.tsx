import type { CSSProperties } from "react";

/**
 * Loading skeletons (§34).
 *
 * A skeleton mirrors the geometry of the thing it replaces, so the page does
 * not reflow when content lands. The whole group carries one polite live
 * region label rather than announcing each bar.
 */

export function Skeleton({
  variant = "text",
  width,
  height,
  className,
  style,
}: {
  variant?: "text" | "title" | "cover" | "avatar" | "block";
  width?: string;
  height?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={[
        "ds-skeleton",
        variant !== "block" ? `ds-skeleton--${variant}` : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width, height, ...style }}
      aria-hidden
    />
  );
}

/** Wraps a set of skeletons and announces the wait once. */
export function SkeletonGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="ds-sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Matches ArticleCard's grid geometry. */
export function CardSkeleton() {
  return (
    <div className="ds-card ds-card--flush">
      <Skeleton variant="cover" />
      <div style={{ padding: "var(--ds-space-4)", display: "grid", gap: "var(--ds-space-2)" }}>
        <Skeleton variant="text" width="35%" />
        <Skeleton variant="title" width="88%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="62%" />
      </div>
    </div>
  );
}

/** Matches the article reader's masthead + first screen of prose. */
export function ArticleSkeleton() {
  return (
    <div style={{ display: "grid", gap: "var(--ds-space-5)" }}>
      <Skeleton variant="text" width="8rem" />
      <Skeleton variant="title" width="80%" height="2.4rem" />
      <Skeleton variant="text" width="50%" />
      <Skeleton variant="cover" />
      {[100, 96, 99, 72, 94, 88].map((w, i) => (
        <Skeleton key={i} variant="text" width={`${w}%`} height="0.9em" />
      ))}
    </div>
  );
}

/** Matches a list of rows (events, subscriptions, search results). */
export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: "grid", gap: "var(--ds-space-3)" }}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="ds-card ds-card--pad"
          style={{ display: "grid", gap: "var(--ds-space-2)" }}
        >
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="title" width="70%" />
        </div>
      ))}
    </div>
  );
}

/** Matches one `.ds-widget` block in MagazineSidebar/ScopeSidebar-style rails. */
export function SidebarWidgetSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <section className="ds-widget">
      <Skeleton variant="text" width="45%" style={{ marginBlockEnd: "var(--ds-space-3)" }} />
      <div style={{ display: "grid", gap: "var(--ds-space-3)" }}>
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} variant="text" width={`${80 - i * 8}%`} />
        ))}
      </div>
    </section>
  );
}

/** Matches PageFrame's `.ds-columns__aside` — a couple of stacked widgets. */
export function SidebarSkeleton() {
  return (
    <div className="ds-columns__aside">
      <SidebarWidgetSkeleton rows={5} />
      <SidebarWidgetSkeleton rows={3} />
    </div>
  );
}

/** Matches the `.ds-hero` band used by ScopeDetailPage and similar scope/org pages. */
export function HeroSkeleton() {
  return (
    <div className="ds-hero">
      <div className="ds-hero__inner">
        <Skeleton variant="text" width="8rem" />
        <Skeleton variant="title" width="min(28rem, 80%)" height="2.6rem" />
        <Skeleton variant="text" width="min(40rem, 90%)" />
        <div className="ds-hero__actions">
          <Skeleton variant="text" width="7rem" height="2.25rem" />
          <Skeleton variant="text" width="7rem" height="2.25rem" />
        </div>
      </div>
    </div>
  );
}
