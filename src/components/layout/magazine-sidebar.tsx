import { getTranslations } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ContentRecord } from "@/domain/content/types";
import { listScopesByType } from "@/repositories/scope-repository";
import { pickLocalized } from "@/lib/localized";
import { listUpcomingEvents } from "@/repositories/event-repository";

/**
 * The discovery rail.
 *
 * Deliberately link-only and compact — a always-visible list of the handful
 * of things worth one click from any page, not a second feed. Thumbnails and
 * excerpts belong to the main column; a sidebar this narrow only has room to
 * name things, not describe them, so every row here is a single line of text
 * (§ sidebar simplification: no popovers, no imagery, only the essentials).
 *
 * Each section can be switched off per page via the `show*` props (all
 * default to on) when a page's own content already covers one of these — the
 * Events page listing events, an article's own "more from this author" rail.
 */
export async function MagazineSidebar({
  locale,
  showTraditions = true,
  showEvents = true,
  anonymousViewer = false,
}: {
  locale: string;
  /** Unused now that the sidebar is link-only, kept so existing callers that
   *  pass featured content as `trending` don't need to change. */
  trending?: ContentRecord[];
  /** Recently published writing — the sidebar no longer shows this; the
   *  prop is kept only so existing callers compile unchanged. */
  showReading?: boolean;
  /** Traditions to follow. */
  showTraditions?: boolean;
  /** The next few upcoming events. */
  showEvents?: boolean;
  /** The "bring people together" events CTA card — retired with the sidebar
   *  simplification; kept only so existing callers compile unchanged. */
  showInvite?: boolean;
  /** True on a page an anonymous visitor can actually reach — narrows the
   *  events widget to `visibility: "public"` only (§ login gate — events). */
  anonymousViewer?: boolean;
}) {
  const t = await getTranslations();
  const [traditions, events] = await Promise.all([
    showTraditions ? listScopesByType("tradition") : Promise.resolve([]),
    showEvents ? listUpcomingEvents(3, { anonymousViewer }) : Promise.resolve([]),
  ]);

  return (
    <>
      {traditions.length > 0 ? (
        <section className="ds-widget" aria-labelledby="rail-traditions">
          <h2 className="ds-widget__title" id="rail-traditions">
            {t("scopes.traditions")}
          </h2>
          <ul className="ds-widget-list">
            {traditions.slice(0, 6).map((scope) => (
              <li key={scope.id} className="ds-widget-list__row">
                <Link href={`/traditions/${scope.slug}`}>
                  {pickLocalized(scope.title, locale)}
                </Link>
              </li>
            ))}
          </ul>
          <Link className="ds-text-link" href="/traditions">
            {t("cards.viewAll")}
          </Link>
        </section>
      ) : null}

      {events.length > 0 ? (
        <section className="ds-widget" aria-labelledby="rail-events">
          <h2 className="ds-widget__title" id="rail-events">
            <CalendarDays size={13} strokeWidth={1.75} aria-hidden />
            {t("events.upcoming")}
          </h2>
          <ul className="ds-widget-list">
            {events.map((event) => (
              <li key={event.id} className="ds-widget-list__row">
                <Link href={`/events/${event.slug}`}>
                  {pickLocalized(event.title, locale)}
                </Link>
                <time
                  className="ds-widget-list__count"
                  dateTime={event.startsAt.toISOString()}
                >
                  {event.startsAt.toLocaleDateString(locale, {
                    day: "numeric",
                    month: "short",
                  })}
                </time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

    </>
  );
}
