import { ScopeType } from "@/generated/prisma/client";
import { ScopeDetailPage } from "@/components/discovery/scope-detail-page";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ kind?: string }>;
};

export default async function RegionDetailPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  return (
    <ScopeDetailPage
      type={ScopeType.region}
      slug={slug}
      locale={locale}
      basePath={`/regions/${slug}`}
      searchParams={searchParams}
    />
  );
}
