import { ScopeType } from "@/generated/prisma/client";
import { ScopeDetailPage } from "@/components/discovery/scope-detail-page";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ kind?: string }>;
};

export default async function TraditionDetailPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  return (
    <ScopeDetailPage
      type={ScopeType.tradition}
      slug={slug}
      locale={locale}
      basePath={`/traditions/${slug}`}
      searchParams={searchParams}
    />
  );
}
