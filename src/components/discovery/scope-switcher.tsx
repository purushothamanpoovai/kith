"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Aperture } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  setScopeContextAction,
  toggleScopeSubscriptionAction,
} from "@/app/actions/subscription-actions";
import { Button } from "@/components/ui/button";

type ScopeOption = {
  id: string;
  label: string;
};

type Props = {
  options: ScopeOption[];
  activeScopeId: string | null;
  canSubscribe?: boolean;
  subscribed?: boolean;
  subscribeScopeId?: string;
};

export function ScopeSwitcher({
  options,
  activeScopeId,
  canSubscribe = false,
  subscribed = false,
  subscribeScopeId,
}: Props) {
  const t = useTranslations("scopeContext");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const activeLabel =
    options.find((o) => o.id === activeScopeId)?.label ?? t("allWorlds");
  const sortedOptions = [...options].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );

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

  function selectScope(scopeId: string | null) {
    startTransition(async () => {
      await setScopeContextAction(scopeId);
      setOpen(false);
    });
  }

  function toggleSubscribe() {
    if (!subscribeScopeId) return;
    startTransition(() => {
      void toggleScopeSubscriptionAction(subscribeScopeId);
    });
  }

  return (
    <div className="ds-scope-switcher" ref={rootRef}>
      <button
        type="button"
        className="ds-scope-switcher__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t("viewing")}: ${activeLabel}`}
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
      >
        <Aperture size={13} strokeWidth={1.75} aria-hidden />
        <span>{activeLabel}</span>
      </button>
      {open ? (
        <div className="ds-menu ds-scope-switcher__menu" role="listbox">
          <button
            type="button"
            role="option"
            className="ds-scope-switcher__option"
            aria-selected={!activeScopeId}
            onClick={() => selectScope(null)}
          >
            {t("allWorlds")}
          </button>
          {sortedOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              className="ds-scope-switcher__option"
              aria-selected={activeScopeId === option.id}
              onClick={() => selectScope(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
      {canSubscribe && subscribeScopeId ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={toggleSubscribe}
        >
          {subscribed ? t("unsubscribe") : t("follow")}
        </Button>
      ) : null}
    </div>
  );
}
