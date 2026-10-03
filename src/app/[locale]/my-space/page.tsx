import { getTranslations, setRequestLocale } from "next-intl/server";
import { Bookmark, CalendarDays } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { ContentCard } from "@/components/content/content-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageFrame } from "@/components/layout/page-frame";
import { Section } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { MySpaceFollowingPanel } from "@/components/my-space/following-panel";
import { StudioTab } from "@/components/my-space/studio-tab";
import { BookmarkFolderPanel } from "@/components/my-space/bookmark-folder-panel";
import { EventCard } from "@/components/events/event-row";
import { canAccessSignedInArea } from "@/lib/permissions";
import { getCurrentUser } from "@/services/auth-service";
import { listUserBookmarksWithFolders } from "@/services/content-service";
import { listBookmarkFolders } from "@/repositories/community-repository";
import { getUserSubscriptions } from "@/services/subscription-service";
import { listFollowedEvents } from "@/services/event-service";

/**
 * My Space (§28, control panel).
 *
 * This page is deliberately NOT a second Home. Home already carries the
 * reader's personalised recommendation feed (`buildPersonalFeed`) — showing
 * that same river again here would be pure duplication and confuse two
 * pages into doing one job. My Space is the other half of the platform's
 * relationship with a signed-in reader: not "what should I read next" but
 * "what is mine" — what you've written, what you administer, who and what
 * you follow (with the controls to unfollow, right here), what you saved,
 * and what you RSVP'd to. Every section here is something the reader owns
 * or did, never something recommended to them.
 */
export default async function MySpacePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; status?: string; org?: string }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!canAccessSignedInArea(user)) {
    redirect({ href: "/login", locale });
  }

  const t = await getTranslations("mySpace");
  const tStates = await getTranslations("states");
  const tEvents = await getTranslations("events");

  const [subscriptions, bookmarks, bookmarkFolders, rsvpEvents] = await Promise.all([
    getUserSubscriptions(user!.id),
    listUserBookmarksWithFolders(user!.id),
    listBookmarkFolders(user!.id),
    listFollowedEvents(user!.id),
  ]);

  return (
    <PageFrame
      eyebrow={t("eyebrow")}
      title={t("title")}
      lede={t("body")}
      sidebar={
        <MySpaceFollowingPanel
          locale={locale}
          subscriptions={subscriptions}
          followingLabel={t("following")}
          emptyLabel={t("emptyFollowing")}
        />
      }
    >
      <StudioTab user={user!} locale={locale} filters={filters} />

      <Section title={t("saved")}>
        {bookmarks.length === 0 ? (
          <EmptyState
            title={tStates("emptySavedTitle")}
            body={tStates("emptySavedBody")}
            mark={<Bookmark size={26} strokeWidth={1.25} />}
            actions={
              <ButtonLink href="/explore" variant="secondary">
                {tStates("exploreAction")}
              </ButtonLink>
            }
            inline
          />
        ) : (
          <BookmarkFolderPanel
            folders={bookmarkFolders.map((f) => ({
              id: f.id,
              name: f.name,
              bookmarkCount: f._count.bookmarks,
            }))}
            bookmarks={bookmarks.map(({ content, folderId }) => ({
              contentId: content.id,
              folderId,
              card: <ContentCard key={content.id} item={content} locale={locale} />,
            }))}
          />
        )}
      </Section>

      <Section title={t("yourEvents")}>
        {rsvpEvents.length === 0 ? (
          <EmptyState
            title={tStates("emptyEventsTitle")}
            body={tStates("emptyEventsBody")}
            mark={<CalendarDays size={26} strokeWidth={1.25} />}
            actions={
              <ButtonLink href="/events" variant="secondary">
                {tEvents("allEvents")}
              </ButtonLink>
            }
            inline
          />
        ) : (
          <ul className="ds-list">
            {rsvpEvents.map((event) => (
              <li key={event.id}>
                <EventCard event={event} locale={locale} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PageFrame>
  );
}
