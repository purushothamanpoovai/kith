"use client";

import { Avatar } from "@/components/ui/avatar";
import { ContentCover } from "@/components/graphics/content-cover";
import { DecorativePattern } from "@/components/graphics/decorative-pattern";
import { resolveBackgroundPreset } from "@/domain/theme/backgrounds";

/**
 * A stand-in for the published article page, shown before the writer commits
 * to publishing.
 *
 * This is deliberately NOT the real `ArticleReader`: that component is an
 * async server component that reads translations and other server-only data,
 * so it cannot run from the live, unsaved state sitting in the composer.
 * Rather than add a whole draft-saving and re-fetching round trip just to
 * preview, this renders the same visual structure — title, byline, cover,
 * background, body — from client-safe pieces so the writer can see roughly
 * how the piece will look, updated instantly as they keep editing.
 *
 * "Roughly" is the honest word: reactions, comments and related reading
 * never appear here, because those only exist once the piece is a real saved
 * row with an id. The body HTML is NOT re-sanitised here the way the real
 * reader re-sanitises on render — `sanitize-html` is a server-oriented
 * package with no browser build, so pulling it into the client bundle just
 * for a self-preview isn't worth the weight. That's safe specifically
 * because this HTML never comes from the network or another user: it's the
 * live output of this same Lexical editor instance, which can only ever
 * construct the node types registered with it (see rich-text-editor.tsx),
 * and the server still re-sanitises unconditionally on save regardless of
 * what this preview shows.
 *
 * One deliberate difference from the real page: when there's no cover yet,
 * the published article falls back to generated placeholder art rather than
 * a blank rectangle, but that art would only be noise here — a still-drafting
 * piece has no cover because the writer hasn't gotten to it, not because the
 * slot is meant to stay empty, so this preview simply omits the cover block
 * instead of showing art that will vanish the moment a real one is added.
 */
export function ArticlePreview({
  title,
  summary,
  bodyHtml,
  coverImage,
  backgroundPreset,
  authorName,
  locale,
}: {
  title: string;
  summary: string;
  bodyHtml: string;
  coverImage: string | null;
  backgroundPreset: string;
  authorName: string;
  locale: string;
}) {
  const background = resolveBackgroundPreset(backgroundPreset);

  return (
    <article className="ds-article ds-article-preview">
      {background.pattern !== "none" ? (
        <DecorativePattern pattern={background.pattern} opacity={background.opacity} fade="block" />
      ) : null}

      <header className="ds-article__mast">
        <h1 className="ds-article__title" lang={locale} dir="auto">
          {title}
        </h1>

        {summary ? (
          <p className="ds-article__standfirst" lang={locale} dir="auto">
            {summary}
          </p>
        ) : null}

        <div className="ds-byline">
          <div className="ds-byline__who">
            <Avatar name={authorName || "?"} size="md" />
            <div className="ds-byline__names">
              <span className="ds-byline__name">{authorName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Unlike the published page, a missing cover shows nothing here rather
          than the generated placeholder art: the writer hasn't decided on a
          cover yet, and showing art that will vanish the moment they add a
          real one would read as a broken image rather than a deliberate
          absence. */}
      {coverImage ? (
        <ContentCover
          seed="preview"
          src={coverImage}
          className="ds-cover ds-article__cover"
          alt=""
          priority
          sizes="(max-width: 64rem) 100vw, 64rem"
        />
      ) : null}

      <div className="ds-article__body ds-prose" lang={locale} dir="auto">
        <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      </div>
    </article>
  );
}
