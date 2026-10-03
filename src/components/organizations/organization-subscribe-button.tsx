"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleOrganizationSubscriptionAction } from "@/app/actions/subscription-actions";
import { Button, ButtonLink } from "@/components/ui/button";

type Props = {
  organizationId: string;
  subscribed: boolean;
  signedIn: boolean;
};

export function OrganizationSubscribeButton({
  organizationId,
  subscribed,
  signedIn,
}: Props) {
  const t = useTranslations("organizations");
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <ButtonLink href="/login" variant="primary" size="sm">
        {t("signInToFollow")}
      </ButtonLink>
    );
  }

  return (
    <Button
      variant={subscribed ? "ghost" : "primary"}
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          void toggleOrganizationSubscriptionAction(organizationId);
        });
      }}
    >
      {subscribed ? t("followingLabel") : t("followLabel")}
    </Button>
  );
}
