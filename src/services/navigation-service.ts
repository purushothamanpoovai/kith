import type { AuthUser } from "@/lib/permissions";
import { canPublishAny, isSuperAdmin } from "@/lib/permissions";
import {
  PRIMARY_NAV,
  UTILITY_NAV,
  MOBILE_NAV,
  type NavItem,
} from "@/config/navigation";

export type ResolvedNav = {
  primary: NavItem[];
  utility: NavItem[];
  mobile: NavItem[];
  showPublisherStudio: boolean;
  showAdmin: boolean;
  showOrgDashboard: boolean;
  orgDashboardSlug?: string;
};

export async function resolveNavigation(user: AuthUser | null): Promise<ResolvedNav> {
  const canPublish = await canPublishAny(user);
  const isAdmin = user ? isSuperAdmin(user.role) || user.role === "admin" : false;

  const primary = PRIMARY_NAV.filter((item) => {
    if (item.key === "mySpace") return Boolean(user);
    return true;
  });

  const utility = UTILITY_NAV.filter((item) => {
    if (item.key === "create") return canPublish;
    if (item.key === "settings") return Boolean(user);
    return true;
  });

  const mobile = MOBILE_NAV.filter((item) => {
    if (item.key === "create") return canPublish;
    return true;
  });

  let orgDashboardSlug: string | undefined;
  if (user) {
    const { loadUserPermissionProfile } = await import("@/services/permission-service");
    const profile = await loadUserPermissionProfile(user);
    const adminOrg = profile.organizationMemberships.find((m) => m.role === "org_admin");
    orgDashboardSlug = adminOrg?.organizationSlug;
  }

  return {
    primary,
    utility,
    mobile,
    showPublisherStudio: canPublish,
    showAdmin: isAdmin,
    showOrgDashboard: Boolean(orgDashboardSlug),
    orgDashboardSlug,
  };
}
