import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthPage } from "@/components/layout/auth-page";
import { RegisterForm } from "../register-form";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <AuthPage title={t("registerTitle")} lede={t("registerLede")}>
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthPage>
  );
}
