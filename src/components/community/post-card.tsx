import { getTranslations } from "next-intl/server";
import { MessageCircle } from "lucide-react";
import type { ContentRecord } from "@/domain/content/types";
import { Link } from "@/i18n/navigation";
import { ReportForm } from "@/components/moderation/report-form";
import { ReactionBar } from "@/components/community/reaction-bar";
import { CommentThread } from "@/components/community/comment-thread";
import { ContentAttribution } from "@/components/content/content-attribution";
import { Avatar } from "@/components/ui/avatar";
import { contentTitle } from "@/services/feed-service";
import { pickLocalized } from "@/lib/localized";
import { getCurrentUser } from "@/services/auth-service";
import { listComments } from "@/repositories/community-repository";

/**
 * A community post (§18).
 *
 * On the community page the discussion is expanded inline, because the thread
 * *is* the content. In a mixed feed (`collapsedComments`) it collapses to a
 * count with a link — an eighteen-item river of fully expanded threads was
 * what made the home page unreadable.
 */
export async function PostCard({
  item,
  locale,
  signedIn,
  hasReacted = false,
  hasBookmarked = false,
  collapsedComments = false,
}: {
  item: ContentRecord;
  locale: string;
  signedIn: boolean;
  hasReacted?: boolean;
  hasBookmarked?: boolean;
  collapsedComments?: boolean;
}) {
  const t = await getTranslations("community");
  const title = contentTitle(item, locale);
  const body = pickLocalized(item.body, locale);
  const comments = collapsedComments ? [] : await listComments(item.id);
  const commentCount = collapsedComments
    ? (item.commentCount ?? 0)
    : comments.length;
  const user = signedIn && !collapsedComments ? await getCurrentUser() : null;
  const discussionId = `discuss-${item.slug}`;

  return (
    <article className="ds-card ds-card--flush" id={item.slug}>
      <div className="ds-post-card">
        <header className="ds-post-card__head">
          <Avatar name={item.authorName ?? "?"} size="sm" />
          <div className="ds-post-card__who">
            <span className="ds-post-card__author">
              {item.authorSlug ? (
                <Link href={`/community#${item.slug}`}>{item.authorName}</Link>
              ) : (
                item.authorName
              )}
            </span>
            <time
              className="ds-post-card__when"
              dateTime={item.publishedAt.toISOString()}
            >
              {item.publishedAt.toLocaleDateString(locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>
          <ContentAttribution item={item} locale={locale} />
        </header>

        <h2 className="ds-post-card__title" lang={item.originalLanguage}>
          <Link href={`/community#${item.slug}`}>{title}</Link>
        </h2>
        {body ? (
          <p
            className={`ds-post-card__body${collapsedComments ? " ds-clamp-3" : ""}`}
            lang={item.originalLanguage}
          >
            {body}
          </p>
        ) : null}

        <footer className="ds-post-card__foot">
          <ReactionBar
            contentId={item.id}
            anchorId={collapsedComments ? undefined : discussionId}
            reactionCount={item.reactionCount}
            commentCount={commentCount}
            hasReacted={hasReacted}
            hasBookmarked={hasBookmarked}
            signedIn={signedIn}
            shareUrl={`/${locale}/community#${item.slug}`}
          />
          {collapsedComments ? (
            <Link className="ds-text-link" href={`/community#${item.slug}`}>
              <MessageCircle size={13} strokeWidth={1.75} aria-hidden />
              {t("commentsCount", { count: commentCount })}
            </Link>
          ) : (
            <ReportForm
              targetType="content"
              targetId={item.id}
              signedIn={signedIn}
              compact
            />
          )}
        </footer>
      </div>

      {collapsedComments ? null : (
        <CommentThread
          contentId={item.id}
          comments={comments}
          signedIn={signedIn}
          locale={locale}
          userName={user?.name}
          anchorId={discussionId}
        />
      )}
    </article>
  );
}
