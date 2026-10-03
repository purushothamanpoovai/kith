"use client";

import { useTranslations } from "next-intl";
import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";

type Props = {
  reset: () => void;
};

export default function LocaleError({ reset }: Props) {
  const t = useTranslations("common");

  return (
    <PageFrame title={t("errorTitle")} lede={t("errorBody")}>
      <Button variant="primary" onClick={reset}>
        {t("retry")}
      </Button>
    </PageFrame>
  );
}
