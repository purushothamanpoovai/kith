"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { setScopeContextAction } from "@/app/actions/subscription-actions";
import { Button } from "@/components/ui/button";

type Props = {
  scopeId: string;
  isActive: boolean;
};

export function SetScopeLensButton({ scopeId, isActive }: Props) {
  const t = useTranslations("scopeContext");
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="tertiary"
      disabled={pending || isActive}
      onClick={() => {
        startTransition(() => {
          void setScopeContextAction(scopeId);
        });
      }}
    >
      {isActive ? t("activeLens") : t("useLens")}
    </Button>
  );
}
