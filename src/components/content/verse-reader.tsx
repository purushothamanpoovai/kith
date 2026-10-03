import { getTranslations } from "next-intl/server";
import type { ContentRecord } from "@/domain/content/types";
import { ContentAttribution } from "@/components/content/content-attribution";
import { SignInWall } from "@/components/content/sign-in-wall";
import { Badge } from "@/components/ui/badge";
import { pickLocalized } from "@/lib/localized";

/**
 * The verse reader (§11, §12).
 *
 * Original, transliteration and translation are three different registers, so
 * they get three treatments rather than three identical panels. The original
 * is set large, in its own script's face, with the poet's line breaks kept —
 * which is why each panel carries an explicit `lang`.
 */
export async function VerseReader({
  item,
  locale,
  actions,
  signedIn = true,
  signInHref,
  registerHref,
}: {
  item: ContentRecord;
  locale: string;
  actions?: React.ReactNode;
  /** Anonymous visitors see the original verse but not its translation (§ preview gate). */
  signedIn?: boolean;
  signInHref?: string;
  registerHref?: string;
}) {
  const t = await getTranslations("content");
  const tReader = await getTranslations("reader");

  const title = pickLocalized(item.title, locale);
  const summary = pickLocalized(item.summary, locale);
  const original = pickLocalized(item.originalText, item.originalLanguage);
  const transliteration = pickLocalized(item.transliteration, locale);
  const translation = pickLocalized(item.translation, locale);
  const body = pickLocalized(item.body, locale);

  return (
    <article className="ds-article">
      <header className="ds-article__mast">
        <div className="ds-row ds-row--tight">
          <span className="ds-kicker ds-caps" style={{ margin: 0 }}>
            {t("types.poem")}
          </span>
          <Badge tone="neutral">{item.originalLanguage.toUpperCase()}</Badge>
        </div>
        <h1 className="ds-article__title" lang={item.originalLanguage}>
          {title}
        </h1>
        {summary ? <p className="ds-article__standfirst">{summary}</p> : null}
        <div className="ds-byline">
          <div className="ds-byline__who">
            <ContentAttribution item={item} locale={locale} />
          </div>
          {actions ? <div className="ds-byline__actions">{actions}</div> : null}
        </div>
      </header>

      <div className="ds-verse-stack">
        {original ? (
          <section className="ds-verse-panel">
            <span className="ds-verse-panel__label">
              {tReader("verseOriginal")}
            </span>
            <div className="ds-verse-panel__original" lang={item.originalLanguage}>
              {original}
            </div>
          </section>
        ) : null}

        {transliteration && signedIn ? (
          <section className="ds-verse-panel ds-verse-panel--plain">
            <span className="ds-verse-panel__label">
              {tReader("verseTransliteration")}
            </span>
            {/* Transliteration is Latin-script regardless of the poem. */}
            <div className="ds-verse-panel__translit" lang="en">
              {transliteration}
            </div>
          </section>
        ) : null}

        {translation && signedIn ? (
          <section className="ds-verse-panel ds-verse-panel--plain">
            <span className="ds-verse-panel__label">
              {tReader("verseTranslation")}
            </span>
            <div className="ds-verse-panel__translation" lang={locale}>
              {translation}
            </div>
          </section>
        ) : null}

        {!original && !translation && body && signedIn ? (
          <div className="ds-prose">
            <p>{body}</p>
          </div>
        ) : null}
      </div>

      {!signedIn && (translation || transliteration || (!original && body)) ? (
        <SignInWall signInHref={signInHref} registerHref={registerHref} />
      ) : null}
    </article>
  );
}
