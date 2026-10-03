"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Reading progress (§11).
 *
 * A 2px rule pinned to the bottom edge of the sticky masthead. Progress is
 * measured over the article element rather than the document, so a long
 * comment thread underneath does not make a finished article look half-read.
 *
 * Updates are driven by IntersectionObserver plus a passive scroll listener
 * batched into a single rAF, and the whole thing is skipped when the reader
 * prefers reduced motion.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const t = useTranslations("reader");
  const [percent, setPercent] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    function measure() {
      const rect = target!.getBoundingClientRect();
      const viewport = window.innerHeight;
      // How much of the article has scrolled past the top of the viewport,
      // normalised over the part of it that can actually leave the screen.
      const scrollable = Math.max(1, rect.height - viewport);
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
      setPercent(Math.round((scrolled / scrollable) * 100));
    }

    function onScroll() {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        measure();
      });
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [targetId]);

  return (
    <div
      className="ds-read-progress"
      role="progressbar"
      aria-label={t("progressLabel")}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="ds-read-progress__bar" style={{ width: `${percent}%` }} />
    </div>
  );
}
