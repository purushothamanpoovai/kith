import { Link } from "@/i18n/navigation";
import { scopeHref } from "@/domain/scope/routes";
import { pickLocalized } from "@/lib/localized";
import type { ScopeRecord } from "@/services/scope-service";

/**
 * A flat dimension (Topics, Regions, Languages) as a plain link list rather
 * than a card grid (§ Explore redesign) — these are cross-cutting lists with
 * no parent/child structure of their own, so they render as a single-level
 * outline rather than the literal tree used for Religion → Tradition →
 * Sacred Entity.
 */
export function ScopeOutlineList({
  scopes,
  locale,
  itemCountLabel,
}: {
  scopes: Array<ScopeRecord & { contentCount: number }>;
  locale: string;
  itemCountLabel: (count: number) => string;
}) {
  return (
    <ul className="ds-scope-outline">
      {scopes.map((scope) => (
        <li key={scope.id}>
          <Link href={scopeHref(scope.type, scope.slug) as `/${string}`} className="ds-scope-outline__row">
            <span className="ds-scope-outline__label">{pickLocalized(scope.title, locale)}</span>
            <span className="ds-scope-outline__count">{itemCountLabel(scope.contentCount)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
