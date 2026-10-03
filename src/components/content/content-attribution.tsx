import { getTranslations } from "next-intl/server";
import { BadgeCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { pickLocalized } from "@/lib/localized";
import type { ContentRecord } from "@/domain/content/types";

/**
 * Official vs community attribution (§26).
 *
 * The distinction has to be identifiable without being aggressive: official
 * content is marked by an outlined ink badge plus the organization's name;
 * community content by a quiet filled badge plus the person's name. Colour is
 * never the only signal — each state carries a word.
 */
export async function ContentAttribution({
  item,
  locale,
  linkOrganization = true,
}: {
  item: ContentRecord;
  locale: string;
  linkOrganization?: boolean;
}) {
  const t = await getTranslations("content");
  const isOfficial = item.origin === "official" && item.ownerOrganizationName;
  const orgName = item.ownerOrganizationName
    ? pickLocalized(item.ownerOrganizationName, locale)
    : null;

  if (isOfficial && orgName) {
    return (
      <div className="ds-attribution">
        <Badge tone="official" icon={<BadgeCheck size={11} strokeWidth={2.25} />}>
          {t("origin.official")}
        </Badge>
        {linkOrganization && item.ownerOrganizationSlug ? (
          <Link
            className="ds-attribution__org"
            href={`/org/${item.ownerOrganizationSlug}`}
          >
            {orgName}
          </Link>
        ) : (
          <span className="ds-attribution__org">{orgName}</span>
        )}
        {item.authorName ? (
          <span className="ds-attribution__by">
            {t("attribution.createdBy", { name: item.authorName })}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ds-attribution">
      <Badge tone="community">{t("origin.community")}</Badge>
      {item.authorName ? (
        <span className="ds-attribution__org">{item.authorName}</span>
      ) : null}
    </div>
  );
}
