import { redirect } from "@/i18n/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * The standalone media library is gone (§ discovery unification) — audio,
 * video and poems are now reached by filtering a scope page, not by visiting
 * a separate destination. An old `/media` link or bookmark lands on Explore
 * instead of 404ing; `/media/[slug]` detail pages are unaffected.
 */
export default async function MediaPage({ params }: PageProps) {
  const { locale } = await params;
  redirect({ href: "/explore", locale });
}
