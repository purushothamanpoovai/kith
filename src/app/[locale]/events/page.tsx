import { getTranslations, setRequestLocale } from "next-intl/server";
import { EventCalendarList } from "@/components/events/event-calendar-list";
import { PageFrame } from "@/components/layout/page-frame";
import { MagazineSidebar } from "@/components/layout/magazine-sidebar";
import { Section } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { NearMeButton } from "@/components/locality/near-me-button";
import { getCurrentUser } from "@/services/auth-service";
import { getCurrentUserContentPreferences } from "@/services/preference-service";
import { getLocalDiscoveryContext } from "@/lib/local-discovery";
import {
  groupEventsByMonth,
  partitionEventsByTime,
  listFollowedEvents,
  listUpcomingEvents,
  sortEventsLocalFirst,
} from "@/services/event-service";

type View = "all" | "mine" | "nearby" | "festivals";

function asView(value: string | undefined): View {
  if (value === "mine" || value === "nearby" || value === "festivals") return value;
  return "all";
}

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const view = asView(query.view);
  setRequestLocale(locale);
  const t = await getTranslations("events");
  const user = await getCurrentUser();
  const prefs = user ? await getCurrentUserContentPreferences() : null;
  const locality = await getLocalDiscoveryContext({ locale, prefs });

  const [allEvents, followed] = await Promise.all([
    listUpcomingEvents(50, { anonymousViewer: !user }),
    user ? listFollowedEvents(user.id) : Promise.resolve([]),
  ]);

  let working = allEvents;
  if (view === "mine") working = followed;
  if (view === "festivals") working = allEvents.filter((event) => event.kind === "festival");
  if (view === "nearby" && locality.regionScopeId) {
    working = sortEventsLocalFirst(
      allEvents.filter(
        (event) =>
          event.scopeIds.includes(locality.regionScopeId!) ||
          !event.scopeIds.some((id) => id.startsWith("region-")),
      ),
      locality.regionScopeId,
    );
  }

  // The clock lives in the service, so this component stays pure.
  const { upcoming, past } = partitionEventsByTime(working);
  const upcomingGroups = groupEventsByMonth(upcoming, locale);
  const pastGroups = groupEventsByMonth(past.slice(0, 12), locale);

  const filters: Array<{ id: View; href: string; label: string }> = [
    { id: "all", href: "/events", label: t("allEvents") },
    { id: "nearby", href: "/events?view=nearby", label: t("nearby") },
    { id: "festivals", href: "/events?view=festivals", label: t("festivals") },
  ];
  if (user) {
    filters.splice(1, 0, {
      id: "mine",
      href: "/events?view=mine",
      label: t("yourRsvps", { count: followed.length }),
    });
  }

  return (
    <PageFrame
      eyebrow={t("eyebrow")}
      title={t("title")}
      lede={t("lede")}
      actions={<NearMeButton active={locality.source === "geo"} />}
      sidebar={
        // The page itself is already a full listing of events, so the
        // sidebar's own "Upcoming events" widget and "bring people together"
        // CTA would only repeat what's already the whole point of being here.
        <MagazineSidebar locale={locale} showEvents={false} showInvite={false} />
      }
    >
      <div className="ds-row ds-row--tight" style={{ marginBlockEnd: "var(--ds-space-5)" }}>
        {filters.map((filter) => (
          <ButtonLink
            key={filter.id}
            href={filter.href}
            variant={view === filter.id ? "primary" : "secondary"}
            size="sm"
          >
            {filter.label}
          </ButtonLink>
        ))}
      </div>

      <Section title={t("upcoming")}>
        <EventCalendarList groups={upcomingGroups} locale={locale} />
      </Section>

      {pastGroups.length > 0 && view !== "mine" ? (
        <Section title={t("recent")}>
          <EventCalendarList groups={pastGroups} locale={locale} />
        </Section>
      ) : null}
    </PageFrame>
  );
}