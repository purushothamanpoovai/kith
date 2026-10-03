import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeritageCard } from "@/components/heritage/heritage-card";
import { Landmark } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { PageFrame } from "@/components/layout/page-frame";
import { listHeritageArchive } from "@/services/heritage-service";

type PageProps = { params: Promise<{ locale: string }> };

export default async function HeritagePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("heritage");
  const tStates = await getTranslations("states");
  const items = await listHeritageArchive(24);

  return (
    <PageFrame eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")}>
      {items.length === 0 ? (
        <EmptyState
          title={t("title")}
          body={t("emptyArchive")}
          mark={<Landmark size={26} strokeWidth={1.25} />}
          actions={
            <ButtonLink href="/explore" variant="secondary">
              {tStates("exploreAction")}
            </ButtonLink>
          }
          as="h2"
        />
      ) : (
        <div className="ds-heritage-grid">
          {items.map((item) => (
            <HeritageCard key={item.id} item={item} locale={locale} />
          ))}
        </div>
      )}
    </PageFrame>
  );
}
