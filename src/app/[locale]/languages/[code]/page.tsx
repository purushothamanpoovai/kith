import { ScopeType } from "@/generated/prisma/client";
import { ScopeDetailPage } from "@/components/discovery/scope-detail-page";

type PageProps = {
  params: Promise<{ locale: string; code: string }>;
  searchParams: Promise<{ kind?: string }>;
};

export default async function LanguageDetailPage({ params, searchParams }: PageProps) {
  const { locale, code } = await params;
  return (
    <ScopeDetailPage
      type={ScopeType.language}
      slug={code}
      locale={locale}
      basePath={`/languages/${code}`}
      searchParams={searchParams}
    />
  );
}
