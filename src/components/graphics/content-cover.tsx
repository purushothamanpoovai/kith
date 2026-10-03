"use client";

import { useState } from "react";
import { CoverArtSvg, coverArtStyle } from "@/components/graphics/cover-art-svg";

/**
 * The single cover surface for every card, hero and thumbnail (§30).
 *
 * Uses the record's real `coverImage` when there is one and it loads, and
 * falls back to generated art otherwise — a missing or broken file must never
 * leave a blank rectangle, which the audit found on the article page.
 *
 * The image is held at zero opacity until `load` fires. Without that, a 404
 * paints the browser's broken-image glyph and the alt text across the
 * artwork for the moment before `error` fires, which is visible on any slow
 * or missing asset. The caller sets the aspect ratio through `className`, so
 * the same component serves a 21:9 hero and a 1:1 thumbnail.
 */

type Props = {
  /** Stable id, so a record's generated art never changes between renders. */
  seed: string;
  src?: string | null;
  /** Describe the picture, or pass "" for art that carries no information. */
  alt?: string;
  className?: string;
  /** Above-the-fold covers should not be lazy. */
  priority?: boolean;
  sizes?: string;
};

export function ContentCover({
  seed,
  src,
  alt = "",
  className,
  priority = false,
  sizes = "(max-width: 48rem) 100vw, 50vw",
}: Props) {
  const [state, setState] = useState<"idle" | "loaded" | "failed">("idle");

  return (
    <div
      className={["ds-cover", className].filter(Boolean).join(" ")}
      style={coverArtStyle(seed)}
    >
      {/* Generated art always renders underneath, so a slow or failed image
          reveals ornament rather than an empty box. */}
      <CoverArtSvg seed={seed} className="ds-cover__art" />
      {src && state !== "failed" ? (
        /* eslint-disable-next-line @next/next/no-img-element -- served from
           the local /media mount, not through the image optimiser. */
        <img
          className="ds-cover__img"
          src={src}
          alt={alt}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          data-state={state}
          onLoad={() => setState("loaded")}
          onError={() => setState("failed")}
        />
      ) : null}
    </div>
  );
}
