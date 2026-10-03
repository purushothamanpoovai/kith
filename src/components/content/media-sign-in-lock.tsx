import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";

/**
 * The media hard-lock (§ preview gate).
 *
 * Unlike an article or heritage transcript, audio/video has no readable
 * "first three paragraphs" to show for free — a scrubbed clip would still let
 * someone piece the whole thing together. So an anonymous visitor sees no
 * player at all here, only the reason one isn't shown and the way to unlock
 * it, in place of the transport (§ media policy: no playback pre-sign-in).
 */
export async function MediaSignInLock({
  signInHref = "/login",
  registerHref = "/register",
}: {
  signInHref?: string;
  registerHref?: string;
}) {
  const t = await getTranslations("signInWall");

  return (
    <div className="ds-media-lock" role="region" aria-label={t("mediaTitle")}>
      <Lock size={20} strokeWidth={1.75} aria-hidden />
      <p className="ds-media-lock__title">{t("mediaTitle")}</p>
      <p className="ds-media-lock__body">{t("mediaBody")}</p>
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
