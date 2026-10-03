import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { OrganizationRecord } from "@/repositories/organization-repository";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/badge";
import { resolveOrganizationTheme, themeAttributes } from "@/domain/theme/theme-config";
import { pickLocalized } from "@/lib/localized";

/**
 * An organization in a list (§25).
 *
 * Institutional rather than personal: a squared crest, the name, the verified
 * mark where it applies, and the organization's own identity accent carried on
 * a single hairline down the start edge. The accent comes from the resolved
 * organization theme, so no component needs to know which organization it is.
 */
export async function OrganizationCard({
  organization,
  locale,
}: {
  organization: OrganizationRecord;
  locale: string;
}) {
  const t = await getTranslations("organizations");
  const name = pickLocalized(organization.name, locale);
  const description = organization.description
    ? pickLocalized(organization.description, locale)
    : null;
  const theme = resolveOrganizationTheme(organization.slug);

  return (
    <Link
      href={`/org/${organization.slug}`}
      className="ds-card ds-card--interactive ds-org-card"
      {...themeAttributes(theme)}
    >
      <Avatar
        name={name}
        src={organization.logoPath}
        kind="organization"
        size="lg"
      />
      <div className="ds-org-card__body">
        <h3 className="ds-org-card__name">
          {name}
          {organization.status === "verified" ? (
            <VerifiedBadge label={t("verifiedShort")} />
          ) : null}
        </h3>
        <p className="ds-org-card__meta">
          {t(`kind.${organization.kind}` as "kind.temple")}
        </p>
        {description ? (
          <p className="ds-org-card__meta ds-clamp-2">{description}</p>
        ) : null}
      </div>
    </Link>
  );
}
