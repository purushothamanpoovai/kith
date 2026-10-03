import { getTranslations } from "next-intl/server";
import { Accessibility, Clock, MapPin, Navigation, Shirt, HandHeart, ScrollText } from "lucide-react";
import type { OrganizationRecord } from "@/repositories/organization-repository";
import type { OrganizationServiceRecord } from "@/repositories/organization-service-repository";
import { getTodaysServices } from "@/domain/organization/service-schedule";
import { pickLocalized } from "@/lib/localized";
import { Badge } from "@/components/ui/badge";

/**
 * Visit planning (§ visit info) — the questions a devotee arrives with:
 * where, how to get there, what to wear, what the rules are, whether it's
 * accessible, and whether it's open right now. Every field is independently
 * optional and omitted when absent — an institution that hasn't filled in a
 * dress code should not show an empty "Dress code" heading.
 */
export async function VisitInfoSection({
  org,
  services,
  locale,
}: {
  org: OrganizationRecord;
  services: OrganizationServiceRecord[];
  locale: string;
}) {
  const t = await getTranslations("organizations");

  const address = org.address ? pickLocalized(org.address, locale) : null;
  const howToReach = org.howToReach ? pickLocalized(org.howToReach, locale) : null;
  const dressCode = org.dressCode ? pickLocalized(org.dressCode, locale) : null;
  const entryRules = org.entryRules ? pickLocalized(org.entryRules, locale) : null;
  const accessibility = org.accessibility ? pickLocalized(org.accessibility, locale) : null;
  const todaysServices = getTodaysServices(services, org.timezone);

  const hasAnything =
    address || howToReach || dressCode || entryRules || accessibility ||
    todaysServices.length > 0 || org.donationUrl;

  if (!hasAnything) return null;

  const mapsHref = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  return (
    <section className="ds-visit-info" aria-label={t("visitInfoTitle")}>
      <h2 className="ds-section-head__title">{t("visitInfoTitle")}</h2>
      <div className="ds-visit-grid">
        {address ? (
          <div className="ds-visit-item">
            <MapPin size={16} strokeWidth={1.75} aria-hidden />
            <div>
              <p className="ds-visit-item__label">{t("addressLabel")}</p>
              <p className="ds-visit-item__value" dir="auto">{address}</p>
              {mapsHref ? (
                <a href={mapsHref} rel="noopener noreferrer" target="_blank" className="ds-text-link">
                  <Navigation size={12} strokeWidth={1.75} aria-hidden /> {t("getDirections")}
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {howToReach ? (
          <div className="ds-visit-item">
            <Navigation size={16} strokeWidth={1.75} aria-hidden />
            <div>
              <p className="ds-visit-item__label">{t("howToReachLabel")}</p>
              <p className="ds-visit-item__value" dir="auto">{howToReach}</p>
            </div>
          </div>
        ) : null}

        {dressCode ? (
          <div className="ds-visit-item">
            <Shirt size={16} strokeWidth={1.75} aria-hidden />
            <div>
              <p className="ds-visit-item__label">{t("dressCodeLabel")}</p>
              <p className="ds-visit-item__value" dir="auto">{dressCode}</p>
            </div>
          </div>
        ) : null}

        {entryRules ? (
          <div className="ds-visit-item">
            <ScrollText size={16} strokeWidth={1.75} aria-hidden />
            <div>
              <p className="ds-visit-item__label">{t("entryRulesLabel")}</p>
              <p className="ds-visit-item__value" dir="auto">{entryRules}</p>
            </div>
          </div>
        ) : null}

        {accessibility ? (
          <div className="ds-visit-item">
            <Accessibility size={16} strokeWidth={1.75} aria-hidden />
            <div>
              <p className="ds-visit-item__label">{t("accessibilityLabel")}</p>
              <p className="ds-visit-item__value" dir="auto">{accessibility}</p>
            </div>
          </div>
        ) : null}

        {org.donationUrl ? (
          <div className="ds-visit-item">
            <HandHeart size={16} strokeWidth={1.75} aria-hidden />
            <div>
              <p className="ds-visit-item__label">{t("donationLabel")}</p>
              <a
                href={org.donationUrl}
                rel="noopener noreferrer"
                target="_blank"
                className="ds-text-link"
              >
                {t("donateLink")}
              </a>
            </div>
          </div>
        ) : null}
      </div>

      {todaysServices.length > 0 ? (
        <div className="ds-visit-services">
          <p className="ds-visit-item__label">
            <Clock size={16} strokeWidth={1.75} aria-hidden /> {t("todaysServicesLabel")}
          </p>
          <ul className="ds-visit-services__list">
            {todaysServices.map(({ service, isOpenNow }) => (
              <li key={service.id} className="ds-visit-services__row">
                <span className="ds-visit-services__name" dir="auto">
                  {pickLocalized(service.name, locale)}
                </span>
                <span className="ds-visit-services__time">
                  {service.startTime}
                  {service.endTime ? `–${service.endTime}` : ""}
                  {service.language ? ` · ${service.language.toUpperCase()}` : ""}
                </span>
                {isOpenNow ? <Badge tone="accent">{t("openNow")}</Badge> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
