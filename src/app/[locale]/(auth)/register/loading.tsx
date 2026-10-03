import { getTranslations } from "next-intl/server";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

/**
 * /register loading state.
 *
 * Same small centred-card shape as /login (AuthPage), but RegisterForm has
 * one more field (name, email, password) than SignInForm, so the skeleton
 * carries three input-shaped bars instead of two.
 */
export default async function RegisterLoading() {
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
            <Skeleton variant="block" height="2.75rem" />
            <Skeleton variant="block" height="var(--ds-control-height-lg)" />
          </div>
        </div>
      </article>
    </SkeletonGroup>
  );
}
