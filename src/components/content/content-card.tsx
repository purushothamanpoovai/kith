import { getTranslations } from "next-intl/server";
import { Headphones, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ContentRecord } from "@/domain/content/types";
import { ContentCover } from "@/components/graphics/content-cover";
import { ContentAttribution } from "@/components/content/content-attribution";
import { pickLocalized } from "@/lib/localized";
import { contentHref, contentSummary, contentTitle } from "@/services/feed-service";

/**
 * Content cards (§29).
 *
 * Rather than one card with a `variant` prop that recolours the same box, the
 * shape follows the content type: prose gets a cover and a summary, media gets
 * a square frame with a play affordance and a duration, verse gets a framed
 * excerpt in its own script and no picture at all.
 *
 * `ContentCard` dispatches on the record so callers can hand it a mixed feed;
 * the specific cards are exported for places that know what they are showing.
 */

type Density = "default" | "lead" | "row" | "minimal";

/** Prose: articles and oral histories. */
export async function ArticleCard({
  item,
  locale,
  density = "default",
  priority = false,
}: {
  item: ContentRecord;
  locale: string;
  density?: Density;
  priority?: boolean;
}) {
  const t = await getTranslations("content");
  const tCommon = await getTranslations("common");
  const href = contentHref(item.type, item.slug);
  const title = contentTitle(item, locale);
  const summary = contentSummary(item, locale);
  const typeLabel = t(`types.${item.type}` as "types.article");
  const date = item.publishedAt.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const showCover = density !== "minimal";
  const showSummary = density === "default" || density === "lead";

  return (
    <Link
      href={href}
      className={`ds-card ds-card--interactive ds-card--flush ds-article-card ds-article-card--${density}`}
    >
      {showCover ? (
        <ContentCover
          seed={item.id}
          src={item.coverImage}
          className="ds-cover ds-article-card__cover"
          priority={priority}
          sizes={
            density === "lead"
              ? "(max-width: 48rem) 100vw, 50vw"
              : "(max-width: 48rem) 50vw, 20rem"
          }
        />
      ) : null}
      <div className="ds-article-card__body">
        <span className="ds-kicker ds-caps">{typeLabel}</span>
        {/* lang= so the title sets in the face for its own script (§12). */}
        <h3 className="ds-article-card__title" lang={item.originalLanguage}>
          {title}
        </h3>
        {showSummary && summary ? (
          <p className="ds-article-card__summary ds-clamp-3">{summary}</p>
        ) : null}
        <div className="ds-article-card__foot">
          <div className="ds-meta-row">
            {item.authorName ? <span>{item.authorName}</span> : null}
            <span>{date}</span>
            {item.readingMinutes ? (
              <span>{tCommon("minutesRead", { count: item.readingMinutes })}</span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Audio and video. */
export async function MediaCard({
  item,
  locale,
}: {
  item: ContentRecord;
  locale: string;
}) {
  const t = await getTranslations("content");
  const href = contentHref(item.type, item.slug);
  const title = contentTitle(item, locale);
  const typeLabel = t(`types.${item.type}` as "types.audio");
  const isVideo = item.type === "video";

  return (
    <Link
      href={href}
      className={`ds-card ds-card--interactive ds-card--flush ds-media-card ${
        isVideo ? "ds-media-card--video" : "ds-media-card--audio"
      }`}
    >
      <div className="ds-cover ds-media-card__cover">
        <ContentCover
          seed={item.id}
          src={item.coverImage}
          className="ds-cover"
          sizes="(max-width: 48rem) 50vw, 14rem"
        />
        <span className="ds-media-card__play" aria-hidden>
          {isVideo ? (
            <Play size={14} strokeWidth={2.25} className="ds-flip-rtl" />
          ) : (
            <Headphones size={14} strokeWidth={2} />
          )}
        </span>
      </div>
      <div className="ds-media-card__body">
        <span className="ds-kicker ds-caps">{typeLabel}</span>
        <h3 className="ds-media-card__title ds-clamp-2" lang={item.originalLanguage}>
          {title}
        </h3>
        {item.authorName ? (
          <p className="ds-metadata">{item.authorName}</p>
        ) : null}
      </div>
    </Link>
  );
}

/** Verse. The excerpt is the image. */
export async function PoetryCard({
  item,
  locale,
}: {
  item: ContentRecord;
  locale: string;
}) {
  const t = await getTranslations("content");
  const href = contentHref(item.type, item.slug);
  const title = contentTitle(item, locale);
  // Prefer the poem in its original script; fall back to the translation.
  const original = pickLocalized(item.originalText, item.originalLanguage);
  const excerpt =
    original || pickLocalized(item.translation, locale) || contentSummary(item, locale);

  return (
    <Link
      href={href}
      className="ds-card ds-card--interactive ds-poetry-card"
    >
      <span className="ds-kicker ds-caps">{t("types.poem")}</span>
      {excerpt ? (
        <p
          className="ds-poetry-card__excerpt"
          lang={original ? item.originalLanguage : locale}
        >
          {excerpt}
        </p>
      ) : null}
      <h3 className="ds-poetry-card__title" lang={item.originalLanguage}>
        {title}
      </h3>
      {item.authorName ? <p className="ds-metadata">{item.authorName}</p> : null}
    </Link>
  );
}

/**
 * Dispatches by content type. Community posts are excluded on purpose: they
 * belong to PostCard, which carries the author header and reaction row.
 */
export async function ContentCard({
  item,
  locale,
  density = "default",
  priority = false,
}: {
  item: ContentRecord;
  locale: string;
  density?: Density;
  priority?: boolean;
}) {
  if (item.type === "poem") return <PoetryCard item={item} locale={locale} />;
  if (item.type === "audio" || item.type === "video") {
    return <MediaCard item={item} locale={locale} />;
  }
  return (
    <ArticleCard item={item} locale={locale} density={density} priority={priority} />
  );
}

/**
 * A compact row with the official/community mark shown — used in rails and
 * "more from" lists where provenance matters more than a summary.
 */
export async function ContentRow({
  item,
  locale,
}: {
  item: ContentRecord;
  locale: string;
}) {
  const href = contentHref(item.type, item.slug);
  const title = contentTitle(item, locale);

  return (
    <div className="ds-card ds-card--pad ds-article-card ds-article-card--row">
      <ContentCover
        seed={item.id}
        src={item.coverImage}
        className="ds-cover ds-article-card__cover"
        sizes="6rem"
      />
      <div className="ds-article-card__body">
        <ContentAttribution item={item} locale={locale} />
        <h3 className="ds-article-card__title ds-clamp-2" lang={item.originalLanguage}>
          <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
            {title}
          </Link>
        </h3>
        <p className="ds-metadata">
          {item.publishedAt.toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
