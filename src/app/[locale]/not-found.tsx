import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { PageFrame } from "@/components/layout/page-frame";

export default async function NotFoundPage() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations("shell");

  return (
    <PageFrame title={t("notFoundTitle")} lede={t("notFoundBody")} />
  );
}
