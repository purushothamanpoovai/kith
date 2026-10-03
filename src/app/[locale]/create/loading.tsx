import { getTranslations } from "next-intl/server";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

/**
 * /create loading state.
 *
 * The composer page uses a compact PageFrame (`compact` prop, tighter
 * masthead) and its body is a form-like editor surface, not a card grid —
 * see src/app/[locale]/create/page.tsx.
 */
export default async function CreateLoading() {
  const t = await getTranslations("states");

  return (
    <SkeletonGroup label={t("loadingLabel")}>
      <div className="ds-page-mast ds-page-mast--compact">
        <Skeleton variant="title" width="min(20rem, 60%)" height="1.9rem" />
        <Skeleton variant="text" width="min(30rem, 80%)" />
      </div>
      <div style={{ display: "grid", gap: "var(--ds-space-4)" }}>
        <Skeleton variant="block" height="2.75rem" />
        <Skeleton variant="block" height="14rem" />
        <Skeleton variant="block" height="2.75rem" width="10rem" />
      </div>
    </SkeletonGroup>
  );
}
