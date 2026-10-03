import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/services/auth-service";
import { resolveNavigation } from "@/services/navigation-service";
import { NavLink } from "@/components/layout/nav-link";
import { NavIcon } from "@/components/icons/nav-icon";

/**
 * Bottom navigation (§14, §15).
 *
 * Home, Explore, Community, Events, Create — with Create present only for
 * viewers who may publish, so the bar has four or five items and never a dead
 * entry. My Space and Settings live in the header drawer instead. Labels stay
 * visible: an icon-only bar is unusable for a reader who does not already
 * know the product.
 */
export async function MobileNav() {
  const t = await getTranslations("nav");
  const user = await getCurrentUser();
  const nav = await resolveNavigation(user);

  return (
    <nav className="ds-mobile-nav" aria-label={t("mobile")}>
      {nav.mobile.map((item) => (
        <NavLink
          key={item.key}
          href={item.href}
          className="ds-mobile-nav__link"
          exact={item.href === "/"}
        >
          <NavIcon
            name={item.key}
            className="ds-mobile-nav__icon"
            strokeWidth={1.75}
          />
          <span className="ds-mobile-nav__label">{t(item.key)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
