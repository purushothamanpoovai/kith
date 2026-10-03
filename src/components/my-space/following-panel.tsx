"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconButton } from "@/components/ui/button";
import { scopeHref } from "@/domain/scope/routes";
import { pickLocalized } from "@/lib/localized";
import type { SubscriptionRecord } from "@/repositories/subscription-repository";
import {
  toggleOrganizationSubscriptionAction,
  toggleScopeSubscriptionAction,
} from "@/app/actions/subscription-actions";

type Props = {
  locale: string;
  subscriptions: SubscriptionRecord[];
  followingLabel: string;
  emptyLabel: string;
};

/**
 * My Space's own following list (§ control panel, not a second Home).
 *
 * Unlike a read-only "chips you happen to follow" display, every row here
 * carries the action that manages it — unfollow, right where you're looking
 * at the list — since this panel's whole purpose is management, not
 * discovery. `toggleScopeSubscriptionAction`/`toggleOrganizationSubscriptionAction`
 * are the same actions the follow button on a scope/org page itself uses;
 * this is just a second place to reach them.
 */
export function MySpaceFollowingPanel({
  locale,
  subscriptions,
  followingLabel,
  emptyLabel,
}: Props) {
  const t = useTranslations("mySpace");
  const [pending, startTransition] = useTransition();

  const scopeSubscriptions = subscriptions.filter(
    (sub) => sub.scopeId && sub.scopeSlug && sub.scopeType,
  );
  const orgSubscriptions = subscriptions.filter(
    (sub) => sub.organizationId && sub.organizationSlug,
  );
  const empty = scopeSubscriptions.length === 0 && orgSubscriptions.length === 0;

  function unfollowScope(scopeId: string) {
    startTransition(() => {
      void toggleScopeSubscriptionAction(scopeId);
    });
  }

  function unfollowOrg(organizationId: string) {
    startTransition(() => {
      void toggleOrganizationSubscriptionAction(organizationId);
    });
  }

  return (
    <section className="ds-widget" aria-labelledby="following-title">
      <h2 className="ds-widget__title" id="following-title">
        {followingLabel}
      </h2>
      {empty ? (
        <p className="ds-widget__text">{emptyLabel}</p>
      ) : (
        <ul className="ds-widget-list">
          {orgSubscriptions.map((sub) => {
            const name = pickLocalized(sub.organizationName, locale);
            return (
              <li key={sub.id} className="ds-widget-list__row">
                <Link href={`/org/${sub.organizationSlug}` as `/${string}`}>{name}</Link>
                <IconButton
                  label={t("unfollow", { name })}
                  size="sm"
                  disabled={pending}
                  onClick={() => unfollowOrg(sub.organizationId!)}
                >
                  <X size={13} strokeWidth={1.75} />
                </IconButton>
              </li>
            );
          })}
          {scopeSubscriptions.map((sub) => {
            const name = pickLocalized(sub.scopeTitle, locale);
            return (
              <li key={sub.id} className="ds-widget-list__row">
                <Link
                  href={
                    scopeHref(
                      sub.scopeType as Parameters<typeof scopeHref>[0],
                      sub.scopeSlug!,
                    ) as `/${string}`
                  }
                >
                  {name}
                </Link>
                <IconButton
                  label={t("unfollow", { name })}
                  size="sm"
                  disabled={pending}
                  onClick={() => unfollowScope(sub.scopeId!)}
                >
                  <X size={13} strokeWidth={1.75} />
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
