"use client";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ContentCover } from "@/components/graphics/content-cover";
import { IconButton } from "@/components/ui/button";
import { formatTime, usePlayer } from "@/components/media/player-provider";

/**
 * "Continue listening" (§22, §28).
 *
 * Reads the paused track the player kept on this device. It renders nothing
 * when there is nothing to resume, so the band never appears as an empty
 * placeholder — and because the state is per-device rather than per-account,
 * it never reveals listening history to anyone else (§27).
 */
export function ContinueListening() {
  const t = useTranslations("player");
  const { track, position, playing, play, toggle } = usePlayer();

  if (!track) return null;

  return (
    <section className="ds-section" aria-labelledby="continue-listening">
      <header className="ds-section-head">
        <div className="ds-section-head__text">
          <h2 className="ds-section-head__title" id="continue-listening">
            {t("continueListening")}
          </h2>
        </div>
      </header>
      <div className="ds-card ds-card--pad ds-resume-card ds-resume-card--wide">
        <ContentCover
          seed={track.coverSeed}
          src={track.coverSrc}
          className="ds-cover ds-resume-card__cover"
          sizes="4rem"
        />
        <div className="ds-resume-card__body">
          <h3 className="ds-resume-card__title">
            <Link href={track.href} style={{ textDecoration: "none", color: "inherit" }}>
              {track.title}
            </Link>
          </h3>
          <p className="ds-metadata">
            {formatTime(position)}
            {track.durationSeconds
              ? ` / ${formatTime(track.durationSeconds)}`
              : ""}
          </p>
        </div>
        <IconButton
          label={playing ? t("pause") : t("play")}
          outlined
          round
          onClick={() => (playing ? toggle() : play(track))}
        >
          <Play size={15} strokeWidth={2} className="ds-flip-rtl" />
        </IconButton>
      </div>
    </section>
  );
}
