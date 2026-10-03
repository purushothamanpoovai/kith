"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { signOutAction } from "@/app/[locale]/(auth)/actions";
import { NavIcon } from "@/components/icons/nav-icon";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeSwitcherDrawer } from "@/components/theme/theme-switcher-drawer";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import type { NavItemKey } from "@/config/navigation";

export type HeaderMenuItem = {
  key: NavItemKey | "admin" | "publisherStudio" | "orgDashboard";
  href: `/${string}` | "/";
  label: string;
};

/**
 * The mobile navigation drawer.
 *
 * Mounted only while open, so nothing sits off-canvas contributing to the
 * document's scroll width or reachable by the keyboard — the previous drawer
 * was translated out of view but still in the layout, which the audit caught
 * as horizontal overflow on every route. Focus moves into the panel on open
 * and returns to the trigger on close; Escape and the backdrop both close it.
 */
export function HeaderMenu({
  items,
  signInLabel,
  registerLabel,
  signOutLabel,
  signedIn,
  menuLabel,
  closeLabel,
}: {
  items: HeaderMenuItem[];
  signInLabel: string;
  registerLabel: string;
  signOutLabel: string;
  signedIn: boolean;
  menuLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // Lock the page behind the drawer, and restore focus to the trigger on close.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <span className="ds-mobile-only">
        <IconButton
          ref={triggerRef}
          label={open ? closeLabel : menuLabel}
          aria-expanded={open}
          aria-controls="header-drawer"
          onClick={() => setOpen(true)}
        >
          <Menu size={19} strokeWidth={1.75} />
        </IconButton>
      </span>

      {/* Mounted only while open. Keeping it in the tree translated off-canvas
          extended the document's scroll width, which the audit caught as
          horizontal scroll on every route (§39). */}
      {open ? (
        <>
          <button
            type="button"
            className="ds-drawer__backdrop"
            aria-label={closeLabel}
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />

          <div
            id="header-drawer"
            ref={panelRef}
            className="ds-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={menuLabel}
          >
            <div className="ds-drawer__head">
              <span className="ds-eyebrow ds-caps" style={{ margin: 0 }}>
                {menuLabel}
              </span>
              <IconButton
                label={closeLabel}
                size="sm"
                onClick={() => setOpen(false)}
              >
                <X size={17} strokeWidth={1.75} />
              </IconButton>
            </div>

            <nav className="ds-drawer__nav" aria-label={menuLabel}>
              {items.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="ds-drawer__link"
                  onClick={() => setOpen(false)}
                >
                  <NavIcon
                    name={item.key}
                    className="ds-drawer__icon"
                    strokeWidth={1.75}
                  />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="ds-drawer__section">
              <LanguageSwitcher expanded />
            </div>

            <ThemeSwitcherDrawer />

            <div className="ds-drawer__foot">
              {signedIn ? (
                <Button
                  variant="secondary"
                  block
                  loading={pending}
                  onClick={async () => {
                    setPending(true);
                    await signOutAction();
                    setOpen(false);
                    router.replace("/");
                    router.refresh();
                  }}
                >
                  {signOutLabel}
                </Button>
              ) : (
                <>
                  <ButtonLink href="/register" variant="primary" block>
                    {registerLabel}
                  </ButtonLink>
                  <ButtonLink href="/login" variant="secondary" block>
                    {signInLabel}
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
