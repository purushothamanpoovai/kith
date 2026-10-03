"use server";

import { revalidatePath } from "next/cache";
import type { ContentFocusMode } from "@/generated/prisma/client";
import type { UserPreferencesInput } from "@/domain/user/preferences";
import { getScopeById } from "@/repositories/scope-repository";
import { saveUserContentPreferences } from "@/services/preference-service";
import { getCurrentUser } from "@/services/auth-service";

export async function updatePreferencesAction(input: {
  locale: string;
  primaryLanguage: string;
  contentFocusMode: ContentFocusMode;
  focusReligionScopeId: string;
  focusLanguageScopeId: string;
  focusRegionScopeId: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "auth_required" as const };

  const payload: UserPreferencesInput = {
    locale: input.locale,
    primaryLanguage: input.primaryLanguage,
    contentFocusMode: input.contentFocusMode,
    focusReligionScopeId: input.focusReligionScopeId || null,
    focusLanguageScopeId: input.focusLanguageScopeId || null,
    focusRegionScopeId: input.focusRegionScopeId || null,
  };

  for (const [key, id] of Object.entries({
    focusReligionScopeId: payload.focusReligionScopeId,
    focusLanguageScopeId: payload.focusLanguageScopeId,
    focusRegionScopeId: payload.focusRegionScopeId,
  })) {
    if (!id) continue;
    const scope = await getScopeById(id);
    if (!scope) {
      return { ok: false as const, error: "invalid_scope" as const };
    }
    if (key === "focusReligionScopeId" && scope.type !== "religion") {
      return { ok: false as const, error: "invalid_scope" as const };
    }
    if (key === "focusLanguageScopeId" && scope.type !== "language") {
      return { ok: false as const, error: "invalid_scope" as const };
    }
    if (key === "focusRegionScopeId" && scope.type !== "region") {
      return { ok: false as const, error: "invalid_scope" as const };
    }
  }

  await saveUserContentPreferences(user.id, payload);
  revalidatePath("/", "layout");
  return { ok: true as const };
}
