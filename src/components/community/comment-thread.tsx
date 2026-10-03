"use client";

import { CornerDownRight, X } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { commentAction, commentOnScopeAction } from "@/app/actions/community-actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/field";

/**
 * The discussion thread (§18).
 *
 * Redesigned away from nested white boxes with growing indentation, which is
 * the generic chat-app look the directive rules out. A comment is now avatar +
 * name + role + timestamp above plain prose, with a single hairline tracing
 * the reply thread. Nesting is capped so a deep exchange stays readable on a
 * 360px screen — replies past the cap stay in the deepest visible group and
 * name who they answer.
 *
 * Attaches to either a piece of content (`contentId`) or a scope's own page
 * (`scopeId`) — the caller passes whichever it has, already fetched (this
 * component does no data fetching of its own either way).
 */

type Comment = {
  id: string;
  body: string;
  parentId?: string | null;
  user: { name: string; slug: string };
  createdAt: Date;
};

type CommentNode = Comment & { children: CommentNode[] };

/** Beyond this, further replies stop indenting (§14, mobile readability). */
const MAX_DEPTH = 3;

function formatRelativeTime(date: Date, locale: string): string {
  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return rtf.format(days, "day");
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildCommentTree(comments: Comment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  for (const comment of comments) {
    nodes.set(comment.id, { ...comment, children: [] });
  }
  const roots: CommentNode[] = [];
  for (const comment of comments) {
    const node = nodes.get(comment.id);
    if (!node) continue;
    const parent = comment.parentId ? nodes.get(comment.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

function CommentItem({
  comment,
  locale,
  signedIn,
  depth,
  onReply,
  replyLabel,
  repliesLabel,
  authorId,
}: {
  comment: CommentNode;
  locale: string;
  signedIn: boolean;
  depth: number;
  onReply: (comment: Comment) => void;
  replyLabel: string;
  repliesLabel: string;
  /** The post's author, so their own replies can be marked. */
  authorId?: string;
}) {
  const isAuthor = authorId !== undefined && comment.user.slug === authorId;

  return (
    <li>
      <article className="ds-comment">
        <Avatar name={comment.user.name} size="xs" />
        <div className="ds-comment__body">
          <header className="ds-comment__head">
            <span className="ds-comment__author">{comment.user.name}</span>
            {isAuthor ? <Badge tone="neutral">{repliesLabel}</Badge> : null}
            <time className="ds-metadata" dateTime={comment.createdAt.toISOString()}>
              {formatRelativeTime(comment.createdAt, locale)}
            </time>
            {signedIn ? (
              <IconButton
                label={replyLabel}
                size="sm"
                className="ds-comment__reply"
                onClick={() => onReply(comment)}
              >
                <CornerDownRight size={13} strokeWidth={2} aria-hidden />
              </IconButton>
            ) : null}
          </header>
          <p className="ds-comment__text">{comment.body}</p>
        </div>
      </article>

      {comment.children.length > 0 ? (
        <ul
          className="ds-comments__branch"
          // Past the cap the group stops nesting further, so indentation
          // cannot walk the text off the side of a phone.
          style={
            depth >= MAX_DEPTH
              ? ({ ["--thread-indent" as string]: "0rem" } as React.CSSProperties)
              : undefined
          }
        >
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              locale={locale}
              signedIn={signedIn}
              depth={depth + 1}
              onReply={onReply}
              replyLabel={replyLabel}
              repliesLabel={repliesLabel}
              authorId={authorId}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function CommentThread({
  contentId,
  scopeId,
  comments,
  signedIn,
  locale = "en",
  userName,
  anchorId,
}: {
  /** Exactly one of `contentId`/`scopeId` is set. */
  contentId?: string;
  scopeId?: string;
  comments: Comment[];
  signedIn: boolean;
  locale?: string;
  userName?: string | null;
  /** Target for the Reflect affordance in ReactionBar. */
  anchorId?: string;
}) {
  const t = useTranslations("community");
  const tStates = useTranslations("states");
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  const tree = useMemo(() => buildCommentTree(comments), [comments]);

  // Phase 1 of the low-liability transition: public commenting is frozen at
  // the permission layer (`commentAction`/`commentOnScopeAction` now always
  // return `ok: false`), so the compose box is hidden here too rather than
  // left showing a form that silently fails on submit. Existing comments
  // stay visible as a read-only historical record pending Phase 3, where
  // this slot is replaced by the private-notes editor.
  const commentingFrozen = true;

  function startReply(comment: Comment) {
    setReplyTo({ id: comment.id, name: comment.user.name });
    fieldRef.current?.focus();
  }

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const body = String(formData.get("body") ?? "");
      const parentId = replyTo?.id ?? null;
      if (scopeId) {
        await commentOnScopeAction(scopeId, body, parentId);
      } else {
        await commentAction(contentId!, body, parentId);
      }
      formRef.current?.reset();
      setDraft("");
      setReplyTo(null);
    });
  }

  const placeholder = replyTo
    ? t("writeReply", { name: replyTo.name })
    : t("writeComment");
  const fieldId = `comment-${contentId ?? scopeId}`;

  return (
    <section className="ds-discussion" aria-label={t("comments")} id={anchorId}>
      <header className="ds-discussion__head">
        <h3 className="ds-kicker ds-caps ds-discussion__title">
          {t("commentsCount", { count: comments.length })}
        </h3>
      </header>

      {tree.length > 0 ? (
        <ul className="ds-comments">
          {tree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              locale={locale}
              signedIn={!commentingFrozen && signedIn}
              depth={0}
              onReply={startReply}
              replyLabel={t("reply")}
              repliesLabel={t("reply")}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          title={tStates("emptyCommentsTitle")}
          body={signedIn ? tStates("emptyCommentsBody") : undefined}
          inline
          as="p"
        />
      )}

      {!commentingFrozen && signedIn ? (
        <div className="ds-compose">
          <Avatar name={userName ?? "?"} size="xs" />
          <form ref={formRef} className="ds-compose__box" action={onSubmit}>
            {replyTo ? (
              <div className="ds-compose__replying">
                <span>{t("replyingTo", { name: replyTo.name })}</span>
                <IconButton
                  label={t("cancelReply")}
                  size="sm"
                  onClick={() => {
                    setReplyTo(null);
                    fieldRef.current?.focus();
                  }}
                >
                  <X size={13} strokeWidth={2} />
                </IconButton>
              </div>
            ) : null}
            <label htmlFor={fieldId} className="ds-sr-only">
              {placeholder}
            </label>
            <Textarea
              ref={fieldRef}
              id={fieldId}
              name="body"
              className="ds-compose__field"
              placeholder={placeholder}
              rows={2}
              required
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="ds-compose__actions">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={pending}
                disabled={!draft.trim()}
              >
                {t("sendComment")}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <p className="ds-discussion__signin">
          {commentingFrozen ? t("commentingClosed") : t("signInToComment")}
        </p>
      )}
    </section>
  );
}
