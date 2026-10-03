import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageFrame } from "@/components/layout/page-frame";
import { MagazineSidebar } from "@/components/layout/magazine-sidebar";
import { requireModeratorPage } from "@/app/actions/moderation-actions";

type PageProps = { params: Promise<{ locale: string }> };

/**
 * The editorial preview (moved out of `/community`, §18).
 *
 * "Editor's Shelf", the traditions rail, and upcoming events are curated
 * discovery widgets, not reader engagement — they belong where an editor can
 * see what the site is currently surfacing, not inside the community
 * discussion feed where they crowded out the reader's own activity.
 */
export default async function EditorialPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("editorial");
  await requireModeratorPage();

  return (
    <PageFrame eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")}>
      <div className="ds-editorial-preview">
        <MagazineSidebar locale={locale} />
      </div>
    </PageFrame>
  );
}
