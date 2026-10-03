"use server";

import { revalidatePath } from "next/cache";
import { setActiveScopeId } from "@/lib/scope-context";
import { getCurrentUser } from "@/services/auth-service";
import {
  followAuthor,
  isFollowingAuthor,
  isSubscribedToOrganization,
  isSubscribedToScope,
  subscribeToOrganization,
  subscribeToScope,
  unfollowAuthor,
  unsubscribeFromOrganization,
  unsubscribeFromScope,
} from "@/services/subscription-service";

export async function setScopeContextAction(scopeId: string | null) {
  await setActiveScopeId(scopeId);
  revalidatePath("/", "layout");
}

export async function toggleScopeSubscriptionAction(scopeId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, subscribed: false };
  const subscribed = await isSubscribedToScope(user.id, scopeId);
  if (subscribed) {
    await unsubscribeFromScope(user.id, scopeId);
    revalidatePath("/", "layout");
    return { ok: true as const, subscribed: false };
  }
  await subscribeToScope(user.id, scopeId);
  revalidatePath("/", "layout");
  return { ok: true as const, subscribed: true };
}

export async function toggleOrganizationSubscriptionAction(organizationId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, subscribed: false };
  const subscribed = await isSubscribedToOrganization(user.id, organizationId);
  if (subscribed) {
    await unsubscribeFromOrganization(user.id, organizationId);
    revalidatePath("/", "layout");
    return { ok: true as const, subscribed: false };
  }
  await subscribeToOrganization(user.id, organizationId);
  revalidatePath("/", "layout");
  return { ok: true as const, subscribed: true };
}

export async function toggleAuthorFollowAction(authorId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, following: false };
  const following = await isFollowingAuthor(user.id, authorId);
  if (following) {
    await unfollowAuthor(user.id, authorId);
    revalidatePath("/community");
    return { ok: true as const, following: false };
  }
  await followAuthor(user.id, authorId);
  revalidatePath("/community");
  return { ok: true as const, following: true };
}
