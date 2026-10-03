"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleScopeSubscriptionAction } from "@/app/actions/subscription-actions";
import { Button } from "@/components/ui/button";

type Props = {
  scopeId: string;
  subscribed: boolean;
  signedIn: boolean;
};

export function ScopeSubscribeButton({ scopeId, subscribed, signedIn }: Props) {
  const t = useTranslations("scopeContext");
  const [pending, startTransition] = useTransition();

  if (!signedIn) return null;

  return (
    <Button
      variant={subscribed ? "ghost" : "primary"}
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          void toggleScopeSubscriptionAction(scopeId);
        });
      }}
    >
      {subscribed ? t("unsubscribe") : t("follow")}
    </Button>
  );
}
