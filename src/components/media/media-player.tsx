"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { ContentCover } from "@/components/graphics/content-cover";
import { IconButton } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import {
  formatTime,
  usePlayer,
  type Track,
} from "@/components/media/player-provider";

/**
 * The full player (§20).
 *
 * Audio is driven by the shared element in PlayerProvider so it keeps playing
 * when the reader navigates away. Video plays in place — moving a <video>
 * between React trees restarts it — and pauses any audio first so two things
 * never sound at once.
 *
 * Every control is a real focusable element, seeking is a range input, and the
 * transcript is a disclosure rather than a wall of text.
 */

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

export function MediaPlayer({
  track,
  kind,
  queue = [],
  transcript,
  captionsSrc,
}: {
  track: Track;
  kind: "audio" | "video";
  queue?: Track[];
  transcript?: string | null;
  /** A WebVTT file, when the record has one. */
  captionsSrc?: string | null;
}) {
  const t = useTranslations("player");
  const player = usePlayer();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const isCurrent = player.track?.id === track.id;
  const playing = kind === "audio" ? isCurrent && player.playing : undefined;
  const position = isCurrent ? player.position : 0;
  const duration =
    (isCurrent ? player.duration : 0) || track.durationSeconds || 0;

  // Starting a video must silence the shared audio element.
  useEffect(() => {
    if (kind !== "video") return;
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => player.pause();
    video.addEventListener("play", onPlay);
    return () => video.removeEventListener("play", onPlay);
  }, [kind, player]);

  const progressPct = duration > 0 ? (position / duration) * 100 : 0;
  const index = queue.findIndex((item) => item.id === track.id);
  const hasNext = index >= 0 && index < queue.length - 1;

  return (
    <div className="ds-player">
      {kind === "video" ? (
        <div className="ds-player__stage ds-player__stage--video">
          <video ref={videoRef} controls preload="metadata" src={track.src}>
            {captionsSrc ? (
              <track
                kind="captions"
                src={captionsSrc}
                srcLang={track.subtitle ?? undefined}
                label={t("captions")}
                default
              />
            ) : null}
          </video>
        </div>
      ) : (
        <>
          <div className="ds-player__stage--audio">
            <ContentCover
              seed={track.coverSeed}
              src={track.coverSrc}
              className="ds-player__art"
              priority
            />
            <div className="ds-player__now">
              <h2 className="ds-player__title">{track.title}</h2>
              {track.subtitle ? (
                <p className="ds-metadata">{track.subtitle}</p>
              ) : null}
            </div>
          </div>

          <div className="ds-player__transport">
            <div className="ds-player__scrubber">
              <span className="ds-player__time">{formatTime(position)}</span>
              <input
                className="ds-range"
                type="range"
                min={0}
                max={Math.max(1, Math.floor(duration))}
                step={1}
                value={Math.floor(position)}
                onChange={(event) => {
                  if (!isCurrent) player.play(track, queue);
                  player.seek(Number(event.target.value));
                }}
                aria-label={t("seek")}
                aria-valuetext={`${formatTime(position)} / ${formatTime(duration)}`}
                style={{ ["--ds-range-progress" as string]: `${progressPct}%` }}
              />
              <span className="ds-player__time ds-player__time--end">
                {formatTime(duration)}
              </span>
            </div>

            <div className="ds-player__controls">
              <div className="ds-player__controls-main">
                <IconButton
                  label={t("back15")}
                  onClick={() => player.skip(-15)}
                  disabled={!isCurrent}
                >
                  <RotateCcw size={17} strokeWidth={1.75} />
                </IconButton>
                <IconButton
                  label={playing ? t("pause") : t("play")}
                  className="ds-player__play"
                  onClick={() =>
                    isCurrent ? player.toggle() : player.play(track, queue)
                  }
                >
                  {playing ? (
                    <Pause size={19} strokeWidth={2} />
                  ) : (
                    <Play size={19} strokeWidth={2} />
                  )}
                </IconButton>
                <IconButton
                  label={t("forward15")}
                  onClick={() => player.skip(15)}
                  disabled={!isCurrent}
                >
                  <RotateCw size={17} strokeWidth={1.75} />
                </IconButton>
                {hasNext ? (
                  <IconButton label={t("next")} onClick={player.next}>
                    <SkipForward
                      size={17}
                      strokeWidth={1.75}
                      className="ds-flip-rtl"
                    />
                  </IconButton>
                ) : null}
              </div>

              <div className="ds-player__controls-aux">
                <label className="ds-player__volume">
                  <IconButton
                    label={player.muted ? t("unmute") : t("mute")}
                    size="sm"
                    onClick={player.toggleMute}
                  >
                    {player.muted ? (
                      <VolumeX size={15} strokeWidth={1.75} />
                    ) : (
                      <Volume2 size={15} strokeWidth={1.75} />
                    )}
                  </IconButton>
                  <input
                    className="ds-range"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={player.muted ? 0 : player.volume}
                    onChange={(event) => player.setVolume(Number(event.target.value))}
                    aria-label={t("volume")}
                    style={{
                      ["--ds-range-progress" as string]: `${
                        (player.muted ? 0 : player.volume) * 100
                      }%`,
                    }}
                  />
                </label>

                <Select
                  className="ds-player__rate"
                  value={player.rate}
                  onChange={(event) => player.setRate(Number(event.target.value))}
                  aria-label={t("speed")}
                >
                  {RATES.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}×
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </>
      )}

      {transcript ? (
        <div className="ds-transcript">
          <button
            type="button"
            className="ds-transcript__toggle"
            aria-expanded={showTranscript}
            aria-controls="media-transcript"
            onClick={() => setShowTranscript((value) => !value)}
          >
            <span>{t("transcript")}</span>
            <ChevronDown
              size={16}
              strokeWidth={2}
              aria-hidden
              style={{
                transform: showTranscript ? "rotate(180deg)" : undefined,
                transition: "transform var(--ds-duration) var(--ds-ease)",
              }}
            />
          </button>
          {showTranscript ? (
            <div className="ds-transcript__body" id="media-transcript">
              {transcript}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
