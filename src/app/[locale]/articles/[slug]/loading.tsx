import { getTranslations } from "next-intl/server";
import { ArticleSkeleton, SkeletonGroup, SidebarSkeleton } from "@/components/ui/skeleton";

/**
 * /articles/[slug] loading state.
 *
 * The real page renders `.ds-columns` (main reader + a MagazineSidebar
 * aside), not the generic masthead-plus-grid — see
 * src/app/[locale]/articles/[slug]/page.tsx and
 * src/components/content/article-reader.tsx for the masthead + cover +
 * prose geometry ArticleSkeleton already matches.
 */
export default async function ArticleLoading() {
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
