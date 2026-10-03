"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { PermissionAction } from "@/domain/permissions/actions";
import { can, isSuperAdmin } from "@/services/permission-service";
import { getCurrentUser } from "@/services/auth-service";
import { getOrganizationById } from "@/repositories/organization-repository";
import {
  createArticle,
  inferAuthorScopeIds,
} from "@/repositories/content-write-repository";
import {
  estimateReadingMinutes,
  htmlToPlainText,
  sanitizeArticleHtml,
} from "@/lib/sanitize-html";
import { parseTagInput, resolveTagIds } from "@/services/tag-service";
import { isAllowedBackgroundPreset } from "@/domain/theme/backgrounds";

/**
 * Publishing actions (§publishing).
 *
 * This is the trust boundary for writer input. Everything crossing it is
 * treated as hostile until proven otherwise:
 *
 *   - the actor is authenticated and holds CONTENT_CREATE;
 *   - the body is sanitised here, not in the client, because a client-side
 *     sanitiser is only a convenience — the request can be replayed directly;
 *   - the audience scopes are derived from the author's own profile (or, when
 *     publishing on behalf of an organization, from that organization's own
 *     profile) and are never read from the submitted form, so a crafted
 *     request cannot address a community the writer does not belong to;
 *   - an `organizationId` in the request is only ever a *claim*: it is
 *     re-checked against the actor's real memberships via `can()` before it
 *     is allowed to attribute the piece to that organization, so a writer
 *     cannot publish as an organization they do not belong to by editing the
 *     request;
 *   - the background preset is checked against a fixed key list rather than
 *     stored as arbitrary CSS.
 */

const MAX_TITLE_LENGTH = 200;
const MAX_SUMMARY_LENGTH = 400;
/** Generous, but bounded — an unbounded body is a memory-exhaustion vector. */
const MAX_BODY_BYTES = 512 * 1024;

export type CreateArticleResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function createArticleAction(input: {
  title: string;
  summary?: string;
  bodyHtml: string;
  tags: string[];
  coverImage?: string | null;
  backgroundPreset?: string | null;
  publish: boolean;
  /**
   * The organization to publish this as, or omitted/null to publish as the
   * signed-in writer. Only a claim from the client — `can()` below re-checks
   * it against the actor's real memberships before it has any effect.
   */
  organizationId?: string | null;
}): Promise<CreateArticleResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "auth_required" };

  const organizationId = input.organizationId || undefined;
  const permissionContext = organizationId ? { organizationId } : {};

  if (!(await can(user, PermissionAction.CONTENT_CREATE, permissionContext))) {
    return { ok: false, error: "not_authorized" };
  }
  // Publishing is a separate grant from drafting.
  if (
    input.publish &&
    !(await can(user, PermissionAction.CONTENT_PUBLISH, permissionContext))
  ) {
    return { ok: false, error: "not_authorized_publish" };
  }

  // The membership check above only confirms the actor may act *as* this
  // organization; the organization itself still has to exist so its scopes
  // can be resolved below and so `ownerOrganizationId` cannot point at a
  // deleted or otherwise stale id.
  const organization = organizationId
    ? await getOrganizationById(organizationId)
    : null;
  if (organizationId && !organization) {
    return { ok: false, error: "organization_not_found" };
  }

  const title = (input.title ?? "").trim().slice(0, MAX_TITLE_LENGTH);
  if (!title) return { ok: false, error: "title_required" };

  if (typeof input.bodyHtml !== "string") {
    return { ok: false, error: "body_required" };
  }
  if (Buffer.byteLength(input.bodyHtml, "utf8") > MAX_BODY_BYTES) {
    return { ok: false, error: "body_too_large" };
  }

  // The single authoritative sanitisation pass for stored content.
  const bodyHtml = sanitizeArticleHtml(input.bodyHtml);
  if (!htmlToPlainText(bodyHtml)) {
    return { ok: false, error: "body_required" };
  }

  const summary = (input.summary ?? "").trim().slice(0, MAX_SUMMARY_LENGTH);
  const locale = await getLocale();

  const tagIds = await resolveTagIds(parseTagInput(input.tags ?? []));
  // Audience comes from a profile, never from the submitted form: the
  // organization's own scopes when publishing on its behalf (its traditions,
  // languages and regions are what the piece should reach), otherwise the
  // individual author's focus fields.
  const scopeIds = organization
    ? organization.scopeIds
    : await inferAuthorScopeIds(user.id);

  const backgroundPreset =
    input.backgroundPreset && isAllowedBackgroundPreset(input.backgroundPreset)
      ? input.backgroundPreset
      : null;

  // Low-liability review gate: an individually-authored piece (no
  // organization) never reaches the public web on the writer's own say-so,
  // even once CONTENT_PUBLISH is granted — it lands in pending_review for a
  // super admin to promote. A verified organization's own writers remain
  // trusted to publish directly, same as today; the gate exists specifically
  // for the un-moderated "anyone with content_publisher" case. A super admin
  // submitting through this same form still gets to publish immediately —
  // they're the approver, not someone who needs approving.
  const requestedStatus: "draft" | "published" | "pending_review" = !input.publish
    ? "draft"
    : organization || isSuperAdmin(user.role)
      ? "published"
      : "pending_review";

  try {
    const content = await createArticle({
      authorId: user.id,
      type: "article",
      status: requestedStatus,
      title,
      summary: summary || undefined,
      bodyHtml,
      locale,
      coverImage: sanitizeMediaPath(input.coverImage),
      backgroundPreset,
      readingMinutes: estimateReadingMinutes(bodyHtml),
      scopeIds,
      tagIds,
      ownerOrganizationId: organization?.id ?? null,
    });

    revalidatePath("/", "layout");
    return { ok: true, slug: content.slug };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}

/**
 * Media paths are only ever accepted in the shape this app's own upload route
 * produces (`/media/<file>`), so a crafted value cannot point an <img> at an
 * off-site tracker or a `javascript:` URL.
 */
function sanitizeMediaPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!/^\/media\/[A-Za-z0-9._-]+$/.test(value)) return null;
  if (value.includes("..")) return null;
  return value;
}
