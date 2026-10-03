import type {
  OrganizationMemberRole,
  ScopeModeratorPermission,
  UserRole,
} from "@/generated/prisma/client";
import type { AuthUser } from "@/domain/auth/types";
import {
  PermissionAction,
  type PermissionContext,
} from "@/domain/permissions/actions";
import { prisma } from "@/lib/db";

export type UserPermissionProfile = {
  user: AuthUser;
  scopeModeratorScopes: Array<{
    scopeId: string;
    organizationId: string | null;
    permissions: ScopeModeratorPermission[];
  }>;
  organizationMemberships: Array<{
    organizationId: string;
    organizationSlug: string;
    organizationName: Record<string, string>;
    role: OrganizationMemberRole;
    active: boolean;
  }>;
};

const SUPER_ADMIN_ROLES: UserRole[] = ["super_admin", "admin"];
const LEGACY_STAFF_ROLES: UserRole[] = ["global_moderator"];
const LEGACY_PUBLISHER_ROLES: UserRole[] = ["contributor", "content_publisher", "scope_moderator"];

export function isSuperAdmin(role: UserRole): boolean {
  return SUPER_ADMIN_ROLES.includes(role);
}

export function isLegacyStaff(role: UserRole): boolean {
  return LEGACY_STAFF_ROLES.includes(role);
}

export function normalizePlatformRole(role: UserRole): "visitor" | "member" | "publisher" | "super_admin" {
  if (isSuperAdmin(role) || isLegacyStaff(role)) return "super_admin";
  if (role === "content_publisher" || LEGACY_PUBLISHER_ROLES.includes(role)) return "publisher";
  if (role === "user" || role === "community_moderator") return "member";
  return "member";
}

export async function loadUserPermissionProfile(
  user: AuthUser,
): Promise<UserPermissionProfile> {
  const [scopeMods, memberships] = await Promise.all([
    prisma.scopeModerator.findMany({
      where: { userId: user.id },
      select: {
        scopeId: true,
        organizationId: true,
        permissions: true,
      },
    }),
    prisma.organizationMembership.findMany({
      where: { userId: user.id, active: true },
      include: {
        organization: { select: { id: true, slug: true, name: true } },
      },
    }),
  ]);

  return {
    user,
    scopeModeratorScopes: scopeMods,
    organizationMemberships: memberships.map((m) => ({
      organizationId: m.organizationId,
      organizationSlug: m.organization.slug,
      organizationName: m.organization.name as Record<string, string>,
      role: m.role,
      active: m.active,
    })),
  };
}

async function scopeCoversDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
  if (ancestorId === descendantId) return true;
  const row = await prisma.scopeClosure.findUnique({
    where: {
      ancestorId_descendantId: { ancestorId, descendantId },
    },
  });
  return Boolean(row);
}

async function userCoversScope(
  profile: UserPermissionProfile,
  scopeId: string,
  organizationId?: string,
): Promise<boolean> {
  for (const mod of profile.scopeModeratorScopes) {
    if (mod.organizationId && organizationId && mod.organizationId !== organizationId) {
      continue;
    }
    if (mod.organizationId && !organizationId) {
      continue;
    }
    if (await scopeCoversDescendant(mod.scopeId, scopeId)) {
      return true;
    }
  }
  return false;
}

function orgRoleCanPublish(role: OrganizationMemberRole): boolean {
  return role === "org_admin" || role === "content_moderator";
}

function orgRoleCanManageOrg(role: OrganizationMemberRole): boolean {
  return role === "org_admin";
}

function orgRoleCanManageEvents(role: OrganizationMemberRole): boolean {
  return role === "org_admin" || role === "event_manager";
}

function orgRoleCanManageMedia(role: OrganizationMemberRole): boolean {
  return role === "org_admin" || role === "media_manager" || role === "content_moderator";
}

