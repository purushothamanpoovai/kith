import { getTranslations } from "next-intl/server";
import { Bookmark, Heart, UserPlus, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import type { ContentType } from "@/generated/prisma/client";
import { contentHref } from "@/services/feed-service";
import { pickLocalized, type LocalizedString } from "@/lib/localized";
import {
  listBookmarks,
  listReactions,
} from "@/repositories/community-repository";
import {
  getAuthorFollowerCount,
  getAuthorFollowers,
  getFollowedAuthorIds,
  getUserSubscriptions,
} from "@/services/subscription-service";

type SavedItem = { id: string; slug: string; type: ContentType; title: LocalizedString };

/** A short list of saved/appreciated content, or an empty note. */
function ActivityList({ items, locale }: { items: SavedItem[]; locale: string }) {
  return (
    <ul className="ds-widget-list">
      {items.slice(0, 4).map((item) => (
        <li key={item.id} className="ds-widget-list__row">
          <Link href={contentHref(item.type, item.slug) as `/${string}`}>
            {pickLocalized(item.title, locale)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * The reader's own activity — what they've saved, appreciated, and who they
 * follow — in place of the editorial widgets that used to sit here (§18).
 * Those (Editor's Shelf, Traditions, Coming Up) now live on the editorial
 * dashboard: this rail is strictly about the signed-in reader's own
 * engagement with the community, not curated site content.
 */
export async function CommunitySidebar({
  locale,
  userId,
}: {
  locale: string;
  userId: string;
}) {
  const t = await getTranslations("community");

  const [bookmarks, reactions, subscriptions, followedAuthorIds, followerCount, followers] =
    await Promise.all([
      listBookmarks(userId),
      listReactions(userId),
      getUserSubscriptions(userId),
      getFollowedAuthorIds(userId),
      getAuthorFollowerCount(userId),
      getAuthorFollowers(userId, 5),
    ]);

  const following = [
    ...subscriptions
      .filter((s) => s.scopeSlug)
      .map((s) => ({
        key: `scope-${s.id}`,
        href: `/${s.scopeType}s/${s.scopeSlug}`,
        label: pickLocalized(s.scopeTitle as LocalizedString, locale),
      })),
    ...subscriptions
      .filter((s) => s.organizationSlug)
      .map((s) => ({
        key: `org-${s.id}`,
        href: `/org/${s.organizationSlug}`,
        label: pickLocalized(s.organizationName as LocalizedString, locale),
      })),
  ];

  return (
    <>
      <section className="ds-widget ds-widget--activity" aria-labelledby="rail-saved">
        <h2 className="ds-widget__title" id="rail-saved">
          <Bookmark size={13} strokeWidth={1.75} aria-hidden />
          {t("bookmarksTitle")}
        </h2>
        {bookmarks.length > 0 ? (
          <>
            <ActivityList items={bookmarks as SavedItem[]} locale={locale} />
            <Link className="ds-text-link" href="/my-space">
              {t("bookmarksTitle")}
            </Link>
          </>
        ) : (
          <p className="ds-widget__text">{t("emptyBookmarks")}</p>
        )}
      </section>

      <section className="ds-widget ds-widget--activity" aria-labelledby="rail-liked">
        <h2 className="ds-widget__title" id="rail-liked">
          <Heart size={13} strokeWidth={1.75} aria-hidden />
          {t("likesTitle")}
        </h2>
        {reactions.length > 0 ? (
          <ActivityList items={reactions as SavedItem[]} locale={locale} />
        ) : (
          <p className="ds-widget__text">{t("emptyLikes")}</p>
        )}
      </section>

      <section className="ds-widget ds-widget--activity" aria-labelledby="rail-following">
        <h2 className="ds-widget__title" id="rail-following">
          <UserPlus size={13} strokeWidth={1.75} aria-hidden />
          {t("followingTitle")}
        </h2>
        {following.length > 0 || followedAuthorIds.length > 0 ? (
          <ul className="ds-widget-list">
            {following.slice(0, 5).map((item) => (
              <li key={item.key} className="ds-widget-list__row">
                <Link href={item.href as `/${string}`}>{item.label}</Link>
              </li>
            ))}
            {followedAuthorIds.length > 0 ? (
              <li className="ds-widget-list__row">
                <span>{t("followingTitle")}</span>
                <span className="ds-widget-list__count">
                  {followedAuthorIds.length}
                </span>
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="ds-widget__text">{t("emptyFollowing")}</p>
        )}
      </section>

      <section className="ds-widget ds-widget--activity" aria-labelledby="rail-followers">
        <h2 className="ds-widget__title" id="rail-followers">
          <Users size={13} strokeWidth={1.75} aria-hidden />
          {t("followersTitle")}
          {followerCount > 0 ? (
            <span className="ds-widget-list__count">{followerCount}</span>
          ) : null}
        </h2>
        {followers.length > 0 ? (
          <ul className="ds-follower-row">
            {followers.map((follower) => (
              <li key={follower.slug}>
                <Avatar name={follower.name} size="sm" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="ds-widget__text">{t("emptyFollowers")}</p>
        )}
      </section>
    </>
  );
}

/** Shown instead of {@link CommunitySidebar} when no one is signed in. */
export async function CommunitySidebarSignedOut() {
  const t = await getTranslations("community");
  const tAuth = await getTranslations("auth");

  return (
    <section className="ds-widget" aria-labelledby="rail-signin">
      <h2 className="ds-widget__title" id="rail-signin">
        {t("yourSpace")}
      </h2>
      <p className="ds-widget__text">{t("signInForActivity")}</p>
      <ButtonLink href="/login" variant="primary" size="sm" block>
        {tAuth("signInTitle")}
      </ButtonLink>
    </section>
  );
}
