import { getTranslations, setRequestLocale } from "next-intl/server";
import { Compass } from "lucide-react";
import { PageFrame } from "@/components/layout/page-frame";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { OrganizationCard } from "@/components/organizations/organization-card";
import { listOrganizations } from "@/repositories/organization-repository";

type PageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Sacred Places index (§explore).
 *
 * The Explore dimension index otherwise lists `Scope` rows (religions,
 * traditions, topics…), but a sacred place is a separate `Organization`
 * record, not a scope — so this page fetches from that model directly rather
 * than being folded into `ScopeListPage`, the way the dimension tiles are.
 */
export default async function OrganizationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const organizations = await listOrganizations();

  return (
    <PageFrame
      eyebrow={t("organizations.eyebrow")}
      title={t("explore.organizationsTitle")}
      lede={t("explore.organizationsLede")}
    >
      {organizations.length === 0 ? (
        <EmptyState
          title={t("scopes.emptyTitle")}
          body={t("scopes.emptyBody")}
          mark={<Compass size={26} strokeWidth={1.25} />}
          actions={
            <ButtonLink href="/explore" variant="secondary">
              {t("states.exploreAction")}
            </ButtonLink>
          }
          as="h2"
        />
      ) : (
        <div className="ds-grid ds-grid--2">
          {organizations.map((organization) => (
            <OrganizationCard
              key={organization.id}
              organization={organization}
              locale={locale}
            />
          ))}
        </div>
      )}
    </PageFrame>
  );
}
