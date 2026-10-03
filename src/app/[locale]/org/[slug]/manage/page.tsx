import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { PageFrame } from "@/components/layout/page-frame";
import { Section } from "@/components/ui/section";
import { VisitInfoForm } from "@/components/organizations/manage/visit-info-form";
import { ProductManager } from "@/components/organizations/manage/product-manager";
import { ServiceManager } from "@/components/organizations/manage/service-manager";
import { EventTierManager } from "@/components/organizations/manage/event-tier-manager";
import { getCurrentUser } from "@/services/auth-service";
import { PermissionAction } from "@/domain/permissions/actions";
import { can } from "@/services/permission-service";
import {
  getOrganizationBySlug,
  listOrganizationMembers,
} from "@/repositories/organization-repository";
import { listOrganizationServices } from "@/repositories/organization-service-repository";
import { listAllProducts } from "@/repositories/product-repository";
import { listEventsForOrganizations } from "@/repositories/event-repository";
import {
  getEventTierBookingReport,
  listEventTicketTiers,
} from "@/repositories/event-ticket-tier-repository";
import { pickLocalized } from "@/lib/localized";
import { eventTitle as formatEventTitle } from "@/services/event-service";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export default async function OrganizationManagePage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect({ href: "/login", locale });

  const org = await getOrganizationBySlug(slug);
  if (!org) notFound();

  const allowed = await can(user, PermissionAction.ORGANIZATION_MANAGE, {
    organizationId: org.id,
  });
  if (!allowed) redirect({ href: `/org/${slug}`, locale });

  const t = await getTranslations("organizations");
  const [members, services, products, events] = await Promise.all([
    listOrganizationMembers(org.id),
    listOrganizationServices(org.id),
    listAllProducts(org.id),
    listEventsForOrganizations([org.id], 40),
  ]);

  // Tiers and their booking report are fetched per event — an org with no
  // events (or no ticketed events) simply renders no ticket-tier cards, the
  // same "omit when empty" rule the public page follows.
  const eventTierData = await Promise.all(
    events.map(async (event) => ({
      event,
      tiers: await listEventTicketTiers(event.id),
      report: await getEventTierBookingReport(event.id),
    })),
  );

  const name = pickLocalized(org.name, locale);

  return (
    <PageFrame eyebrow={t("dashboardEyebrow")} title={name} lede={t("dashboardLede")}>
      <div className="ds-stack ds-stack--lg">
        <Section title={t("membersTitle")}>
          <ul className="ds-stack">
            {members.map((member) => (
              <li key={member.id} className="ds-card ds-card--pad">
                <strong>{member.userName}</strong>
                <span className="ds-hint"> · {t(`memberRole.${member.role}`)}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t("manageVisitInfoTitle")} lede={t("manageVisitInfoHint")}>
          <VisitInfoForm
            slug={org.slug}
            locale={locale}
            timezone={org.timezone}
            address={org.address}
            howToReach={org.howToReach}
            dressCode={org.dressCode}
            entryRules={org.entryRules}
            accessibility={org.accessibility}
            donationUrl={org.donationUrl}
          />
        </Section>

        <Section title={t("manageServicesTitle")} lede={t("manageServicesHint")}>
          <ServiceManager slug={org.slug} locale={locale} services={services} />
        </Section>

        <Section title={t("manageProductsTitle")} lede={t("manageProductsHint")}>
          <ProductManager slug={org.slug} locale={locale} products={products} />
        </Section>

        {events.length > 0 ? (
          <Section title={t("manageEventsTitle")} lede={t("manageEventsHint")}>
            <div className="ds-stack">
              {eventTierData.map(({ event, tiers, report }) => (
                <EventTierManager
                  key={event.id}
                  eventId={event.id}
                  eventTitle={formatEventTitle(event, locale)}
                  locale={locale}
                  tiers={tiers}
                  bookings={
                    new Map(report.map((row) => [row.tier.id, { going: row.going, maybe: row.maybe }]))
                  }
                />
              ))}
            </div>
          </Section>
        ) : null}
      </div>
    </PageFrame>
  );
}
