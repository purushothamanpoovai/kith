import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageFrame } from "@/components/layout/page-frame";
import { ExploreSectionManager } from "@/components/admin/explore-section-manager";
import { requireSuperAdminPage } from "@/app/actions/moderation-actions";
import { getAllExploreSections } from "@/services/explore-section-service";

type PageProps = { params: Promise<{ locale: string }> };

export default async function AdminExplorePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSuperAdminPage();
  const t = await getTranslations("exploreAdmin");
  const tOrg = await getTranslations("organizations");
  const sections = await getAllExploreSections();

  return (
    <PageFrame eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")}>
      <div className="ds-stack">
        <p>
          <Link href="/admin">{tOrg("backToAdmin")}</Link>
        </p>
        <ExploreSectionManager sections={sections} locale={locale} />
      </div>
    </PageFrame>
  );
}
