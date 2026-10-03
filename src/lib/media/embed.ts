import type { EmbedProvider } from "@/generated/prisma/client";

/**
 * The single place a writer-supplied URL is turned into something Kith will
 * ever store or render (§ low-liability curated reader, Phase 5).
 *
 * Kith never accepts, stores, or serves a self-hosted media file — no audio
 * or video upload path exists anywhere in the app. All audio/video playback
 * is a validated `<iframe>` pointed at a provider's own canonical embed URL,
 * so Kith is never the one hosting the bytes or responsible for their
 * content. A raw URL is only ever accepted here, matched against a closed
 * allowlist of hosts, and rewritten into that provider's own embed form —
 * the original, arbitrary URL is never passed through to the page.
 */

const YOUTUBE_HOSTS = new Set(["www.youtube.com", "youtube.com", "youtu.be", "m.youtube.com"]);
const SPOTIFY_HOSTS = new Set(["open.spotify.com"]);
const SOUNDCLOUD_HOSTS = new Set(["soundcloud.com", "www.soundcloud.com"]);

export type ParsedEmbed = { provider: EmbedProvider; embedUrl: string };

function parseYouTube(url: URL): ParsedEmbed | null {
  let videoId: string | null = null;
  if (url.hostname === "youtu.be") {
    videoId = url.pathname.slice(1).split("/")[0] || null;
  } else if (url.pathname === "/watch") {
    videoId = url.searchParams.get("v");
  } else if (url.pathname.startsWith("/embed/")) {
    videoId = url.pathname.slice("/embed/".length).split("/")[0] || null;
  } else if (url.pathname.startsWith("/shorts/")) {
    videoId = url.pathname.slice("/shorts/".length).split("/")[0] || null;
  }
  if (!videoId || !/^[\w-]{6,20}$/.test(videoId)) return null;
  return {
    provider: "youtube",
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  };
}

function parseSpotify(url: URL): ParsedEmbed | null {
  // /track/<id>, /episode/<id>, /album/<id>, /playlist/<id>
  const match = url.pathname.match(/^\/(track|episode|album|playlist)\/([A-Za-z0-9]+)/);
  if (!match) return null;
  const [, kind, id] = match;
  return {
    provider: "spotify",
    embedUrl: `https://open.spotify.com/embed/${kind}/${id}`,
  };
}

function parseSoundCloud(url: URL): ParsedEmbed | null {
  // SoundCloud's embed endpoint wraps the ORIGINAL track url via its own
  // oEmbed-style player endpoint; the canonical form is a /player page that
  // takes the track url as a query param.
  const trackPath = url.pathname.replace(/\/+$/, "");
  if (!trackPath || trackPath === "/") return null;
  const canonical = `https://soundcloud.com${trackPath}`;
  return {
    provider: "soundcloud",
    embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(canonical)}&auto_play=false`,
  };
}

/**
 * Validates a writer-supplied URL against the closed provider allowlist and
 * resolves it to that provider's own embeddable form. Returns `null` for
 * anything else — an unrecognized host, a malformed URL, or a recognized
 * host whose path doesn't look like a real track/video/episode reference.
 * Never falls back to passing the raw URL through.
 */
export function parseEmbedUrl(raw: string): ParsedEmbed | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  if (YOUTUBE_HOSTS.has(url.hostname)) return parseYouTube(url);
  if (SPOTIFY_HOSTS.has(url.hostname)) return parseSpotify(url);
  if (SOUNDCLOUD_HOSTS.has(url.hostname)) return parseSoundCloud(url);
  return null;
}
