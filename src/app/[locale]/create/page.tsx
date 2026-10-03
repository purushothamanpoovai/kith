import { PenLine } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { PageFrame } from "@/components/layout/page-frame";
import { ArticleComposer } from "@/components/editor/article-composer";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/services/auth-service";
import { canPublishAny, getPublishingOrganizations } from "@/services/permission-service";

type PageProps = { params: Promise<{ locale: string }> };

/**
 * Publisher Studio — the composer's page shell.
 *
 * The organization the piece publishes under is chosen inside the composer
 * itself (§publishing), next to Tags and Background: it is one property of
 * the draft, not a page-level preamble the writer reads through before
 * reaching the actual writing surface. This page's only job is the gate —
 * confirming the visitor may publish at all — and everything past that is
 * the composer.
 */
export default async function CreatePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("create");
  const user = await getCurrentUser();

  if (!user) {
    redirect({ href: "/login", locale });
  }

  const canPublish = await canPublishAny(user);
  if (!canPublish) {
    return (
      <PageFrame eyebrow={t("eyebrow")} title={t("title")} lede={t("memberLede")}>
        <EmptyState
          title={t("memberTitle")}
          body={t("memberBody")}
          mark={<PenLine size={26} strokeWidth={1.25} />}
          actions={
            <ButtonLink href="/explore" variant="primary">
              {t("exploreLink")}
            </ButtonLink>
          }
          as="h2"
        />
      </PageFrame>
    );
  }

  const organizations = await getPublishingOrganizations(user);

  return (
    <PageFrame title={t("publisherTitle")} lede={t("publisherLede")} compact>
      <ArticleComposer
        organizations={organizations}
        locale={locale}
        authorName={user.name}
      />
    </PageFrame>
  );
}
