"use client";

import { useState, useTransition } from "react";
import { Bookmark, HandHeart, Heart, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconButton } from "@/components/ui/button";
import {
  bookmarkAction,
  reactAction,
  reactToScopeAction,
} from "@/app/actions/community-actions";

/**
 * The response row (§19).
 *
 * Deliberately not a Facebook reaction bar. Calm affordances with named,
 * localisable verbs — Appreciate, Reflect, Save, Share — presented as icon
 * buttons with visible labels on wider screens rather than a row of emoji.
 * There is no count race and no animation reward: the point is to acknowledge
 * something, not to farm engagement (§46).
 *
 * Attaches to either a piece of content (`contentId`) or a scope's own page
 * (`scopeId`) — a religion, tradition, topic, region or language can be
 * appreciated and discussed the same way an article can. Saving stays
 * content-only, since there's no bookmark concept for a scope; the affordance
 * is simply omitted rather than shown wired to nothing. Reflect scrolls to
 * the discussion instead of inventing a second store, and Share copies the
 * link.
 */
export function ReactionBar({
  contentId,
  scopeId,
  anchorId,
  reactionCount = 0,
  commentCount = 0,
  hasReacted = false,
  hasBookmarked = false,
  signedIn,
  shareUrl,
}: {
  /** Exactly one of `contentId`/`scopeId` is set — the other is what this
   *  bar is attached to when it isn't a piece of content. */
  contentId?: string;
  scopeId?: string;
  /** Element id of the discussion, for the Reflect affordance. */
  anchorId?: string;
  reactionCount?: number;
  commentCount?: number;
  hasReacted?: boolean;
  hasBookmarked?: boolean;
  signedIn: boolean;
  shareUrl?: string;
}) {
  const t = useTranslations("reactions");
  const tCommon = useTranslations("common");
  const [pending, startTransition] = useTransition();

  // These actions throw when the server refuses — an expired session, or a
  // permission revoked since the page was rendered. The rejection used to be
  // swallowed by `void`, leaving the reader looking at an unchanged button
  // with no explanation of why nothing happened (P5).
  const [notice, setNotice] = useState<string | null>(null);

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await action();
        setNotice(null);
      } catch {
        setNotice(tCommon("actionFailed"));
      }
    });
  }

  function react() {
    if (!signedIn) return;
    run(() => (scopeId ? reactToScopeAction(scopeId, "heart") : reactAction(contentId!, "heart")));
  }

  function bookmark() {
    if (!signedIn || !contentId) return;
    run(() => bookmarkAction(contentId));
  }

  async function share() {
    const url = shareUrl
      ? new URL(shareUrl, window.location.origin).toString()
      : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        // Copying is invisible otherwise — confirm that something happened.
        setNotice(t("shareCopied"));
      }
    } catch {
      // The reader dismissed the share sheet, or the clipboard was refused.
    }
  }

  return (
    <div className="ds-reactions" aria-busy={pending || undefined}>
      <button
        type="button"
        className="ds-reaction"
        data-active={hasReacted || undefined}
        aria-pressed={hasReacted}
        disabled={!signedIn || pending}
        onClick={react}
      >
        <Heart
          size={13}
          strokeWidth={1.75}
          aria-hidden
          className={hasReacted ? "ds-reaction__icon--filled" : undefined}
        />
        <span className="ds-reaction__label">
          {hasReacted ? t("appreciated") : t("appreciate")}
        </span>
        {reactionCount > 0 ? (
          <span className="ds-reaction__count">{reactionCount}</span>
        ) : null}
      </button>

      {anchorId ? (
        <a className="ds-reaction" href={`#${anchorId}`}>
          <HandHeart size={13} strokeWidth={1.75} aria-hidden />
          <span className="ds-reaction__label">{t("reflect")}</span>
          {commentCount > 0 ? (
            <span className="ds-reaction__count">{commentCount}</span>
          ) : null}
        </a>
      ) : null}

      {contentId ? (
        // Saving is content-specific — there's no bookmark model for a
        // scope's own page, so the affordance is simply absent there rather
        // than shown disabled or wired to nothing.
        <button
          type="button"
          className="ds-reaction"
          data-active={hasBookmarked || undefined}
          aria-pressed={hasBookmarked}
          disabled={!signedIn || pending}
          onClick={bookmark}
        >
          <Bookmark
            size={13}
            strokeWidth={1.75}
            aria-hidden
            className={hasBookmarked ? "ds-reaction__icon--filled" : undefined}
          />
          <span className="ds-reaction__label">
            {hasBookmarked ? t("saved") : t("save")}
          </span>
        </button>
      ) : null}

      <IconButton label={t("share")} size="sm" onClick={share}>
        <Share2 size={13} strokeWidth={1.75} />
      </IconButton>

      {notice ? (
        <span className="ds-reactions__hint" role="status">
          {notice}
        </span>
      ) : null}
    </div>
  );
}
