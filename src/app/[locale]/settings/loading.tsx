import { getTranslations } from "next-intl/server";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

/**
 * /settings loading state.
 *
 * A single-column PageFrame whose body is a preferences form — a handful of
 * field-shaped controls, not a card grid — see
 * src/app/[locale]/settings/page.tsx.
 */
export default async function SettingsLoading() {
  const t = await getTranslations("states");

  return (
    <SkeletonGroup label={t("loadingLabel")}>
      <div className="ds-page-mast">
        <Skeleton variant="text" width="7rem" />
        <Skeleton variant="title" width="min(24rem, 70%)" height="2.2rem" />
        <Skeleton variant="text" width="min(36rem, 90%)" />
      </div>
      <div style={{ display: "grid", gap: "var(--ds-space-5)" }}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} style={{ display: "grid", gap: "var(--ds-space-2)"}}>
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="block" height="2.75rem" />
          </div>
        ))}
        <Skeleton variant="block" height="2.75rem" width="8rem" />
      </div>
    </SkeletonGroup>
  );
}
