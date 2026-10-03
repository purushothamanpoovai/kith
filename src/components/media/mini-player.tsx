"use client";

import { Pause, Play, SkipForward, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ContentCover } from "@/components/graphics/content-cover";
import { IconButton } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { formatTime, usePlayer } from "@/components/media/player-provider";

/**
 * The persistent playback bar (§20).
 *
 * One control row tall, sits above the mobile navigation rather than over it,
 * and is dismissible — so it never becomes the dominant element on screen.
 */
export function MiniPlayer() {
  const t = useTranslations("player");
  const { track, playing, position, duration, toggle, next, close, queue } =
    usePlayer();

  if (!track) return null;

  const total = duration || track.durationSeconds || 0;
  const progress = total > 0 ? Math.min(100, (position / total) * 100) : 0;
  const hasNext =
    queue.length > 1 && queue.findIndex((item) => item.id === track.id) < queue.length - 1;

  return (
    <div className="ds-mini-player" role="region" aria-label={t("nowPlaying")}>
      <div
        className="ds-mini-player__progress"
        role="progressbar"
        aria-label={t("progress")}
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${formatTime(position)} / ${formatTime(total)}`}
      >
        <div
          className="ds-mini-player__progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
      <Container>
        <div className="ds-mini-player__row">
          <ContentCover
            seed={track.coverSeed}
            src={track.coverSrc}
            className="ds-mini-player__art"
          />
          <div className="ds-mini-player__text">
            <Link href={track.href} className="ds-mini-player__title">
              {track.title}
            </Link>
            <span className="ds-mini-player__sub">
              {[track.subtitle, formatTime(position)].filter(Boolean).join(" · ")}
            </span>
          </div>
          <div className="ds-mini-player__actions">
            <IconButton
              label={playing ? t("pause") : t("play")}
              onClick={toggle}
              round
              outlined
            >
              {playing ? (
                <Pause size={15} strokeWidth={2} />
              ) : (
                <Play size={15} strokeWidth={2} />
              )}
            </IconButton>
            {hasNext ? (
              <IconButton label={t("next")} size="sm" onClick={next}>
                <SkipForward size={15} strokeWidth={1.75} className="ds-flip-rtl" />
              </IconButton>
            ) : null}
            <IconButton label={t("close")} size="sm" onClick={close}>
              <X size={15} strokeWidth={1.75} />
            </IconButton>
          </div>
        </div>
      </Container>
    </div>
  );
}
