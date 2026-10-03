import { getTranslations } from "next-intl/server";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

/**
 * /login loading state.
 *
 * AuthPage (src/components/layout/auth-page.tsx) renders a small centred
 * card — nothing like the generic full-width grid fallback — so this
 * mirrors its `.ds-auth-page` / `.ds-auth-page__inner` / `.ds-auth-page__head`
 * geometry with a title, a couple of input-shaped bars, and a button bar.
 */
export default async function LoginLoading() {
  const t = await getTranslations("states");

  return (
    <SkeletonGroup label={t("loadingLabel")}>
      <article className="ds-auth-page">
        <div className="ds-auth-page__inner">
          <header className="ds-auth-page__head">
            <Skeleton variant="title" width="60%" height="1.8rem" />
            <Skeleton variant="text" width="85%" />
          </header>
          <div className="ds-auth-form">
            <Skeleton variant="block" height="2.75rem" />
            <Skeleton variant="block" height="2.75rem" />
            <Skeleton variant="block" height="var(--ds-control-height-lg)" />
          </div>
        </div>
      </article>
    </SkeletonGroup>
  );
}
