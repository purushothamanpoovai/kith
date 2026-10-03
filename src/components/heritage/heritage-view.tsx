import { getTranslations } from "next-intl/server";
import type { HeritageRecord } from "@/repositories/heritage-repository";
import { ReportForm } from "@/components/moderation/report-form";
import { ContentCover } from "@/components/graphics/content-cover";
import { SignInWall } from "@/components/content/sign-in-wall";
import { MediaSignInLock } from "@/components/content/media-sign-in-lock";
import { Badge } from "@/components/ui/badge";
import {
  heritageSummary,
  heritageText,
  heritageTitle,
} from "@/services/heritage-service";
import { LineagePanel } from "@/components/heritage/lineage-panel";

/** How much of the transcript an anonymous visitor sees before the wall. */
const TEASER_PARAGRAPH_COUNT = 3;

type Props = {
  item: HeritageRecord;
  locale: string;
  signedIn: boolean;
  signInHref?: string;
  registerHref?: string;
};

/**
 * A single heritage record (§31).
 *
 * Uses the shared article surfaces rather than `ds-page-header` /
 * `ds-article-body`, which were left behind when the editorial layer was
 * rebuilt and matched no rule in any stylesheet — this view was rendering
 * unstyled. Reading text now inherits the same face, measure and leading as
 * every other long-form surface (P2 consistency, P9 readability).
 */
export async function HeritageView({
  item,
  locale,
  signedIn,
  signInHref,
  registerHref,
}: Props) {
  const t = await getTranslations("heritage");
  const title = heritageTitle(item, locale);
  const summary = heritageSummary(item, locale);
  const text = heritageText(item, locale);
  const shownText =
    !signedIn && text
      ? text.split(/\n{2,}/).slice(0, TEASER_PARAGRAPH_COUNT).join("\n\n")
      : text;
  const textTruncated = !signedIn && Boolean(text) && shownText !== text;

  return (
    <article className="ds-article" data-visual="archival">
      <header className="ds-article__mast">
        <div className="ds-row ds-row--tight">
          <span className="ds-kicker ds-caps" style={{ margin: 0 }}>
            {t("oralHistory")}
          </span>
          <Badge tone="neutral">{item.originalLanguage.toUpperCase()}</Badge>
        </div>
        <h1 className="ds-article__title" lang={item.originalLanguage}>
          {title}
        </h1>
        {summary ? (
          <p className="ds-article__standfirst" lang={item.originalLanguage}>
            {summary}
          </p>
        ) : null}
        <div className="ds-byline">
          <div className="ds-byline__facts">
            <span>{item.authorName}</span>
          </div>
        </div>
      </header>

      {item.coverImage ? (
        <ContentCover
          seed={item.id}
          src={item.coverImage}
          className="ds-cover ds-article__cover"
          alt=""
          priority
          sizes="(max-width: 64rem) 100vw, 64rem"
        />
      ) : null}

      {item.mediaUrl ? (
        signedIn ? (
          <div className="ds-heritage-player">
            {/* A recording is the primary artefact here, so it keeps the native
                transport rather than the shared player: an oral history is
                listened to in place, not queued. */}
            <audio controls preload="metadata" src={item.mediaUrl}>
              <track kind="captions" />
            </audio>
          </div>
        ) : (
          <MediaSignInLock signInHref={signInHref} registerHref={registerHref} />
        )
      ) : null}

      {text ? (
        <div
          className={`ds-article__body ds-prose${textTruncated ? " ds-article__body--teaser" : ""}`}
          lang={item.originalLanguage}
          dir="auto"
        >
          <p>{shownText}</p>
        </div>
      ) : null}

      {textTruncated ? (
        <SignInWall signInHref={signInHref} registerHref={registerHref} />
      ) : null}

      <div className="ds-article__foot">
        <LineagePanel item={item} locale={locale} />
        <ReportForm targetType="content" targetId={item.id} signedIn={signedIn} />
      </div>
    </article>
  );
}
