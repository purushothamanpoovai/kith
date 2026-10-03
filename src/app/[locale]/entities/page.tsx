import { ScopeType } from "@/generated/prisma/client";
import { ScopeListPage } from "@/components/discovery/scope-list-page";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function EntitiesPage({ params }: PageProps) {
  const { locale } = await params;
  return (
    <ScopeListPage
      type={ScopeType.sacred_entity}
      locale={locale}
      messageKey="entities"
    />
  );
}
