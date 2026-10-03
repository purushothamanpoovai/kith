import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";

/**
 * The sign-in wall (§ preview gate).
 *
 * Anonymous visitors see real title, cover and opening prose — never a blank
 * or generic teaser — then this: a visual cutoff (the fade is styling on the
 * body wrapper above this component) and a single, unambiguous call to sign
 * in or register to keep reading. Modelled on how Quora/Reddit gate content:
 * enough to judge whether it's worth an account, not enough to read for free.
 */
export async function SignInWall({
  signInHref = "/login",
  registerHref = "/register",
}: {
  signInHref?: string;
  registerHref?: string;
}) {
  const t = await getTranslations("signInWall");

  return (
    <div className="ds-signin-wall" role="region" aria-label={t("title")}>
      <p className="ds-signin-wall__title">{t("title")}</p>
      <p className="ds-signin-wall__body">{t("body")}</p>
      <div className="ds-signin-wall__actions">
        <ButtonLink href={signInHref} variant="primary">
          {t("signIn")}
        </ButtonLink>
        <ButtonLink href={registerHref} variant="secondary">
          {t("register")}
        </ButtonLink>
      </div>
    </div>
  );
}
