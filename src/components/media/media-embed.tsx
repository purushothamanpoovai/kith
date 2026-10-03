import type { EmbedProvider } from "@/generated/prisma/client";

/**
 * All audio/video playback on Kith, full stop (§ low-liability curated
 * reader, Phase 5). There is no self-hosted player here and never will be —
 * Kith stores a validated link to a third-party provider's own embed page
 * (see src/lib/media/embed.ts) and renders nothing but that provider's own
 * `<iframe>`. Kith never touches, stores, or is responsible for the media
 * bytes themselves.
 *
 * This replaces the previous shared-`<audio>`-element player entirely: there
 * is no cross-page mini-bar, no scrubbing, no speed/volume control, no
 * "continue listening" resume, because none of those can be driven through
 * someone else's iframe. The provider's own chrome is the only transport.
 */
export function MediaEmbed({
  embedUrl,
  embedProvider,
  title,
}: {
  embedUrl: string;
  embedProvider: EmbedProvider;
  title: string;
}) {
  const aspect = embedProvider === "youtube" ? "16 / 9" : undefined;
  const height = embedProvider === "youtube" ? undefined : embedHeight(embedProvider);

  return (
    <div
      className="ds-media-embed"
      data-provider={embedProvider}
      style={aspect ? { aspectRatio: aspect } : { height }}
    >
      <iframe
        src={embedUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={embedProvider === "youtube"}
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
      />
    </div>
  );
}

function embedHeight(provider: EmbedProvider): string {
  switch (provider) {
    case "spotify":
      return "152px";
    case "soundcloud":
      return "166px";
    default:
      return "300px";
  }
}
