import { getTranslations } from "next-intl/server";
import { Landmark, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { StudioOrganization, StudioScopeAssignment } from "@/services/studio-service";

/**
 * Studio's "Organizations" view (§ Studio tab, decision 3).
 *
 * A scope-moderator assignment held with no organization behind it (a public
 * scope like "Shaivism" moderated independently) is a real, distinct kind of
 * "thing I manage" — it gets its own card shape rather than being squeezed
 * into the organization-card layout, which assumes a slug/crest/manage link
 * that a bare scope assignment doesn't have.
 */
export async function StudioOrganizations({
  organizations,
  scopeAssignments,
}: {
  organizations: StudioOrganization[];
  scopeAssignments: StudioScopeAssignment[];
}) {
  const t = await getTranslations("mySpace.studio");
  const tRoles = await getTranslations("organizations.memberRole");

  if (organizations.length === 0 && scopeAssignments.length === 0) {
    return (
      <EmptyState
        title={t("emptyOrgsTitle")}
        body={t("emptyOrgsBody")}
        mark={<Landmark size={26} strokeWidth={1.25} />}
        inline
      />
    );
  }

  return (
    <div className="ds-grid ds-grid--2">
      {organizations.map((org) => (
        <Card key={org.organizationId} className="ds-studio-org-card">
          <Avatar name={org.organizationName} kind="organization" size="lg" />
          <div className="ds-studio-org-card__body">
            <p className="ds-manage-row__title">{org.organizationName}</p>
            <Badge tone="accent">{tRoles(org.role)}</Badge>
          </div>
          <Link
            href={`/org/${org.organizationSlug}/manage` as `/${string}`}
            className="ds-text-link"
          >
            {t("manageLink")}
          </Link>
        </Card>
      ))}
      {scopeAssignments.map((assignment) => (
        <Card key={assignment.scopeId} className="ds-studio-org-card">
          <span className="ds-avatar ds-avatar--lg" aria-hidden>
            <ShieldCheck size={22} strokeWidth={1.5} />
          </span>
          <div className="ds-studio-org-card__body">
            <p className="ds-manage-row__title">{assignment.scopeTitle}</p>
            <Badge tone="neutral">{t("scopeModeratorBadge")}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
