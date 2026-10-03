import { getTranslations } from "next-intl/server";
import { ArticleSkeleton, SkeletonGroup, SidebarSkeleton } from "@/components/ui/skeleton";

/**
 * /media/[slug] loading state.
 *
 * The real page (src/app/[locale]/media/[slug]/page.tsx) renders
 * `.ds-columns` — a reader column (VerseReader for poems, or a masthead +
 * player article for audio/video) plus a MagazineSidebar aside — matching
 * the same masthead+cover+prose geometry ArticleSkeleton already covers.
 */
export default async function MediaDetailLoading() {
  const t = await getTranslations("states");

  return (
    <SkeletonGroup label={t("loadingLabel")}>
      <div className="ds-columns">
        <div className="ds-columns__main">
          <ArticleSkeleton />
        </div>
        <SidebarSkeleton />
      </div>
    </SkeletonGroup>
  );
}
