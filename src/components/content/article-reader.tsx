import { getTranslations } from "next-intl/server";
import type { ContentBlock, ContentRecord } from "@/domain/content/types";
import { ContentCover } from "@/components/graphics/content-cover";
import { ContentAttribution } from "@/components/content/content-attribution";
import { ReadingProgress } from "@/components/content/reading-progress";
import { SignInWall } from "@/components/content/sign-in-wall";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { pickLocalized } from "@/lib/localized";
import { sanitizeArticleHtml, truncateArticleHtml } from "@/lib/sanitize-html";

/** How much of the body an anonymous visitor sees before the sign-in wall. */
const TEASER_BLOCK_COUNT = 3;

/**
 * The article reader (§10, §11).
 *
 * Order follows the directive's content hierarchy: title, byline with
 * publisher and language, cover, then the body — nothing decorative comes
 * before the words. Two defects from the audit are fixed here specifically:
 *
 *  - The cover was rendered as `coverImage ? <div aria-hidden/> : null`, an
 *    empty 360px box that never showed the image. It now renders the real
 *    picture with generated art behind it as a fallback (§30).
 *  - The body was set in the Cormorant *display* face at 17px. Long-form now
 *    uses the reading face and reading measure from typography.css (§12).
 *
 * Blocks are given visual rhythm rather than each being a white card: quotes
 * become pull quotes, images become figures that may break the measure.
 */

const ARTICLE_ID = "article-body";

/** Detects a rich-text body, as opposed to the plain prose seeded content uses. */
function looksLikeHtml(value: string): boolean {
  return /<\/?(?:p|h2|h3|h4|ul|ol|li|blockquote|strong|em|a|img|figure|br|span)\b/i.test(
    value,
  );
}

/**
 * Renders an article body.
 *
 * Rich-text bodies are stored as HTML, so they are re-sanitised HERE, at the
 * moment of rendering, even though the write path already sanitised them.
 * That redundancy is the point: it means a row that reached the database by
 * some other route — an older import, a direct SQL edit, a future action that
 * forgets — still cannot run script in a reader's browser. Sanitising is
 * idempotent, so the second pass costs nothing on well-formed content.
 *
 * Plain-text bodies keep the old behaviour and stay JSX-escaped, never
 * touching innerHTML at all.
 */
function ArticleBody({ html, truncate }: { html: string; truncate?: boolean }) {
  if (!looksLikeHtml(html)) {
    return <p>{truncate ? html.split(/\n{2,}/).slice(0, TEASER_BLOCK_COUNT).join("\n\n") : html}</p>;
  }
  const safe = sanitizeArticleHtml(html);
  const shown = truncate ? truncateArticleHtml(safe, TEASER_BLOCK_COUNT) : safe;
  return <div dangerouslySetInnerHTML={{ __html: shown }} />;
}

function renderBlock(block: ContentBlock, locale: string, index: number) {
  switch (block.type) {
    case "heading": {
      const text = pickLocalized(block.text, locale);
      // Article bodies start at h2: the page title is the only h1 (§38).
      return block.level === 3 ? (
        <h3 key={index}>{text}</h3>
      ) : (
        <h2 key={index}>{text}</h2>
      );
    }
    case "quote": {
      const text = pickLocalized(block.text, locale);
      const attribution = block.attribution
        ? pickLocalized(block.attribution, locale)
        : null;
      return (
        <blockquote key={index} className="ds-pullquote">
          <p>{text}</p>
          {attribution ? <footer>{attribution}</footer> : null}
        </blockquote>
      );
    }
    case "image":
      return (
        <figure key={index} className="ds-figure ds-figure--wide">
          <div className="ds-figure__media">
            {/* eslint-disable-next-line @next/next/no-img-element -- local /media mount */}
            <img src={block.src} alt={block.alt} loading="lazy" decoding="async" />
          </div>
          {block.caption ? (
            <figcaption>{pickLocalized(block.caption, locale)}</figcaption>
          ) : null}
        </figure>
      );
    case "paragraph":
    default:
      return <p key={index}>{pickLocalized(block.text, locale)}</p>;
  }
}

