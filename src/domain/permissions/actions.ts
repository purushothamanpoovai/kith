/** Central permission actions — used by UI and server authorization. */
export const PermissionAction = {
  // Read (public)
  CONTENT_READ_PUBLIC: "content:read:public",

  // Community participant
  CONTENT_REACT: "content:react",
  CONTENT_COMMENT: "content:comment",
  CONTENT_BOOKMARK: "content:bookmark",
  CONTENT_REPOST: "content:repost",
  SCOPE_REACT: "scope:react",
  SCOPE_COMMENT: "scope:comment",
  SCOPE_SUBSCRIBE: "scope:subscribe",
  ORGANIZATION_SUBSCRIBE: "organization:subscribe",
  EVENT_RSVP: "event:rsvp",
  INVITATION_CREATE: "invitation:create",

  // Publishing
  CONTENT_CREATE: "content:create",
  CONTENT_PUBLISH: "content:publish",
  CONTENT_EDIT: "content:edit",
  CONTENT_DELETE: "content:delete",
  EVENT_CREATE: "event:create",
  EVENT_MANAGE: "event:manage",
  MEDIA_UPLOAD: "media:upload",

  // Organization
  ORGANIZATION_MANAGE: "organization:manage",
  ORGANIZATION_CREATE: "organization:create",
  ORGANIZATION_VERIFY: "organization:verify",
  ORGANIZATION_ASSIGN_ROLES: "organization:assign_roles",

  // Platform admin
  ADMIN_ACCESS: "admin:access",
  MODERATION_ACT: "moderation:act",
  USER_MANAGE: "user:manage",
  ROLE_ASSIGN: "role:assign",
} as const;

export type PermissionAction = (typeof PermissionAction)[keyof typeof PermissionAction];

export type PermissionContext = {
  scopeId?: string;
  scopeIds?: string[];
  organizationId?: string;
  contentId?: string;
  eventId?: string;
  targetUserId?: string;
};

export type PublishingContext = {
  organizationId?: string | null;
  scopeIds: string[];
};
