import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { InvitationView } from "@/components/events/invitation-view";
import { PageFrame } from "@/components/layout/page-frame";
import { getInvitationBySlug } from "@/services/event-service";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function InvitationPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const data = await getInvitationBySlug(slug);
  if (!data) notFound();

  return (
    <PageFrame>
      <InvitationView
        hostName={data.invitation.hostName}
        message={(data.invitation.message as Record<string, string> | null) ?? null}
        event={data.event}
        locale={locale}
      />
    </PageFrame>
  );
}
