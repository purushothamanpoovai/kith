"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { sanitizeRedirectTarget } from "@/lib/redirect-target";
import { registerAction } from "./actions";

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="ds-auth-form"
      action={async (formData) => {
        setError(null);
        const code = await registerAction(formData);
        if (code) {
          const messages: Record<string, string> = {
            email_taken: t("emailTaken"),
            invalid_input: t("invalidInput"),
            rate_limited: t("rateLimited"),
          };
          setError(messages[code] ?? t("invalid"));
          return;
        }
        const target = sanitizeRedirectTarget(searchParams.get("redirect"), "/my-space");
        router.replace(target as `/${string}`);
        router.refresh();
      }}
    >
      <Field id="register-name" label={t("name")}>
        <input
          id="register-name"
          className="ds-input"
          name="name"
          type="text"
          autoComplete="name"
          required
        />
      </Field>
      <Field id="register-email" label={t("email")}>
        <input
          id="register-email"
          className="ds-input"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </Field>
      <Field id="register-password" label={t("password")} hint={t("passwordHint")}>
        <input
          id="register-password"
          className="ds-input"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          aria-describedby="register-password-hint"
        />
      </Field>
      {/* Form-level, for the same reason as sign-in: "email already taken" is
          not a fault of the password field it used to be rendered under. */}
      {error ? (
        <p className="ds-field__message ds-field__message--error" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" block>
        {t("submitRegister")}
      </Button>
      <p className="ds-auth-form__row">
        {t("hasAccount")}{" "}
        <Link
          href={
            searchParams.get("redirect")
              ? (`/login?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` as `/${string}`)
              : "/login"
          }
        >
          {t("submitSignIn")}
        </Link>
      </p>
    </form>
  );
}
