import { getTranslations } from "next-intl/server";
import { ArticleSkeleton, SkeletonGroup } from "@/components/ui/skeleton";

/**
 * /heritage/[slug] loading state.
 *
 * The real page wraps HeritageView in a plain PageFrame with no sidebar
 * (see src/app/[locale]/heritage/[slug]/page.tsx and
 * src/components/heritage/heritage-view.tsx) — a single-column masthead +
 * cover + prose reader, which ArticleSkeleton already matches. No
 * `.ds-columns` shell here, unlike /articles/[slug]. AppShell already
 * supplies the outer Container, so this doesn't add its own.
 */
export default async function HeritageLoading() {
  const t = await getTranslations("states");

  return (
    <SkeletonGroup label={t("loadingLabel")}>
      <ArticleSkeleton />
    </SkeletonGroup>
  );
}
