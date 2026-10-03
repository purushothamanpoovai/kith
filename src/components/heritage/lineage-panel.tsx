import { getTranslations } from "next-intl/server";
import type { HeritageRecord } from "@/repositories/heritage-repository";
import { heritageLocation } from "@/services/heritage-service";

type Props = {
  item: HeritageRecord;
  locale: string;
};

export async function LineagePanel({ item, locale }: Props) {
  const t = await getTranslations("heritage");
  const { lineage } = item;
  const location = heritageLocation(item, locale);
  const rights = t(
    `mediaRights.${lineage.rights}` as "heritage.mediaRights.contributor_created",
  );
  const tier = t(
    `archiveTier.${lineage.archiveTier}` as "heritage.archiveTier.community",
  );

  return (
    <aside className="ds-lineage-panel" aria-label={t("lineageLabel")}>
      <h2 className="ds-lineage-panel__title">{t("lineageTitle")}</h2>
      <dl className="ds-lineage-dl">
        {lineage.originallyToldBy ? (
          <div>
            <dt>{t("originallyToldBy")}</dt>
            <dd>{lineage.originallyToldBy}</dd>
          </div>
        ) : null}
        {lineage.recordedByName ? (
          <div>
            <dt>{t("recordedBy")}</dt>
            <dd>{lineage.recordedByName}</dd>
          </div>
        ) : null}
        {location ? (
          <div>
            <dt>{t("place")}</dt>
            <dd>{location}</dd>
          </div>
        ) : null}
        {lineage.approximatePeriod ? (
          <div>
            <dt>{t("period")}</dt>
            <dd>{lineage.approximatePeriod}</dd>
          </div>
        ) : null}
        <div>
          <dt>{t("archive")}</dt>
          <dd>{tier}</dd>
        </div>
        <div>
          <dt>{t("rightsLabel")}</dt>
          <dd>{rights}</dd>
        </div>
        {lineage.sourceNote ? (
          <div>
            <dt>{t("sourceNote")}</dt>
            <dd>{lineage.sourceNote}</dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );
}
