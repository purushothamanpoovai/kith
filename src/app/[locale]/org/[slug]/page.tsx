import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Globe, Mail } from "lucide-react";
import { ContentCard } from "@/components/content/content-card";
import { EventCard } from "@/components/events/event-row";
import { ContentCover } from "@/components/graphics/content-cover";
import { DecorativePattern } from "@/components/graphics/decorative-pattern";
import { Avatar } from "@/components/ui/avatar";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { ScopeCardGrid } from "@/components/discovery/scope-card";
import { OrganizationSubscribeButton } from "@/components/organizations/organization-subscribe-button";
import { VisitInfoSection } from "@/components/organizations/visit-info-section";
import { ProductGrid } from "@/components/organizations/product-grid";
import { OrgTicketedEvents } from "@/components/organizations/org-ticketed-events";
import { SignInWall } from "@/components/content/sign-in-wall";
import {
  resolveOrganizationTheme,
  themeAttributes,
} from "@/domain/theme/theme-config";
import { pickLocalized } from "@/lib/localized";
import { sanitizeRedirectTarget } from "@/lib/redirect-target";
import { getOrganizationBySlug } from "@/repositories/organization-repository";
import { listContentByOrganizationIds } from "@/repositories/content-repository";
import { listUpcomingEvents, getUserRsvpsForEvents } from "@/repositories/event-repository";
import { listEventTicketTiers } from "@/repositories/event-ticket-tier-repository";
import { listOrganizationServices } from "@/repositories/organization-service-repository";
import { listActiveProducts } from "@/repositories/product-repository";
import { getScopeById } from "@/repositories/scope-repository";
import { getCurrentUser } from "@/services/auth-service";
import {
  getOrganizationFollowerCount,
  isSubscribedToOrganization,
} from "@/services/subscription-service";

/**
 * An organization's public page (§25, §26).
 *
 * The previous page rendered a title, a full-width stretched "Verified
 * identity" chip and 600px of empty background. This one is structured the
 * way a reader assesses an institution: a cover, a crest, the verified mark,
 * the facts that establish who they are, then their announcements, writing,
 * events and traditions — with every section omitted when it is empty (§24).
 *
 * The organization's identity accent is applied to this subtree only, so the
 * page still reads as the same platform (§5).
 */