export async function can(
  user: AuthUser | null,
  action: PermissionAction,
  context: PermissionContext = {},
): Promise<boolean> {
  // Public read — visitors allowed
  if (action === PermissionAction.CONTENT_READ_PUBLIC) {
    return true;
  }

  if (!user) {
    return false;
  }

  // Super admin (and legacy staff) run the platform and moderate it — they
  // are not a writer. Granting every action here used to include authoring
  // (CONTENT_CREATE/PUBLISH/EDIT, EVENT_CREATE/MANAGE, MEDIA_UPLOAD): a
  // platform admin could publish articles, run events, and upload media
  // under any organization, which is a role they never asked for and that
  // muddies "who actually wrote this". Content/event/media authoring is
  // deliberately excluded below and falls through to the same per-org/
  // per-scope checks every other user goes through — a super admin authors
  // nothing unless they separately hold a real authoring role, same as
  // anyone else. Reading anything (`canViewContent`), platform administration
  // (`ADMIN_ACCESS`), and moderation (`MODERATION_ACT`) remain unconditional.
  const isPlatformStaff = isSuperAdmin(user.role) || isLegacyStaff(user.role);
  const AUTHORING_ACTIONS: PermissionAction[] = [
    PermissionAction.CONTENT_CREATE,
    PermissionAction.CONTENT_PUBLISH,
    PermissionAction.CONTENT_EDIT,
    PermissionAction.EVENT_CREATE,
    PermissionAction.EVENT_MANAGE,
    PermissionAction.MEDIA_UPLOAD,
  ];
  if (isPlatformStaff && !AUTHORING_ACTIONS.includes(action)) {
    return true;
  }

  const profile = await loadUserPermissionProfile(user);

  switch (action) {
    case PermissionAction.CONTENT_REACT:
    case PermissionAction.CONTENT_BOOKMARK:
    case PermissionAction.SCOPE_REACT:
    case PermissionAction.SCOPE_SUBSCRIBE:
    case PermissionAction.ORGANIZATION_SUBSCRIBE:
    case PermissionAction.EVENT_RSVP:
    case PermissionAction.INVITATION_CREATE:
    case PermissionAction.PRIVATE_NOTE_WRITE:
    case PermissionAction.BOOKMARK_FOLDER_MANAGE:
      return true;

    case PermissionAction.ORGANIZATION_CREATE:
    case PermissionAction.ORGANIZATION_VERIFY:
    case PermissionAction.ADMIN_ACCESS:
    case PermissionAction.USER_MANAGE:
    case PermissionAction.ROLE_ASSIGN:
      return false;

    case PermissionAction.ORGANIZATION_MANAGE:
    case PermissionAction.ORGANIZATION_ASSIGN_ROLES:
      if (!context.organizationId) return false;
      return profile.organizationMemberships.some(
        (m) => m.organizationId === context.organizationId && orgRoleCanManageOrg(m.role),
      );

    case PermissionAction.CONTENT_CREATE:
    case PermissionAction.CONTENT_PUBLISH:
    case PermissionAction.CONTENT_EDIT: {
      if (context.organizationId) {
        const membership = profile.organizationMemberships.find(
          (m) => m.organizationId === context.organizationId,
        );
        if (membership && orgRoleCanPublish(membership.role)) {
          if (context.scopeId) {
            return userCoversScope(profile, context.scopeId, context.organizationId);
          }
          return true;
        }
      }
      // Public scope publisher (no org)
      if (context.scopeId) {
        return userCoversScope(profile, context.scopeId, undefined);
      }
      if (user.role === "content_publisher" || user.role === "contributor") {
        return profile.scopeModeratorScopes.some((s) => !s.organizationId);
      }
      return false;
    }

    case PermissionAction.EVENT_CREATE:
    case PermissionAction.EVENT_MANAGE:
      if (!context.organizationId) {
        return profile.organizationMemberships.some((m) => orgRoleCanManageEvents(m.role));
      }
      return profile.organizationMemberships.some(
        (m) => m.organizationId === context.organizationId && orgRoleCanManageEvents(m.role),
      );

    case PermissionAction.MEDIA_UPLOAD:
      if (!context.organizationId) return false;
      return profile.organizationMemberships.some(
        (m) => m.organizationId === context.organizationId && orgRoleCanManageMedia(m.role),
      );

    case PermissionAction.MODERATION_ACT:
      return profile.organizationMemberships.some((m) =>
        ["org_admin", "content_moderator"].includes(m.role),
      ) || profile.scopeModeratorScopes.some((s) => s.permissions.includes("moderate"));

    case PermissionAction.CONTENT_DELETE: {
      if (context.organizationId) {
        const membership = profile.organizationMemberships.find(
          (m) => m.organizationId === context.organizationId,
        );
        if (membership && orgRoleCanPublish(membership.role)) return true;
      }
      if (context.scopeId) {
        return userCoversScope(profile, context.scopeId, context.organizationId);
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Whether a viewer may open a specific piece of content directly by its URL.
 *
 * Published, public content is open to everyone — that's the whole point of
 * publishing. A draft (or anything else not yet public) is not: it exists
 * only so its author, or a co-worker at the organization it will be
 * published under, can read it back before it goes live — including as a
 * "preview" step from the composer. Nobody else should be able to open it
 * just by guessing or sharing its slug.
 */
export async function canViewContent(
  user: AuthUser | null,
  content: {
    status: string;
    authorId: string;
    ownerOrganizationId?: string | null;
  },
): Promise<boolean> {
  if (content.status === "published") {
    return true;
  }
  if (!user) return false;
  if (isSuperAdmin(user.role) || isLegacyStaff(user.role)) return true;
  if (content.authorId === user.id) return true;
  if (!content.ownerOrganizationId) return false;
  const profile = await loadUserPermissionProfile(user);
  return profile.organizationMemberships.some(
    (m) => m.organizationId === content.ownerOrganizationId && m.active,
  );
}

/**
 * Whether an ANONYMOUS visitor may read a piece of content in full, once
 * `canViewContent` has already cleared it (published, not a private draft).
 *
 * Login is now the default: only content whose author explicitly marked it
 * `visibility: "public"` is free to read without an account. Everything
 * else — followers/community/family/private — requires signing in, even
 * though it may be perfectly "published". Signed-in readers are unaffected;
 * this only narrows what an anonymous visitor sees.
 */
export function isPubliclyReadable(content: { visibility: string }): boolean {
  return content.visibility === "public";
}

/**
 * Whether the signed-in visitor can write anything at all — drives whether
 * "Create" appears in navigation. Deliberately does NOT grant this to a
 * super admin: running the platform is not the same job as being a writer,
 * and a platform admin who also happens to hold a real scope-moderator or
 * org-publisher role still sees Create for that reason, same as anyone else.
 */
export async function canPublishAny(user: AuthUser | null): Promise<boolean> {
  if (!user) return false;
  const profile = await loadUserPermissionProfile(user);
  if (profile.scopeModeratorScopes.length > 0) return true;
  return profile.organizationMemberships.some((m) => orgRoleCanPublish(m.role));
}

export async function getPublishingOrganizations(user: AuthUser | null) {
  if (!user) return [];
  const profile = await loadUserPermissionProfile(user);
  return profile.organizationMemberships.filter((m) => orgRoleCanPublish(m.role));
}

export type RoleDisplay = {
  labelKey: string;
  context?: string;
};

export async function getRoleDisplay(
  user: AuthUser | null,
  locale: string,
): Promise<RoleDisplay | null> {
  if (!user) return null;
  if (isSuperAdmin(user.role) || isLegacyStaff(user.role)) {
    return { labelKey: "roles.superAdmin" };
  }
  const profile = await loadUserPermissionProfile(user);
  const adminMembership = profile.organizationMemberships.find((m) => m.role === "org_admin");
  if (adminMembership) {
    const name =
      adminMembership.organizationName[locale] ??
      adminMembership.organizationName.en ??
      adminMembership.organizationSlug;
    return { labelKey: "roles.orgAdmin", context: name };
  }
  const modMembership = profile.organizationMemberships.find(
    (m) => m.role === "content_moderator",
  );
  if (modMembership) {
    const name =
      modMembership.organizationName[locale] ??
      modMembership.organizationName.en ??
      modMembership.organizationSlug;
    return { labelKey: "roles.orgContentModerator", context: name };
  }
  if (profile.scopeModeratorScopes.length > 0 || user.role === "content_publisher") {
    return { labelKey: "roles.contentPublisher" };
  }
  return { labelKey: "roles.communityMember" };
}
