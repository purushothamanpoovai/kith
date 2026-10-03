import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthPage } from "@/components/layout/auth-page";
import { SignInForm } from "../sign-in-form";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <AuthPage title={t("signInTitle")} lede={t("signInLede")}>
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </AuthPage>
  );
}
