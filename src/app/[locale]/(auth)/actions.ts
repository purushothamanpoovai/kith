"use server";

import { getLocale } from "next-intl/server";
import { registerAccount, signIn, signOut } from "@/services/auth-service";

export async function signInAction(formData: FormData) {
  const result = await signIn({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  return result.ok ? null : result.error;
}

export async function registerAction(formData: FormData) {
  const locale = await getLocale();
  const result = await registerAccount({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    name: String(formData.get("name") ?? ""),
    locale,
  });
  return result.ok ? null : result.error;
}

export async function signOutAction() {
  await signOut();
}
