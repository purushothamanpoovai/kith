import { getLocale, getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { NavLink } from "@/components/layout/nav-link";
import { HeaderMenu, type HeaderMenuItem } from "@/components/layout/header-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { HeaderAccountMenu } from "@/components/layout/header-account-menu";
import { ScopeSwitcher } from "@/components/discovery/scope-switcher";
import { NavIcon } from "@/components/icons/nav-icon";
import { BrandMark } from "@/components/icons/brand-mark";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getActiveScopeId } from "@/lib/scope-context";
import { pickLocalized } from "@/lib/localized";
import { sortLabelsAlphabetically } from "@/lib/scope-sort";
import { canAccessAdmin, type AuthUser } from "@/lib/permissions";
import { resolveNavigation } from "@/services/navigation-service";
import { getScopeById } from "@/repositories/scope-repository";
import { getUserSubscriptions } from "@/services/subscription-service";

/**
 * The masthead (§15).
 *
 * One row: brand, primary navigation, then tools. The previous header stacked
 * a utility strip over a centred wordmark, which cost 100px of vertical space
 * on every route for no navigational gain.
 *
 * Administrative entries are only ever assembled when the viewer holds the
 * permission — the drawer and the desktop bar read from the same resolved
 * navigation, so a normal member never receives the markup (§15).
 */
export async function SiteHeader({ user }: { user: AuthUser | null }) {
  const t = await getTranslations("nav");
  const tApp = await getTranslations("app");
  const locale = await getLocale();
  const activeScopeId = await getActiveScopeId();
  const nav = await resolveNavigation(user);
  const isAdmin = user ? await canAccessAdmin(user) : false;
  const subscriptions = user ? await getUserSubscriptions(user.id) : [];

  let scopeOptions = subscriptions
    .filter((sub) => sub.scopeId && sub.scopeTitle)
    .map((sub) => ({
      id: sub.scopeId!,
      label: pickLocalized(sub.scopeTitle, locale),
    }));

  if (activeScopeId && !scopeOptions.some((option) => option.id === activeScopeId)) {
    const activeScope = await getScopeById(activeScopeId);
    if (activeScope) {
      scopeOptions = [
        { id: activeScope.id, label: pickLocalized(activeScope.title, locale) },
        ...scopeOptions,
      ];
    }
  }

  scopeOptions = sortLabelsAlphabetically(scopeOptions, (option) => option.label, locale);

  const drawerItems: HeaderMenuItem[] = [
    ...nav.primary.map((item) => ({ ...item, label: t(item.key) })),
    ...(nav.showPublisherStudio
      ? [
          {
            key: "publisherStudio" as const,
            href: "/create" as const,
            label: t("publisherStudio"),
          },
        ]
      : []),
    ...nav.utility.map((item) => ({ ...item, label: t(item.key) })),
    ...(nav.showOrgDashboard && nav.orgDashboardSlug
      ? [
          {
            key: "orgDashboard" as const,
            href: `/org/${nav.orgDashboardSlug}/manage` as const,
            label: t("orgDashboard"),
          },
        ]
      : []),
    ...(isAdmin
      ? [{ key: "admin" as const, href: "/admin" as const, label: t("admin") }]
      : []),
  ];

  return (
    <header className="ds-masthead">
      <Container>
        <div className="ds-masthead__bar">
          <Link href="/" className="ds-brand">
            <BrandMark className="ds-brand__mark" />
            <span className="ds-brand__text">
              <span className="ds-brand__name">{tApp("name")}</span>
              <span className="ds-brand__tagline">{tApp("brandSubtitle")}</span>
            </span>
          </Link>

          <nav className="ds-masthead__nav" aria-label={t("primary")}>
            {nav.primary.map((item) => (
              <NavLink
                key={item.key}
                href={item.href}
                exact={item.href === "/"}
                className="ds-nav-link"
              >
                <NavIcon name={item.key} className="ds-nav-link__icon" strokeWidth={1.75} />
                <span>{t(item.key)}</span>
              </NavLink>
            ))}
            {nav.showPublisherStudio ? (
              <NavLink href="/create" className="ds-nav-link">
                <NavIcon name="create" className="ds-nav-link__icon" strokeWidth={1.75} />
                <span>{t("create")}</span>
              </NavLink>
            ) : null}
          </nav>

          <div className="ds-masthead__tools">
            <form
              className="ds-search-input ds-masthead__search"
              action={`/${locale}/search`}
              method="get"
              role="search"
            >
              <Search size={14} strokeWidth={1.75} aria-hidden />
              <input
                type="search"
                name="q"
                placeholder={t("search")}
                aria-label={t("search")}
              />
            </form>

            {user && (scopeOptions.length > 0 || activeScopeId) ? (
              <ScopeSwitcher options={scopeOptions} activeScopeId={activeScopeId} />
            ) : null}

            <span className="ds-desktop-only">
              <LanguageSwitcher />
            </span>
            <ThemeSwitcher />

            {user ? (
              <HeaderAccountMenu
                userName={user.name}
                accountLabel={t("account")}
                settingsLabel={t("settings")}
                signOutLabel={t("signOut")}
              />
            ) : (
              <div className="ds-masthead__auth">
                <ButtonLink href="/login" variant="ghost" size="sm">
                  {t("signIn")}
                </ButtonLink>
                <ButtonLink href="/register" variant="primary" size="sm">
                  {t("register")}
                </ButtonLink>
              </div>
            )}

            <HeaderMenu
              items={drawerItems}
              signInLabel={t("signIn")}
              registerLabel={t("register")}
              signOutLabel={t("signOut")}
              signedIn={Boolean(user)}
              menuLabel={t("menu")}
              closeLabel={t("closeMenu")}
            />
          </div>
        </div>
      </Container>
    </header>
  );
}
