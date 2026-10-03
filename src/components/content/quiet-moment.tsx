"use client";

import { useState } from "react";
import { useClientValue, readStorage, writeStorage } from "@/lib/hooks/use-client-value";
import { useTranslations } from "next-intl";
import { DecorativePattern } from "@/components/graphics/decorative-pattern";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * The Quiet Moment (§21).
 *
 * An *optional* pause offered after a long read. The rules the directive sets
 * are load-bearing, so they are enforced here rather than left to a caller:
 *
 *  - Never forced. It is only offered after a piece long enough to have taken
 *    real attention, it is not modal, and it never blocks anything.
 *  - No assumption about belief. The copy says only "take a moment before
 *    continuing" — it does not name a practice, a deity or a feeling.
 *  - No psychological pressure. There is no countdown, no streak, no reward,
 *    and no dark pattern in the dismissal: "Don't show this again" is a plain,
 *    permanent opt-out stored on the reader's own device.
 */

const DISMISS_KEY = "kith-quiet-dismissed";

/** Shorter pieces don't warrant an interruption, however gentle. */
const MIN_READING_MINUTES = 3;

export function QuietMoment({
  readingMinutes,
  saveHref,
  continueHref,
}: {
  readingMinutes?: number | null;
  /** Where "save for later" goes — the reader's own library. */
  saveHref: string;
  continueHref: string;
}) {
  const t = useTranslations("quiet");
  // The opt-out lives in the reader's browser, so the server cannot know it.
  // Rendering hidden and revealing after hydration keeps a reader who already
  // opted out from seeing the panel flash on every article.
  const dismissed = useClientValue(
    () => readStorage(DISMISS_KEY) === "true",
    true,
  );
  const [dismissedNow, setDismissedNow] = useState(false);

  const longEnough = (readingMinutes ?? 0) >= MIN_READING_MINUTES;
  if (!longEnough || dismissed || dismissedNow) return null;

  function dismissForever() {
    writeStorage(DISMISS_KEY, "true");
    setDismissedNow(true);
  }

  return (
    <aside className="ds-quiet" aria-label={t("title")}>
      <DecorativePattern pattern="radiance" opacity={0.06} fade="none" />
      <svg
        className="ds-quiet__mark"
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        aria-hidden
      >
        <circle cx="20" cy="20" r="18" />
        <circle cx="20" cy="20" r="11" />
        <circle cx="20" cy="20" r="4" />
      </svg>
      <p className="ds-quiet__text">{t("title")}</p>
      <div className="ds-quiet__actions">
        <ButtonLink href={continueHref} variant="primary">
          {t("continueLabel")}
        </ButtonLink>
        <ButtonLink href={saveHref} variant="secondary">
          {t("saveLabel")}
        </ButtonLink>
      </div>
      <Button variant="ghost" className="ds-quiet__dismiss" onClick={dismissForever}>
        {t("dismiss")}
      </Button>
    </aside>
  );
}
