import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookOpen, Compass } from "lucide-react";
import { ContentCard, ArticleCard } from "@/components/content/content-card";
import { PostCard } from "@/components/community/post-card";
import { HomeHero } from "@/components/home/home-hero";
import { MagazineSidebar } from "@/components/layout/magazine-sidebar";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { getActiveScopeId } from "@/lib/scope-context";
import {
  getUserBookmarkIds,
  getUserReactionIds,
} from "@/repositories/community-repository";
import { FocusPromptBanner } from "@/components/settings/focus-prompt-banner";
import { hasConfiguredFocus } from "@/domain/user/preferences";
import { getLocalDiscoveryContext } from "@/lib/local-discovery";
import { getCurrentUser } from "@/services/auth-service";
import { getCurrentUserContentPreferences } from "@/services/preference-service";
import {
  buildGuestFeed,
  buildPersonalFeed,
  listFeaturedContent,
} from "@/services/content-service";
import { listTodayPractice } from "@/services/practice-service";
import {
  listUpcomingEvents,
  isEventUpcoming,
  sortEventsLocalFirst,
} from "@/services/event-service";
import { EventCard } from "@/components/events/event-row";
import type { ContentRecord, FeedItem } from "@/domain/content/types";

/**
 * Home (§8, §9, §22, §43).
 *
 * Bands, in order of what a reader arriving here needs: a bounded editorial
 * hero with the featured story inside it, entry points into the graph, the
 * personalised or public river, and a discovery rail. Every band carries
 * content — there is no decorative band and no empty band.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // These four are independent of one another, so they are issued together
  // rather than in series: awaiting them one at a time stacked four database
  // round-trips into the critical path for no reason.
  const [t, user, activeScopeId, featured] = await Promise.all([
    getTranslations(),
    getCurrentUser(),
    getActiveScopeId(),
    listFeaturedContent(7),
  ]);

  const userPrefs = user ? await getCurrentUserContentPreferences() : null;
  const showFocusPrompt = Boolean(user && userPrefs && !hasConfiguredFocus(userPrefs));

  // Locality depends on the reader's preferences, so it waits for them.
  const locality = await getLocalDiscoveryContext({ locale, prefs: userPrefs });

  const feedItems: Array<ContentRecord | FeedItem> = user
    ? await buildPersonalFeed(user.id, {
        activeScopeId,
        regionScopeId: locality.regionScopeId,
        limit: 18,
      })
    : await buildGuestFeed(14, { regionScopeId: locality.regionScopeId });

  const [practice, festivalEvents] = await Promise.all([
    listTodayPractice({
      regionScopeId: locality.regionScopeId,
      languageScopeId:
        locale === "ta"
          ? "lang-ta"
          : locale === "hi"
            ? "lang-hi"
            : locale === "ml"
              ? "lang-ml"
              : locale === "ur"
                ? "lang-ar"
                : "lang-en",
      limit: 2,
    }),
    listUpcomingEvents(16, { kinds: ["festival"], anonymousViewer: !user }),
  ]);
  // isEventUpcoming owns the clock, so this component stays pure.
  const localFestivals = sortEventsLocalFirst(festivalEvents, locality.regionScopeId)
    .filter(isEventUpcoming)
    .slice(0, 3);
  const hero = featured[0] ?? null;
  const lead = featured[1] ?? null;
  const shelf = featured.slice(2, 6);

  const contentIds = feedItems.map((item) => item.id);
  const [reactedIds, bookmarkedIds] = user
    ? await Promise.all([
        getUserReactionIds(user.id, contentIds),
        getUserBookmarkIds(user.id, contentIds),
      ])
    : [new Set<string>(), new Set<string>()];

  return (
    <div className="ds-home ds-animate-in">
      {showFocusPrompt ? <FocusPromptBanner /> : null}

      <HomeHero feature={hero} locale={locale} signedIn={Boolean(user)} />

      <div className="ds-columns">
        <div className="ds-columns__main">
          {/* 1. Featured — the editorial "worth your time" picks, the
                 platform's own highest-confidence recommendation, right
                 after the hero. */}
          {lead || shelf.length > 0 ? (
            <Section
              title={t("home.featuredTitle")}
              kicker={t("home.featuredEyebrow")}
              lede={t("home.featuredHint")}
            >
              <div className="ds-stack">
                {lead ? (
                  <ArticleCard item={lead} locale={locale} density="lead" />
                ) : null}
                {shelf.length > 0 ? (
                  <div className="ds-grid">
                    {shelf.map((item) => (
                      <ContentCard key={item.id} item={item} locale={locale} />
                    ))}
                  </div>
                ) : null}
              </div>
            </Section>
          ) : null}

          {/* 2. Your river / Discover — the core, recurring reason to return
                 to the homepage; a longer list, so it earns the next slot
                 rather than competing with smaller situational bands. */}
          <Section
            title={user ? t("home.yourRiver") : t("home.discoverRiver")}
            kicker={user ? t("personalization.forYou") : undefined}
            lede={activeScopeId ? t("home.scopedFeed") : t("home.openFeed")}
            link={{ href: "/community", label: t("nav.community") }}
          >
            {feedItems.length === 0 ? (
              <EmptyState
                title={t("states.emptyFeedTitle")}
                body={t("states.emptyFeedBody")}
                mark={<Compass size={28} strokeWidth={1.25} />}
                actions={
                  <ButtonLink href="/explore" variant="primary">
                    {t("states.exploreAction")}
                  </ButtonLink>
                }
              />
            ) : (
              <div className="ds-river">
                {feedItems.map((item) =>
                  item.type === "post" ? (
                    <PostCard
                      key={item.id}
                      item={item}
                      locale={locale}
                      signedIn={Boolean(user)}
                      hasReacted={reactedIds.has(item.id)}
                      hasBookmarked={bookmarkedIds.has(item.id)}
                      collapsedComments
                    />
                  ) : (
                    <ContentCard
                      key={item.id}
                      item={item}
                      locale={locale}
                      density="row"
                    />
                  ),
                )}
              </div>
            )}
          </Section>

          {/* 3. Today's practice — small, situational, "only if relevant
                 today" — after the two bands a reader actually returns for. */}
          {practice.length > 0 ? (
            <Section
              title={t("home.todayTitle")}
              kicker={t("home.todayEyebrow")}
              lede={t("home.todayHint")}
            >
              <div className="ds-grid ds-grid--2">
                {practice.map((item) => (
                  <ContentCard key={item.id} item={item} locale={locale} density="row" />
                ))}
              </div>
            </Section>
          ) : null}

          {/* 4. Festivals near you — the most situational band (depends on
                 the calendar and the reader's region), so it reads last. */}
          {localFestivals.length > 0 ? (
            <Section
              title={t("home.festivalsTitle")}
              kicker={t("home.festivalsEyebrow")}
              link={{ href: "/events?view=festivals", label: t("nav.events") }}
            >
              <ul className="ds-list">
                {localFestivals.map((event) => (
                  <li key={event.id}>
                    <EventCard event={event} locale={locale} />
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {user ? (
            <p className="ds-home-note">
              <BookOpen size={15} strokeWidth={1.75} aria-hidden />
              {t("home.signedIn", { name: user.name })}
            </p>
          ) : null}
        </div>

        <aside className="ds-columns__aside">
          <MagazineSidebar locale={locale} trending={featured} anonymousViewer={!user} />
        </aside>
      </div>
    </div>
  );
}
