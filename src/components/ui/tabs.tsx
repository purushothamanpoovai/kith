import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Link tabs.
 *
 * Filters and section switches are URLs, not client state: they stay
 * shareable, survive a reload, and work before JavaScript arrives. Marked up
 * as a nav + list so a screen reader can skip the whole set.
 */

export type TabItem = {
  key: string;
  href: string;
  label: string;
  count?: number;
};

export function Tabs({
  label,
  items,
  activeKey,
}: {
  /** Names the group, e.g. "Filter media by type". */
  label: string;
  items: TabItem[];
  activeKey?: string;
}) {
  if (items.length <= 1) return null;

  return (
    <nav aria-label={label}>
      <ul className="ds-tabs">
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className="ds-tabs__tab"
                aria-current={active ? "page" : undefined}
              >
                {item.label}
                {item.count !== undefined ? (
                  <span className="ds-tabs__count">{item.count}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** A pill-shaped filter rail — the mobile-friendly form of the same idea. */
export function ChipFilters({
  label,
  items,
  activeKey,
}: {
  label: string;
  items: TabItem[];
  activeKey?: string;
}) {
  if (items.length <= 1) return null;

  return (
    <nav aria-label={label}>
      <div className="ds-chip-rail">
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <Link
              key={item.key}
              href={item.href}
              className="ds-chip"
              aria-current={active ? "page" : undefined}
            >
              {item.label}
              {item.count !== undefined ? (
                <span className="ds-chip__count">{item.count}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Static chip, for metadata that links somewhere but isn't a filter. */
export function Chip({
  href,
  children,
}: {
  href?: string;
  children: ReactNode;
}) {
  if (!href) return <span className="ds-chip">{children}</span>;
  return (
    <Link href={href} className="ds-chip">
      {children}
    </Link>
  );
}
