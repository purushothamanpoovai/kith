"use client";

import { useRouter } from "@/i18n/navigation";
import { signOutAction } from "@/app/[locale]/(auth)/actions";

type Props = {
  label: string;
};

export function SignOutButton({ label }: Props) {
  const router = useRouter();

  return (
    <button
      className="ds-btn ds-btn--ghost ds-btn--sm"
      type="button"
      onClick={async () => {
        await signOutAction();
        router.replace("/");
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
