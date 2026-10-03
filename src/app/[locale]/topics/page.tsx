import { ScopeType } from "@/generated/prisma/client";
import { ScopeListPage } from "@/components/discovery/scope-list-page";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TopicsPage({ params }: PageProps) {
  const { locale } = await params;
  return (
    <ScopeListPage type={ScopeType.topic} locale={locale} messageKey="topics" />
  );
}
