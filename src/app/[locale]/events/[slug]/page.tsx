import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { EventDetailView } from "@/components/events/event-detail-view";
import { PageFrame } from "@/components/layout/page-frame";
import { getCurrentUser } from "@/services/auth-service";
import { getEventBySlug } from "@/services/event-service";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function EventDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  const event = await getEventBySlug(slug, user?.id);
  if (!event) notFound();

  return (
    <PageFrame>
      <EventDetailView event={event} locale={locale} signedIn={Boolean(user)} />
    </PageFrame>
  );
}
