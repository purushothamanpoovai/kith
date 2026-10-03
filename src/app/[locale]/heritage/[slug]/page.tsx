import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { HeritageView } from "@/components/heritage/heritage-view";
import { PageFrame } from "@/components/layout/page-frame";
import { getCurrentUser } from "@/services/auth-service";
import { getHeritageBySlug } from "@/services/heritage-service";
import { isPubliclyReadable } from "@/services/permission-service";
import { sanitizeRedirectTarget } from "@/lib/redirect-target";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function HeritageDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  const item = await getHeritageBySlug(slug);
  if (!item) notFound();

  const returnPath = sanitizeRedirectTarget(`/${locale}/heritage/${item.slug}`);
  const signInHref = `/login?redirect=${encodeURIComponent(returnPath)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(returnPath)}`;
  const readerSignedIn = Boolean(user) || isPubliclyReadable(item);

  return (
    <PageFrame>
      <HeritageView
        item={item}
        locale={locale}
        signedIn={readerSignedIn}
        signInHref={signInHref}
        registerHref={registerHref}
      />
    </PageFrame>
  );
}
