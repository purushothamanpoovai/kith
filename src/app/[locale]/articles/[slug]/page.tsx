import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { ArticleReader } from "@/components/content/article-reader";
import { QuietMoment } from "@/components/content/quiet-moment";
import { ContentCard, ContentRow } from "@/components/content/content-card";
import { ReactionBar } from "@/components/community/reaction-bar";
import { CommentThread } from "@/components/community/comment-thread";
import { ReportForm } from "@/components/moderation/report-form";
import { MagazineSidebar } from "@/components/layout/magazine-sidebar";
import { Section } from "@/components/ui/section";
import { SectionDivider } from "@/components/graphics/decorative-pattern";
import { listComments } from "@/repositories/community-repository";
import {
  getUserBookmarkIds,
  getUserReactionIds,
} from "@/repositories/community-repository";
import { listContentByScopes } from "@/repositories/content-repository";
import { getCurrentUser } from "@/services/auth-service";
import { canViewContent, isPubliclyReadable } from "@/services/permission-service";
import { getContentBySlug } from "@/services/content-service";
import { pickLocalized } from "@/lib/localized";
import { sanitizeRedirectTarget } from "@/lib/redirect-target";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = await getContentBySlug(slug);
  if (!item) return {};
  // A draft's title/summary must not leak into link previews or search
  // results before the piece is visible to the person requesting them.
  const user = await getCurrentUser();
  if (!(await canViewContent(user, item))) return {};
  return {
    title: pickLocalized(item.title, locale),
    description: pickLocalized(item.summary, locale) || undefined,
  };
}

/**
 * An article (§10, §11).
 *
 * Content leads, then everything the directive lists as belonging after it:
 * related reading, more from the same author, the discussion, and — for a
 * piece long enough to warrant it — the optional Quiet Moment.
 */
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("reader");

  const item = await getContentBySlug(slug);
  if (item?.type === "oral_history") {
    redirect(`/${locale}/heritage/${slug}`);
  }
  if (!item || item.type !== "article") {
    notFound();
  }

  const user = await getCurrentUser();
  // A draft (or anything else not yet published) is only visible to its
  // author or a member of the organization it will publish under — everyone
  // else gets the same not-found a mistyped slug would give, so a draft's
  // existence isn't revealed by a different response.
  if (!(await canViewContent(user, item))) {
    notFound();
  }

  const [comments, reacted, bookmarked, related] = await Promise.all([
    listComments(item.id),
    user
      ? getUserReactionIds(user.id, [item.id]).then((set) => set.has(item.id))
      : Promise.resolve(false),
    user
      ? getUserBookmarkIds(user.id, [item.id]).then((set) => set.has(item.id))
      : Promise.resolve(false),
    // Related reading comes from the scopes this article already belongs to,
    // so nothing is invented to fill the rail (§45).
    item.scopeIds.length
      ? listContentByScopes(item.scopeIds, ["article", "poem", "audio"], 7)
      : Promise.resolve([]),
  ]);

  const returnPath = sanitizeRedirectTarget(`/${locale}/articles/${item.slug}`);
  const signInHref = `/login?redirect=${encodeURIComponent(returnPath)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(returnPath)}`;

  const relatedItems = related.filter((row) => row.id !== item.id).slice(0, 4);
  const fromAuthor = related
    .filter((row) => row.id !== item.id && row.authorId === item.authorId)
    .slice(0, 3);

  // Reacting/commenting always requires a real account — reading, though,
  // opens up for anonymous visitors when the author marked this piece
  // `visibility: "public"` (§ login-gated reading). Everything else needs a
  // signed-in reader, even once `canViewContent` above has already confirmed
  // it isn't a private draft.
  const canReadWithoutAccount = isPubliclyReadable(item);
  const readerSignedIn = Boolean(user) || canReadWithoutAccount;

  const reactions = (
    <ReactionBar
      contentId={item.id}
      anchorId="discussion"
      reactionCount={item.reactionCount}
      commentCount={comments.length}
      hasReacted={reacted}
      hasBookmarked={bookmarked}
      signedIn={Boolean(user)}
      shareUrl={`/${locale}/articles/${item.slug}`}
    />
  );

  return (
    <div className="ds-animate-in">
      <div className="ds-columns">
        <div className="ds-columns__main">
          <ArticleReader
            item={item}
            locale={locale}
            signedIn={readerSignedIn}
            signInHref={signInHref}
            registerHref={registerHref}
          />

          <div className="ds-article__foot">
            {/* 1. Actions on this article — reacting, saving, sharing and
                   reporting are all "things you can do to this piece", so
                   they sit together in one row rather than scattering the
                   rarest of them to the bottom of the page as a lone,
                   unexplained icon. */}
            <div className="ds-article__actions">
              {reactions}
              <ReportForm
                targetType="content"
                targetId={item.id}
                signedIn={Boolean(user)}
                compact
              />
            </div>

            {/* 2. Quiet Moment — a soft, optional pause offered right after
                   finishing, before either the discussion or the exit-ramp
                   into other content. */}
            <QuietMoment
              readingMinutes={item.readingMinutes}
              continueHref="/explore"
              saveHref={user ? "/my-space" : "/login"}
            />

            {/* 3. Discussion — stays attached to the piece it's about,
                   directly under the reading/reacting flow, never after a
                   card grid of OTHER articles where it would read as
                   ambiguously attached to those instead. */}
            <CommentThread
              contentId={item.id}
              comments={comments}
              signedIn={Boolean(user)}
              locale={locale}
              userName={user?.name}
              anchorId="discussion"
            />

            <SectionDivider />

            {/* 4. Keep reading — explicitly an exit ramp off this page, so it
                   comes after everything that is still about THIS article. */}
            {relatedItems.length > 0 ? (
              <Section title={t("relatedTitle")}>
                <div className="ds-grid">
                  {relatedItems.map((row) => (
                    <ContentCard key={row.id} item={row} locale={locale} />
                  ))}
                </div>
              </Section>
            ) : null}

            {fromAuthor.length > 0 && item.authorName ? (
              <Section title={t("moreFromAuthor", { name: item.authorName })}>
                <div className="ds-list">
                  {fromAuthor.map((row) => (
                    <ContentRow key={row.id} item={row} locale={locale} />
                  ))}
                </div>
              </Section>
            ) : null}

          </div>
        </div>

        {/* The main column already has its own "More from this author" and
            "Related reading" sections, so the sidebar's generic reading list
            would only repeat them; an events CTA has no place next to an
            article either. */}
        <aside className="ds-columns__aside">
          <MagazineSidebar locale={locale} showReading={false} showInvite={false} />
        </aside>
      </div>
    </div>
  );
}
