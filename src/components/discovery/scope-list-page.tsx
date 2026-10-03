import { getTranslations, setRequestLocale } from "next-intl/server";
import { Compass } from "lucide-react";
import type { ScopeType } from "@/generated/prisma/client";
import { PageFrame } from "@/components/layout/page-frame";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { ScopeCardGrid } from "@/components/discovery/scope-card";
import { getCurrentUser } from "@/services/auth-service";
import { listScopes } from "@/services/scope-service";

type ScopeListKey =
  | "religions"
  | "traditions"
  | "entities"
  | "topics"
  | "regions"
  | "languages";

export async function ScopeListPage({
  type,
  locale,
  messageKey,
}: {
  type: ScopeType;
  locale: string;
  messageKey: ScopeListKey;
}) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const user = await getCurrentUser();
  const scopes = await listScopes(type, locale, user?.id);

  return (
    <PageFrame
      eyebrow={t("scopes.eyebrow")}
      title={t(`scopes.${messageKey}`)}
      lede={t(`scopes.${messageKey}Lede`)}
    >
      {scopes.length === 0 ? (
        <EmptyState
          title={t("scopes.emptyTitle")}
          body={t("scopes.emptyBody")}
          mark={<Compass size={26} strokeWidth={1.25} />}
          actions={
            <ButtonLink href="/explore" variant="secondary">
              {t("states.exploreAction")}
            </ButtonLink>
          }
          as="h2"
        />
      ) : (
        <ScopeCardGrid scopes={scopes} locale={locale} />
      )}
    </PageFrame>
  );
}
