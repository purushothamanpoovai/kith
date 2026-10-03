import {
  countAuthorFollowers,
  countOrganizationFollowers,
  countScopeFollowers,
  deactivateAuthorSubscription,
  deactivateOrganizationSubscription,
  deactivateScopeSubscription,
  getAuthorSubscription,
  getOrganizationSubscription,
  getSubscription,
  listAuthorFollowers,
  listFollowedAuthorIds,
  listScopeFollowers,
  listSubscribedOrganizationIds,
  listUserSubscriptions,
  upsertAuthorSubscription,
  upsertOrganizationSubscription,
  upsertScopeSubscription,
} from "@/repositories/subscription-repository";

export async function getUserSubscriptions(userId: string) {
  return listUserSubscriptions(userId);
}

export async function isSubscribedToScope(userId: string, scopeId: string) {
  const sub = await getSubscription(userId, scopeId);
  return Boolean(sub?.active);
}

export async function subscribeToScope(userId: string, scopeId: string) {
  return upsertScopeSubscription(userId, scopeId);
}

export async function unsubscribeFromScope(userId: string, scopeId: string) {
  return deactivateScopeSubscription(userId, scopeId);
}

export async function getScopeFollowerCount(scopeId: string) {
  return countScopeFollowers(scopeId);
}

export async function getScopeFollowers(scopeId: string, limit?: number) {
  return listScopeFollowers(scopeId, limit);
}

export async function isSubscribedToOrganization(userId: string, organizationId: string) {
  const sub = await getOrganizationSubscription(userId, organizationId);
  return Boolean(sub?.active);
}

export async function subscribeToOrganization(userId: string, organizationId: string) {
  return upsertOrganizationSubscription(userId, organizationId);
}

export async function unsubscribeFromOrganization(userId: string, organizationId: string) {
  return deactivateOrganizationSubscription(userId, organizationId);
}

export async function getSubscribedOrganizationIds(userId: string) {
  return listSubscribedOrganizationIds(userId);
}

export async function getOrganizationFollowerCount(organizationId: string) {
  return countOrganizationFollowers(organizationId);
}

export async function isFollowingAuthor(userId: string, authorId: string) {
  const sub = await getAuthorSubscription(userId, authorId);
  return Boolean(sub?.active);
}

export async function followAuthor(userId: string, authorId: string) {
  return upsertAuthorSubscription(userId, authorId);
}

export async function unfollowAuthor(userId: string, authorId: string) {
  return deactivateAuthorSubscription(userId, authorId);
}

export async function getFollowedAuthorIds(userId: string) {
  return listFollowedAuthorIds(userId);
}

export async function getAuthorFollowerCount(authorId: string) {
  return countAuthorFollowers(authorId);
}

export async function getAuthorFollowers(authorId: string, limit?: number) {
  return listAuthorFollowers(authorId, limit);
}
