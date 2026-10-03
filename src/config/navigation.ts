export type NavItemKey =
  | "home"
  | "explore"
  | "community"
  | "events"
  | "create"
  | "mySpace"
  | "search"
  | "settings";

export type NavItem = {
  key: NavItemKey;
  href: `/${string}` | "/";
};

/**
 * Desktop header — primary discovery and community routes.
 *
 * Media has no nav item of its own: audio, video, poems and heritage are
 * reached by filtering a scope page (a religion, tradition, topic…), not by
 * visiting a standalone "media library" — the same way Quora/Reddit let you
 * narrow a community's feed by post type instead of sending you to a
 * separate destination. `/media/[slug]` detail pages still work; only the
 * index page and its nav entry are gone (§ discovery unification).
 */
/**
 * "My Space" is listed here, not filtered out for a visitor at this
 * constant — `resolveNavigation` drops it (and it alone) for a signed-out
 * viewer, the same mechanism `UTILITY_NAV` already uses for `create`/`settings`.
 */
export const PRIMARY_NAV: NavItem[] = [
  { key: "home", href: "/" },
  { key: "explore", href: "/explore" },
  { key: "community", href: "/community" },
  { key: "events", href: "/events" },
  { key: "mySpace", href: "/my-space" },
];

/** Header utility links (not duplicated on mobile bottom bar). */
export const UTILITY_NAV: NavItem[] = [
  { key: "create", href: "/create" },
  { key: "settings", href: "/settings" },
];

/**
 * Mobile bottom navigation.
 *
 * Capped at five items so each keeps a real tap target on a phone: Home,
 * Explore, Community and Events always show — desktop's primary-nav
 * content-browsing destinations — and "Create" fills the fifth slot for
 * anyone who can publish. My Space and Settings live in the drawer, the same
 * tier. Media has no entry of its own — see the note on `PRIMARY_NAV`.
 */
export const MOBILE_NAV: NavItem[] = [
  { key: "home", href: "/" },
  { key: "explore", href: "/explore" },
  { key: "community", href: "/community" },
  { key: "events", href: "/events" },
  { key: "create", href: "/create" },
];
