import { ExploreHub } from "@/components/discovery/explore-hub";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ExplorePage({ params }: PageProps) {
  const { locale } = await params;
  return <ExploreHub locale={locale} />;
}
