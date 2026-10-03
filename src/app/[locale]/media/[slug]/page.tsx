import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { MediaPlayer } from "@/components/media/media-player";
import type { Track } from "@/components/media/player-provider";
import { VerseReader } from "@/components/content/verse-reader";
import { MediaSignInLock } from "@/components/content/media-sign-in-lock";
import { ContentAttribution } from "@/components/content/content-attribution";
import { ContentCard } from "@/components/content/content-card";
import { ReactionBar } from "@/components/community/reaction-bar";
import { CommentThread } from "@/components/community/comment-thread";
import { ReportForm } from "@/components/moderation/report-form";
import { MagazineSidebar } from "@/components/layout/magazine-sidebar";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { getCurrentUser } from "@/services/auth-service";
import { getContentBySlug } from "@/services/content-service";
import { isPubliclyReadable } from "@/services/permission-service";
import {
  getUserBookmarkIds,
  getUserReactionIds,
  listComments,
} from "@/repositories/community-repository";
import { listContentByScopes } from "@/repositories/content-repository";
import { pickLocalized } from "@/lib/localized";
import { sanitizeRedirectTarget } from "@/lib/redirect-target";
import type { ContentRecord } from "@/domain/content/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = await getContentBySlug(slug);
  if (!item) return {};
  return {
    title: pickLocalized(item.title, locale),
    description: pickLocalized(item.summary, locale) || undefined,
  };
}

/** Shapes a content record into a playable track for the shared player. */
function toTrack(item: ContentRecord, locale: string): Track | null {
  if (!item.mediaUrl) return null;
  return {
    id: item.id,
    title: pickLocalized(item.title, locale),
    subtitle: item.authorName,
    src: item.mediaUrl,
    coverSeed: item.id,
    coverSrc: item.coverImage,
    href: `/media/${item.slug}`,
    durationSeconds: item.durationSeconds,
  };
}

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("content");
  const tReader = await getTranslations("reader");
  const tCommon = await getTranslations("common");

  const item = await getContentBySlug(slug);
  if (!item || !["audio", "video", "poem"].includes(item.type)) {
    notFound();
  }

  const user = await getCurrentUser();
  const [comments, reacted, bookmarked, related] = await Promise.all([
    listComments(item.id),
    user
      ? getUserReactionIds(user.id, [item.id]).then((set) => set.has(item.id))
      : Promise.resolve(false),
    user
      ? getUserBookmarkIds(user.id, [item.id]).then((set) => set.has(item.id))
      : Promise.resolve(false),
    item.scopeIds.length
      ? listContentByScopes(item.scopeIds, ["audio", "video", "poem"], 8)
      : Promise.resolve([]),
  ]);

  const track = toTrack(item, locale);
  // The queue is other playable pieces in the same scopes, so "next" leads
  // somewhere related rather than to an arbitrary record.
  const queue = [
    ...(track ? [track] : []),
    ...related
      .filter((row) => row.id !== item.id && row.mediaUrl && row.type !== "poem")
      .map((row) => toTrack(row, locale))
      .filter((row): row is Track => row !== null),
  ];

  const reactions = (
    <ReactionBar
      contentId={item.id}
      anchorId="discussion"
      reactionCount={item.reactionCount}
      commentCount={comments.length}
      hasReacted={reacted}
      hasBookmarked={bookmarked}
      signedIn={Boolean(user)}
      shareUrl={`/${locale}/media/${item.slug}`}
    />
  );

  const relatedItems = related.filter((row) => row.id !== item.id).slice(0, 4);

  const returnPath = sanitizeRedirectTarget(`/${locale}/media/${item.slug}`);
  const signInHref = `/login?redirect=${encodeURIComponent(returnPath)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(returnPath)}`;
  // Poems are read like an article — public ones open up for anonymous
  // visitors. Audio/video stay hard-locked to sign-in regardless of
  // visibility (§ media playback policy: no playback pre-account, decided
  // separately from the login-gated-reading rule).
  const readerSignedIn = Boolean(user) || isPubliclyReadable(item);

  return (
    <div className="ds-animate-in">
      <div className="ds-columns">
        <div className="ds-columns__main">
          {item.type === "poem" ? (
            <VerseReader
              item={item}
              locale={locale}
              actions={reactions}
              signedIn={readerSignedIn}
              signInHref={signInHref}
              registerHref={registerHref}
            />
          ) : (
            <article className="ds-article">
              <header className="ds-article__mast">
                <div className="ds-row ds-row--tight">
                  <span className="ds-kicker ds-caps" style={{ margin: 0 }}>
                    {t(`types.${item.type}` as "types.audio")}
                  </span>
                  <Badge tone="neutral">{item.originalLanguage.toUpperCase()}</Badge>
                </div>
                <h1 className="ds-article__title" lang={item.originalLanguage}>
                  {pickLocalized(item.title, locale)}
                </h1>
                {pickLocalized(item.summary, locale) ? (
                  <p className="ds-article__standfirst">
                    {pickLocalized(item.summary, locale)}
                  </p>
                ) : null}
                <div className="ds-byline">
                  <div className="ds-byline__who">
                    <ContentAttribution item={item} locale={locale} />
                    <div className="ds-byline__facts">
                      {item.durationSeconds ? (
                        <span>
                          {tCommon("minutes", {
                            count: Math.ceil(item.durationSeconds / 60),
                          })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="ds-byline__actions">{reactions}</div>
                </div>
              </header>

              {track ? (
                user ? (
                  <MediaPlayer
                    track={track}
                    kind={item.type === "video" ? "video" : "audio"}
                    queue={queue}
                    transcript={pickLocalized(item.transcript, locale) || null}
                  />
                ) : (
                  <MediaSignInLock signInHref={signInHref} registerHref={registerHref} />
                )
              ) : null}
            </article>
          )}

          <div className="ds-article__foot">
            {/* Discussion stays attached to the piece it is about, above the
                exit ramp into other media — and Report sits quietly at the
                end of its own row rather than floating alone on the page. */}
            <CommentThread
              contentId={item.id}
              comments={comments}
              signedIn={Boolean(user)}
              locale={locale}
              userName={user?.name}
              anchorId="discussion"
            />

            <div className="ds-article__actions ds-article__actions--end">
              <ReportForm
                targetType="content"
                targetId={item.id}
                signedIn={Boolean(user)}
                compact
              />
            </div>

            {relatedItems.length > 0 ? (
              <Section title={tReader("relatedTitle")}>
                <div className="ds-media-grid">
                  {relatedItems.map((row) => (
                    <ContentCard key={row.id} item={row} locale={locale} />
                  ))}
                </div>
              </Section>
            ) : null}
          </div>
        </div>

        {/* The main column already carries "Related reading" as a full media
            grid; repeating the same heading here with a second, differently
            sourced list read as two competing navigations for one job. */}
        <aside className="ds-columns__aside">
          <MagazineSidebar
            locale={locale}
            showReading={false}
            showEvents={false}
          />
        </aside>
      </div>
    </div>
  );
}