export async function ArticleReader({
  item,
  locale,
  signedIn = true,
  signInHref,
  registerHref,
}: {
  item: ContentRecord;
  locale: string;
  /** Anonymous visitors see a truncated body and a sign-in wall (§ preview gate). */
  signedIn?: boolean;
  /** Where the wall's "Sign in"/"Create account" links send the visitor, redirect param included. */
  signInHref?: string;
  registerHref?: string;
}) {
  const t = await getTranslations("content");
  const tReader = await getTranslations("reader");
  const tCommon = await getTranslations("common");

  const title = pickLocalized(item.title, locale);
  const summary = pickLocalized(item.summary, locale);
  const body = pickLocalized(item.body, locale);
  const label = item.contentLabel
    ? t(`labels.${item.contentLabel}` as "labels.archival")
    : null;
  const blocks = item.blocks?.length
    ? signedIn
      ? item.blocks
      : item.blocks.slice(0, TEASER_BLOCK_COUNT)
    : null;
  const bodyTruncated = !signedIn && Boolean(blocks || body);

  return (
    <>
      <ReadingProgress targetId={ARTICLE_ID} />
      <article className="ds-article" id={ARTICLE_ID}>
        <header className="ds-article__mast">
          {/* Provenance leads: who published this and when, before the piece
              names itself — left-aligned with the headline below it. */}
          <div className="ds-byline ds-byline--lead">
            <div className="ds-byline__who">
              <Avatar name={item.authorName ?? "?"} size="md" />
              <div className="ds-byline__names">
                <ContentAttribution item={item} locale={locale} />
                <div className="ds-byline__facts">
                  <time dateTime={item.publishedAt.toISOString()}>
                    {tReader("published", {
                      date: item.publishedAt.toLocaleDateString(locale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }),
                    })}
                  </time>
                  {item.readingMinutes ? (
                    <span>
                      {tCommon("minutesRead", { count: item.readingMinutes })}
                    </span>
                  ) : null}
                  <span>
                    {tReader("inLanguage", {
                      language: item.originalLanguage.toUpperCase(),
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="ds-row ds-row--tight">
            <span className="ds-kicker ds-caps" style={{ margin: 0 }}>
              {t(`types.${item.type}` as "types.article")}
            </span>
            {label ? <Badge tone="neutral">{label}</Badge> : null}
          </div>

          {/* lang= so a Tamil or Hindi title sets in its own face (§12). */}
          <h1 className="ds-article__title" lang={item.originalLanguage}>
            {title}
          </h1>

          {summary ? (
            <p className="ds-article__standfirst" lang={item.originalLanguage}>
              {summary}
            </p>
          ) : null}
        </header>

        {/* No cover, no banner: a piece published without one is not missing
            a picture, so generated ornament in its place reads as a broken
            image rather than a deliberate choice. Matches the composer's own
            preview, which has always omitted it. */}
        {item.coverImage ? (
          <ContentCover
            seed={item.id}
            src={item.coverImage}
            className="ds-cover ds-article__cover"
            alt={tReader("cover", { title })}
            priority
            sizes="(max-width: 64rem) 100vw, 64rem"
          />
        ) : null}

        <div
          className={`ds-article__body ds-prose${bodyTruncated ? " ds-article__body--teaser" : ""}`}
          lang={item.originalLanguage}
          dir="auto"
        >
          {blocks ? (
            blocks.map((block, index) => renderBlock(block, locale, index))
          ) : body ? (
            <ArticleBody html={body} truncate={!signedIn} />
          ) : null}
        </div>

        {bodyTruncated ? (
          <SignInWall signInHref={signInHref} registerHref={registerHref} />
        ) : null}
      </article>
    </>
  );
}
