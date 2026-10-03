import { getTranslations, setRequestLocale } from "next-intl/server";
import { ModerationQueue } from "@/components/moderation/moderation-queue";
import { PageFrame } from "@/components/layout/page-frame";
import { ButtonLink } from "@/components/ui/button";
import { requireModeratorPage } from "@/app/actions/moderation-actions";
import { canAccessAdmin } from "@/lib/permissions";
import { getModerationQueue } from "@/services/moderation-service";

type PageProps = { params: Promise<{ locale: string }> };

export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderation");
  const tOrg = await getTranslations("organizations");
  const tEditorial = await getTranslations("editorial");
  const tExplore = await getTranslations("exploreAdmin");
  const user = await requireModeratorPage();
  const reports = await getModerationQueue(user);
  const isSuperAdmin = await canAccessAdmin(user);

  return (
    <PageFrame eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")}>
      <p className="ds-row">
        <ButtonLink variant="tertiary" href="/admin/editorial">
          {tEditorial("title")}
        </ButtonLink>
        {isSuperAdmin ? (
          <>
            <ButtonLink variant="tertiary" href="/admin/organizations">
              {tOrg("adminTitle")}
            </ButtonLink>
            <ButtonLink variant="tertiary" href="/admin/explore">
              {tExplore("title")}
            </ButtonLink>
          </>
        ) : null}
      </p>
      <ModerationQueue reports={reports} />
    </PageFrame>
  );
}
