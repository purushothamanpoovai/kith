"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { signOutAction } from "@/app/[locale]/(auth)/actions";
import { Avatar } from "@/components/ui/avatar";

/**
 * The account menu.
 *
 * Shows the viewer's own initials rather than a generic person glyph, so the
 * header confirms who is signed in without spending a nav slot on it (§27).
 * My Space is a top-bar link now, not a menu item here — no need for it in
 * two places (§ Studio tab).
 */
export function HeaderAccountMenu({
  userName,
  settingsLabel,
  signOutLabel,
  accountLabel,
}: {
  userName: string;
  settingsLabel: string;
  signOutLabel: string;
  accountLabel: string;
}) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="ds-account" ref={rootRef}>
      <button
        type="button"
        className="ds-account__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={accountLabel}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={userName} size="sm" />
      </button>

      {open ? (
        <div className="ds-menu" role="menu">
          <p className="ds-menu__label">{t("signedInAs", { name: userName })}</p>
          <Link
            href="/settings"
            className="ds-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Settings size={15} strokeWidth={1.75} aria-hidden />
            {settingsLabel}
          </Link>
          <hr className="ds-menu__sep" />
          <button
            type="button"
            className="ds-menu__item"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOutAction();
              router.replace("/");
              router.refresh();
            }}
          >
            <LogOut size={15} strokeWidth={1.75} aria-hidden />
            {signOutLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
