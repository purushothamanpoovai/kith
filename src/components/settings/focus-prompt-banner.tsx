import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function FocusPromptBanner() {
  const t = await getTranslations("settings");

  return (
    <aside className="ds-focus-prompt" role="status">
      <p className="ds-focus-prompt__text">{t("promptBanner")}</p>
      <Link className="ds-focus-prompt__link" href="/settings">
        {t("promptAction")}
      </Link>
    </aside>
  );
}
