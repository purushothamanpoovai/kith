import { Link } from "@/i18n/navigation";
import type { ScopeBreadcrumb } from "@/domain/scope/types";
import { pickLocalized } from "@/lib/localized";

type Props = {
  items: ScopeBreadcrumb[];
  locale: string;
  ariaLabel: string;
};

export function Breadcrumbs({ items, locale, ariaLabel }: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel}>
      <ol className="ds-breadcrumbs">
        {items.map((item, index) => {
          const label = pickLocalized(item.title, locale);
          const isLast = index === items.length - 1;
          return (
            <li key={item.id}>
              {/* The separator is drawn by `li + li::before` in layout.css;
                  emitting one here as well produced a doubled slash. */}
              {isLast ? (
                <span aria-current="page">{label}</span>
              ) : (
                <Link href={item.href as `/${string}`}>{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
