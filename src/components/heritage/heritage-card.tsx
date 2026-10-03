import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { HeritageRecord } from "@/repositories/heritage-repository";
import { ContentCover } from "@/components/graphics/content-cover";
import { heritageSummary, heritageTitle } from "@/services/heritage-service";

/**
 * A heritage record in a list (§31).
 *
 * Archival rather than editorial: square corners on a warm paper ground, a
 * lightly desaturated image, an accession-style tier label in the corner, and
 * a provenance footer naming who told the story and when. That footer is the
 * point of the card — a memory without provenance is not an archive.
 */
export async function HeritageCard({
  item,
  locale,
}: {
  item: HeritageRecord;
  locale: string;
}) {
  const t = await getTranslations("heritage");
  const title = heritageTitle(item, locale);
  const summary = heritageSummary(item, locale);
  const tier = t(
    `archiveTier.${item.lineage.archiveTier}` as "archiveTier.community",
  );

  return (
    <Link
      href={`/heritage/${item.slug}`}
      className="ds-card ds-card--interactive ds-heritage-card"
    >
      <span className="ds-heritage-card__label">{tier}</span>
      <ContentCover
        seed={item.id}
        src={item.coverImage}
        className="ds-cover ds-heritage-card__cover"
        sizes="(max-width: 48rem) 100vw, 16rem"
      />
      <div className="ds-heritage-card__body">
        <span className="ds-kicker ds-caps">{t("oralHistory")}</span>
        <h3 className="ds-heritage-card__title" lang={item.originalLanguage}>
          {title}
        </h3>
        {summary ? (
          <p className="ds-metadata ds-clamp-2">{summary}</p>
        ) : null}
        <dl className="ds-heritage-card__provenance">
          {item.lineage.originallyToldBy ? (
            <div>
              <dt>{t("originallyToldBy")}</dt>
              <dd>{item.lineage.originallyToldBy}</dd>
            </div>
          ) : null}
          {item.lineage.approximatePeriod ? (
            <div>
              <dt>{t("period")}</dt>
              <dd>{item.lineage.approximatePeriod}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </Link>
  );
}
