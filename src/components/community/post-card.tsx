import type { ContentRecord } from "@/domain/content/types";
import { Link } from "@/i18n/navigation";
import { ReportForm } from "@/components/moderation/report-form";
import { ReactionBar } from "@/components/community/reaction-bar";
import { PrivateNoteEditor } from "@/components/community/private-note-editor";
import { ContentAttribution } from "@/components/content/content-attribution";
import { Avatar } from "@/components/ui/avatar";
import { contentTitle } from "@/services/feed-service";
import { pickLocalized } from "@/lib/localized";
import { getCurrentUser } from "@/services/auth-service";
import { getPrivateNote } from "@/repositories/community-repository";

/**
 * A community post (§18).
 *
 * On the community page the private-notes editor is expanded inline, because
 * it is the reader's own space on this piece. In a mixed feed
 * (`collapsedComments`) it collapses away entirely — an eighteen-item river
 * of fully expanded editors was what made the home page unreadable, and
 * unlike the old public thread there's no count worth surfacing from a
 * collapsed card, since a private note has no audience but its author.
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
  const title = contentTitle(item, locale);
  const body = pickLocalized(item.body, locale);
  const user = signedIn && !collapsedComments ? await getCurrentUser() : null;
  const note = user && !collapsedComments ? await getPrivateNote(user.id, item.id) : null;
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
            hasReacted={hasReacted}
            hasBookmarked={hasBookmarked}
            signedIn={signedIn}
            shareUrl={`/${locale}/community#${item.slug}`}
          />
          {collapsedComments ? null : (
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
        <PrivateNoteEditor
          contentId={item.id}
          initialBody={note?.body ?? ""}
          signedIn={signedIn}
          anchorId={discussionId}
        />
      )}
    </article>
  );
}
