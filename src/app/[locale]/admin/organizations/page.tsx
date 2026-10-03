import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageFrame } from "@/components/layout/page-frame";
import { requireSuperAdminPage } from "@/app/actions/moderation-actions";
import { listOrganizations } from "@/repositories/organization-repository";
import { pickLocalized } from "@/lib/localized";

type PageProps = { params: Promise<{ locale: string }> };

export default async function AdminOrganizationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSuperAdminPage();
  const t = await getTranslations("organizations");
  const orgs = await listOrganizations();

  return (
    <PageFrame eyebrow={t("adminEyebrow")} title={t("adminTitle")} lede={t("adminLede")}>
      <div className="ds-stack">
        <p>
          <Link href="/admin">{t("backToAdmin")}</Link>
        </p>
        <ul className="ds-stack">
          {orgs.map((org) => (
            <li key={org.id} className="ds-card">
              <Link href={`/org/${org.slug}`}>
                <strong>{pickLocalized(org.name, locale)}</strong>
              </Link>
              <p className="ds-hint">
                {t(`status.${org.status}`)} · {t(`kind.${org.kind}`)}
              </p>
              <Link href={`/org/${org.slug}/manage`}>{t("manage")}</Link>
            </li>
          ))}
        </ul>
      </div>
    </PageFrame>
  );
}