export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("organizations");
  const tContent = await getTranslations("content");
  const tEvents = await getTranslations("events");
  const tMedia = await getTranslations("media");
  const user = await getCurrentUser();

  const org = await getOrganizationBySlug(slug);
  if (!org) notFound();

  const name = pickLocalized(org.name, locale);
  const location = org.location ? pickLocalized(org.location, locale) : null;
  const description = org.description ? pickLocalized(org.description, locale) : null;
  const theme = resolveOrganizationTheme(org.slug);
  const isVerified = org.status === "verified";
  const signedIn = Boolean(user);

  // An anonymous visitor sees identity only (name, crest, location, verified
  // mark) — everything else on this page (writing, media, events, products,
  // visit info, contact details, traditions) requires an account. Skipping
  // these queries entirely for a signed-out request is also simply less work
  // per anonymous page view, which is most of this page's traffic (§ login
  // gate — organizations), while a signed-in visit still issues them all in
  // parallel rather than one round trip at a time.
  const gatedData = user
    ? await Promise.all([
        Promise.all(org.scopeIds.map((id) => getScopeById(id))).then((rows) =>
          rows.filter((row): row is NonNullable<typeof row> => row !== null),
        ),
        listContentByOrganizationIds([org.id], ["post"], 6),
        listContentByOrganizationIds([org.id], ["article"], 6),
        listContentByOrganizationIds([org.id], ["audio", "video", "poem"], 6),
        listUpcomingEvents(12, { organizationIds: [org.id] }),
        isSubscribedToOrganization(user.id, org.id),
        getOrganizationFollowerCount(org.id),
        listOrganizationServices(org.id),
        listActiveProducts(org.id),
      ])
    : null;

  const [
    scopes,
    official,
    articles,
    media,
    orgEvents,
    subscribed,
    followerCount,
    services,
    products,
  ] = gatedData ?? [[], [], [], [], [], false, 0, [], []];

  // Ticket tiers are fetched per event, plus the viewer's own RSVPs, so the
  // "events with tiers" section can show remaining capacity and "already
  // booked" without a second round trip per event.
  const [tierEntries, userRsvps] = user
    ? await Promise.all([
        Promise.all(
          orgEvents.map(async (event) => [event.id, await listEventTicketTiers(event.id)] as const),
        ),
        getUserRsvpsForEvents(user.id, orgEvents.map((event) => event.id)),
      ])
    : [[], new Map()];
  const tiersByEventId = new Map(tierEntries);

  const hasAnything =
    official.length > 0 ||
    articles.length > 0 ||
    media.length > 0 ||
    orgEvents.length > 0 ||
    scopes.length > 0 ||
    products.length > 0;

  const returnPath = sanitizeRedirectTarget(`/${locale}/org/${org.slug}`);
  const signInHref = `/login?redirect=${encodeURIComponent(returnPath)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(returnPath)}`;

  return (
    <div className="ds-animate-in" {...themeAttributes(theme)}>
      {/* An organization without a cover shows none, rather than generated
          ornament standing in for a photograph it never provided. */}
      {org.coverImage ? (
        <ContentCover
          seed={org.id}
          src={org.coverImage}
          className="ds-cover ds-org-cover"
          alt=""
          priority
          sizes="100vw"
        />
      ) : null}

      <header className="ds-org-head">
        <DecorativePattern pattern={theme.pattern} opacity={0.05} fade="inline" />
        <div className="ds-org-head__row">
          <Avatar
            name={name}
            src={org.logoPath}
            kind="organization"
            size="xl"
            className="ds-org-head__crest"
          />
          <div className="ds-stack ds-stack--sm">
            <div className="ds-row ds-row--tight">
              {isVerified ? (
                <VerifiedBadge label={t("verified")} />
              ) : (
                <Badge tone="neutral">
                  {t(`status.${org.status}` as "status.pending")}
                </Badge>
              )}
              <Badge tone="neutral">
                {t(`kind.${org.kind}` as "kind.temple")}
              </Badge>
            </div>
            <h1 className="ds-org-head__title">{name}</h1>
            {location ? <p className="ds-hint">{location}</p> : null}
            {signedIn ? (
              <>
                <div className="ds-row ds-row--tight">
                  <OrganizationSubscribeButton
                    organizationId={org.id}
                    subscribed={subscribed}
                    signedIn={signedIn}
                  />
                  {followerCount > 0 ? (
                    <span className="ds-hint">{t("followerCount", { count: followerCount })}</span>
                  ) : null}
                </div>
                <div className="ds-meta-row">
                  {scopes.length > 0 ? (
                    <span>
                      {scopes
                        .map((scope) => pickLocalized(scope.title, locale))
                        .join(" · ")}
                    </span>
                  ) : null}
                  {org.website ? (
                    <span>
                      <a href={org.website} rel="noopener noreferrer" target="_blank">
                        <Globe size={12} strokeWidth={1.75} aria-hidden /> {t("aboutTitle")}
                      </a>
                    </span>
                  ) : null}
                  {org.contactEmail ? (
                    <span>
                      <Mail size={12} strokeWidth={1.75} aria-hidden /> {org.contactEmail}
                    </span>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {signedIn && description ? (
          <p className="ds-org-head__about" dir="auto">
            {description}
          </p>
        ) : null}
      </header>

      <div className="ds-stack ds-stack--lg" style={{ marginBlockStart: "var(--ds-space-7)" }}>
        {!signedIn ? (
          <SignInWall signInHref={signInHref} registerHref={registerHref} />
        ) : (
          <>
            {/* 1. Announcements — the org's own most timely, official voice;
                   the first thing a follower actually wants from this page. */}
            {official.length > 0 ? (
              <Section title={t("announcements")}>
                <div className="ds-grid ds-grid--2">
                  {official.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      locale={locale}
                      density="row"
                    />
                  ))}
                </div>
              </Section>
            ) : null}

            {/* 2. Events — time-sensitive and actionable (RSVP, ticket
                   tiers), so it outranks the org's static reference info. */}
            {orgEvents.length > 0 ? (
              <Section title={tEvents("upcoming")}>
                <ul className="ds-list">
                  {orgEvents.slice(0, 5).map((event) => (
                    <li key={event.id}>
                      <EventCard event={event} locale={locale} />
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            {tiersByEventId.size > 0 &&
            [...tiersByEventId.values()].some((tiers) => tiers.length > 0) ? (
              <Section title={tEvents("ticketedEvents")}>
                <OrgTicketedEvents
                  events={orgEvents}
                  tiersByEventId={tiersByEventId}
                  locale={locale}
                  signedIn={signedIn}
                  userRsvpByEventId={userRsvps}
                  orgSlug={org.slug}
                />
              </Section>
            ) : null}

            {/* 3. Visit info — practical reference (address, hours, how to
                   reach) a reader consults once they're already interested,
                   not the first reason they opened the page. */}
            <VisitInfoSection org={org} services={services} locale={locale} />

            {/* 4. Deeper content — articles and media reward a reader who is
                   still here after the timely/practical bands above. */}
            {articles.length > 0 ? (
              <Section title={tContent("types.article")}>
                <div className="ds-grid">
                  {articles.map((item) => (
                    <ContentCard key={item.id} item={item} locale={locale} />
                  ))}
                </div>
              </Section>
            ) : null}

            {media.length > 0 ? (
              <Section title={tMedia("title")}>
                <div className="ds-media-grid">
                  {media.map((item) => (
                    <ContentCard key={item.id} item={item} locale={locale} />
                  ))}
                </div>
              </Section>
            ) : null}

            {/* 5. Products — commerce, lower priority than the org's own
                   editorial voice and practical info. */}
            {products.length > 0 ? (
              <Section title={t("productsTitle")}>
                <ProductGrid products={products} locale={locale} />
              </Section>
            ) : null}

            {/* 6. Traditions — identity metadata, the least actionable item
                   on the page, so it reads last. */}
            {scopes.length > 0 ? (
              <Section title={t("traditionLabel")}>
                <ScopeCardGrid scopes={scopes} locale={locale} compact />
              </Section>
            ) : null}

            {!hasAnything ? (
              <EmptyState title={t("emptyTitle")} body={t("emptyBody")} as="h2" />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
