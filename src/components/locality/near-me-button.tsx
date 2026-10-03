"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  clearGeoRegionAction,
  saveGeoRegionAction,
} from "@/app/actions/locality-actions";
import { Button } from "@/components/ui/button";

type Props = {
  active: boolean;
};

export function NearMeButton({ active }: Props) {
  const t = useTranslations("locality");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (active) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await clearGeoRegionAction();
          });
        }}
      >
        {t("clearArea")}
      </Button>
    );
  }

  return (
    <span className="ds-row ds-row--tight">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          setError(null);
          if (!navigator.geolocation) {
            setError(t("geoUnsupported"));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (position) => {
              startTransition(async () => {
                const result = await saveGeoRegionAction(
                  position.coords.latitude,
                  position.coords.longitude,
                );
                if (!result.ok) setError(t("geoFailed"));
              });
            },
            () => setError(t("geoDenied")),
            { maximumAge: 86_400_000, timeout: 8_000, enableHighAccuracy: false },
          );
        }}
      >
        {t("useArea")}
      </Button>
      {error ? <span className="ds-hint">{error}</span> : null}
    </span>
  );
}
