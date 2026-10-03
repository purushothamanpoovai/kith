import { Link } from "@/i18n/navigation";
import { DecorativePattern } from "@/components/graphics/decorative-pattern";
import { resolveScopeTheme } from "@/domain/theme/theme-config";
import { scopeHref } from "@/domain/scope/routes";
import { sortScopesAlphabetically } from "@/lib/scope-sort";
import {
  getScopeDescription,
  getScopeLabel,
  type ScopeRecord,
} from "@/services/scope-service";

/**
 * A discovery tile for a scope (§23).
 *
 * Each tile's pattern *shape* still comes from the scope's resolved theme, so
 * a grid of religions or regions is visually differentiated without any of
 * them being given an emblem (§6, §44). The tile no longer sets its own
 * contextual *colour* (`data-accent`), though: a contextual accent is for a
 * single scope's own page, tinting everything on it — several different
 * scopes listed side by side (here, or on a parent scope's page) instead
 * share the page's one ambient accent, so a list of unrelated traditions
 * doesn't read as a clashing rainbow of unrelated brand colours.
 */
export function ScopeCard({
  scope,
  locale,
  compact = false,
  count,
}: {
  scope: ScopeRecord;
  locale: string;
  compact?: boolean;
  count?: string;
}) {
  const theme = resolveScopeTheme(scope.type, scope.slug);
  const description = getScopeDescription(scope, locale);
  // The compact pill has no room for art — it drops the gradient and glow for
  // the same reason, so cover images are for the full-size tile only.
  const cover = compact ? null : scope.coverImage;

  return (
    <Link
      href={scopeHref(scope.type, scope.slug) as `/${string}`}
      className={[
        "ds-scope-card",
        compact ? "ds-scope-card--compact" : null,
        cover ? "ds-scope-card--art" : null,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {cover ? (
        <span className="ds-scope-card__art" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- served from
              the local /media mount, not through the image optimiser (matches
              content-cover.tsx). */}
          <img src={cover} alt="" loading="lazy" decoding="async" />
        </span>
      ) : (
        <DecorativePattern
          pattern={theme.pattern}
          opacity={compact ? 0.07 : 0.16}
          fade="block"
        />
      )}
      <span className="ds-scope-card__glow" aria-hidden />
      <span className="ds-scope-card__label">
        {!cover && !compact && scope.icon ? (
          <span className="ds-scope-card__icon" aria-hidden>
            {scope.icon}
          </span>
        ) : null}
        {getScopeLabel(scope, locale)}
      </span>
      {count ? <span className="ds-scope-card__count">{count}</span> : null}
      {!compact && description ? (
        <span className="ds-scope-card__desc ds-clamp-2">{description}</span>
      ) : null}
    </Link>
  );
}

/** A grid of scope tiles, alphabetised in the reader's locale. */
export function ScopeCardGrid({
  scopes,
  locale,
  compact = false,
  limit,
}: {
  scopes: ScopeRecord[];
  locale: string;
  compact?: boolean;
  limit?: number;
}) {
  const sorted = sortScopesAlphabetically(scopes, locale);
  const shown = limit ? sorted.slice(0, limit) : sorted;

  return (
    <ul className={compact ? "ds-grid ds-grid--tiles" : "ds-grid ds-grid--3"}>
      {shown.map((scope) => (
        <li key={scope.id}>
          <ScopeCard scope={scope} locale={locale} compact={compact} />
        </li>
      ))}
    </ul>
  );
}
