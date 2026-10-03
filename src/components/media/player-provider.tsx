"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Playback state for the whole application (§20).
 *
 * One <audio> element lives here, above the router outlet, so listening
 * survives navigation — that is what makes "continue listening" and a
 * persistent mini bar possible. Video is not hoisted: a <video> element
 * cannot be moved between trees without restarting, so video plays in place
 * and simply pauses the audio track.
 */

export type Track = {
  id: string;
  title: string;
  subtitle?: string;
  src: string;
  /** Stable seed for generated cover art. */
  coverSeed: string;
  coverSrc?: string | null;
  /** Where the mini bar links back to. */
  href: string;
  durationSeconds?: number | null;
};

type PlayerState = {
  track: Track | null;
  queue: Track[];
  playing: boolean;
  /** Seconds. */
  position: number;
  duration: number;
  rate: number;
  volume: number;
  muted: boolean;
};

type PlayerApi = PlayerState & {
  /** Starts a track, optionally with the rest of a list as the queue. */
  play: (track: Track, queue?: Track[]) => void;
  toggle: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  skip: (seconds: number) => void;
  next: () => void;
  previous: () => void;
  setRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  /** Dismisses the mini bar and stops playback. */
  close: () => void;
};

const PlayerContext = createContext<PlayerApi | null>(null);

const RESUME_KEY = "kith-listening";

type Resume = { track: Track; position: number };

function readResume(): Resume | null {
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    return raw ? (JSON.parse(raw) as Resume) : null;
  } catch {
    return null;
  }
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // The paused track is restored in the state initialiser rather than in an
  // effect. Doing it in an effect meant the mini bar mounted empty and then
  // re-rendered with the track a frame later, which showed as a flicker at
  // the bottom of every page load.
  //
  // `readResume` returns null on the server, so the server and the first
  // client render agree; the bar simply appears once hydration has the value.
  const [state, setState] = useState<PlayerState>(() => {
    const resume = readResume();
    const track = resume?.track?.src ? resume.track : null;
    return {
      track,
      queue: [],
      // Never resume playing on its own — the reader has to ask for sound.
      playing: false,
      position: track ? (resume?.position ?? 0) : 0,
      duration: 0,
      rate: 1,
      volume: 1,
      muted: false,
    };
  });

  const persist = useCallback((track: Track | null, position: number) => {
    try {
      if (!track) localStorage.removeItem(RESUME_KEY);
      else localStorage.setItem(RESUME_KEY, JSON.stringify({ track, position }));
    } catch {
      // Blocked storage: playback still works, it just won't resume later.
    }
  }, []);

  const play = useCallback((track: Track, queue: Track[] = []) => {
    setState((prev) => ({
      ...prev,
      track,
      queue: queue.length ? queue : prev.queue,
      position: prev.track?.id === track.id ? prev.position : 0,
      playing: true,
    }));
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, playing: false }));
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => (prev.track ? { ...prev, playing: !prev.playing } : prev));
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = seconds;
    setState((prev) => ({ ...prev, position: seconds }));
  }, []);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(
      0,
      Math.min(audio.duration || Infinity, audio.currentTime + seconds),
    );
  }, []);

  const step = useCallback((delta: number) => {
    setState((prev) => {
      if (!prev.track || prev.queue.length === 0) return prev;
      const index = prev.queue.findIndex((item) => item.id === prev.track?.id);
      const nextIndex = index + delta;
      const next = prev.queue[nextIndex];
      if (!next) return prev;
      return { ...prev, track: next, position: 0, playing: true };
    });
  }, []);

  const next = useCallback(() => step(1), [step]);
  const previous = useCallback(() => step(-1), [step]);

  const setRate = useCallback((rate: number) => {
    setState((prev) => ({ ...prev, rate }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState((prev) => ({ ...prev, volume, muted: volume === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    setState((prev) => ({ ...prev, muted: !prev.muted }));
  }, []);

  const close = useCallback(() => {
    persist(null, 0);
    setState((prev) => ({ ...prev, track: null, playing: false, position: 0 }));
  }, [persist]);

  // Push declarative state onto the element.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.track) return;
    if (audio.src !== state.track.src && !audio.src.endsWith(state.track.src)) {
      audio.src = state.track.src;
      audio.currentTime = state.position;
    }
    audio.playbackRate = state.rate;
    audio.volume = state.volume;
    audio.muted = state.muted;
    if (state.playing && audio.paused) {
      // Autoplay can be refused; reflect that rather than lying to the reader.
      void audio.play().catch(() => setState((prev) => ({ ...prev, playing: false })));
    }
    if (!state.playing && !audio.paused) audio.pause();
  }, [state.track, state.playing, state.rate, state.volume, state.muted, state.position]);

  // Keep the mini bar's height out of the way of fixed page furniture.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--ds-player-inset",
      state.track ? "var(--ds-mini-player-height)" : "0px",
    );
  }, [state.track]);

  const api = useMemo<PlayerApi>(
    () => ({
      ...state,
      play,
      toggle,
      pause,
      seek,
      skip,
      next,
      previous,
      setRate,
      setVolume,
      toggleMute,
      close,
    }),
    [
      state,
      play,
      toggle,
      pause,
      seek,
      skip,
      next,
      previous,
      setRate,
      setVolume,
      toggleMute,
      close,
    ],
  );

  return (
    <PlayerContext.Provider value={api}>
      {children}
      {/* Not user-visible: the transport lives in MiniPlayer and MediaPlayer,
          both of which drive this element through the context. */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setState((prev) => ({ ...prev, position: audio.currentTime }));
        }}
        onLoadedMetadata={(event) =>
          setState((prev) => ({ ...prev, duration: event.currentTarget.duration || 0 }))
        }
        onPlay={() => setState((prev) => ({ ...prev, playing: true }))}
        onPause={(event) => {
          setState((prev) => {
            persist(prev.track, event.currentTarget.currentTime);
            return { ...prev, playing: false };
          });
        }}
        onEnded={() => next()}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerApi {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

/** mm:ss, or h:mm:ss past an hour. Used by both player surfaces. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
