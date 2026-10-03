"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { sanitizeRedirectTarget } from "@/lib/redirect-target";
import { signInAction } from "./actions";

export function SignInForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="ds-auth-form"
      action={async (formData) => {
        setError(null);
        const code = await signInAction(formData);
        if (code) {
          setError(code === "rate_limited" ? t("rateLimited") : t("invalid"));
          return;
        }
        const target = sanitizeRedirectTarget(searchParams.get("redirect"), "/my-space");
        router.replace(target as `/${string}`);
        router.refresh();
      }}
    >
      <Field id="signin-email" label={t("email")}>
        <input
          id="signin-email"
          className="ds-input"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </Field>
      <Field id="signin-password" label={t("password")}>
        <input
          id="signin-password"
          className="ds-input"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      {/* A form-level failure ("wrong credentials", "rate limited") belongs to
          the form, not to the password field — attaching it there implied the
          password specifically was malformed, and a screen reader announced it
          as that field's error (P5, P6). */}
      {error ? (
        <p className="ds-field__message ds-field__message--error" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" block>
        {t("submitSignIn")}
      </Button>
      <p className="ds-auth-form__row">
        {t("noAccount")}{" "}
        <Link
          href={
            searchParams.get("redirect")
              ? (`/register?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` as `/${string}`)
              : "/register"
          }
        >
          {t("submitRegister")}
        </Link>
      </p>
      <p className="ds-auth-form__hint">{t("demoHint")}</p>
    </form>
  );
}
