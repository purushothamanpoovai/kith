import { getTranslations } from "next-intl/server";
import { ArrowRight, Compass } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ContentRecord } from "@/domain/content/types";
import { ContentCover } from "@/components/graphics/content-cover";
import { DecorativePattern, Ornament } from "@/components/graphics/decorative-pattern";
import { ButtonLink } from "@/components/ui/button";
import { contentHref, contentTitle } from "@/services/feed-service";

/**
 * The home masthead (§8).
 *
 * An editorial statement, not a "welcome to our platform" banner: a small
 * contextual label, a two-line proposition, one supporting sentence, and two
 * actions — with the featured story placed beside it rather than under it, so
 * the hero band carries real content instead of a gradient.
 *
 * Bounded height is the point. The previous hero spent roughly 600px of a
 * 900px viewport on a decorative image.
 */
export async function HomeHero({
  feature,
  locale,
  signedIn,
}: {
  feature: ContentRecord | null;
  locale: string;
  signedIn: boolean;
}) {
  const t = await getTranslations("home");
  const tApp = await getTranslations("app");
  const tContent = await getTranslations("content");
  const tNav = await getTranslations("nav");

  return (
    <section className="ds-home-hero" aria-labelledby="home-title">
      <DecorativePattern pattern="lattice" opacity={0.06} fade="inline" />
      <Ornament corner="br" size={96} />

      <div className="ds-home-hero__statement">
        <span className="ds-kicker ds-caps">{t("eyebrow")}</span>
        <h1 className="ds-home-hero__title" id="home-title">
          {tApp("heroTitle")}
        </h1>
        <p className="ds-home-hero__lede">{tApp("heroLede")}</p>
        <div className="ds-home-hero__actions">
          <ButtonLink
            href="/explore"
            variant="primary"
            icon={<Compass size={15} strokeWidth={1.75} />}
          >
            {t("exploreCta")}
          </ButtonLink>
          <ButtonLink
            href={signedIn ? "/my-space" : "/community"}
            variant="secondary"
            iconEnd={
              <ArrowRight size={14} strokeWidth={2} className="ds-flip-rtl" />
            }
          >
            {signedIn ? tNav("mySpace") : tNav("community")}
          </ButtonLink>
        </div>
      </div>

      {feature ? (
        <Link
          href={contentHref(feature.type, feature.slug)}
          className="ds-home-hero__feature"
        >
          <div className="ds-cover ds-home-hero__feature-cover">
            <ContentCover
              seed={feature.id}
              src={feature.coverImage}
              className="ds-cover"
              priority
              sizes="(max-width: 56rem) 100vw, 40rem"
            />
            <span className="ds-cover__overlay" aria-hidden />
            <div className="ds-home-hero__feature-text">
              <span className="ds-kicker ds-caps ds-home-hero__feature-kicker">
                {tContent(`types.${feature.type}` as "types.article")}
              </span>
              <h2
                className="ds-home-hero__feature-title ds-clamp-3"
                lang={feature.originalLanguage}
              >
                {contentTitle(feature, locale)}
              </h2>
              <p className="ds-home-hero__feature-meta">
                {feature.authorName
                  ? `${t("heroBy", { name: feature.authorName })} · `
                  : ""}
                <time dateTime={feature.publishedAt.toISOString()}>
                  {feature.publishedAt.toLocaleDateString(locale, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </p>
            </div>
          </div>
        </Link>
      ) : null}
    </section>
  );
}
