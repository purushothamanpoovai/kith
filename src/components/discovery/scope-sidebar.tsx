import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { getScopeFollowerCount, getScopeFollowers } from "@/services/subscription-service";

/**
 * The scope page's own side rail (§24).
 *
 * `MagazineSidebar` — Editor's Shelf, a hardcoded Traditions list, an events
 * invite — was reused here from the home feed, so a reader on the Arabic
 * language page saw a "Bring people together, browse events" banner and a
 * list of unrelated religious traditions, none of it about Arabic. This
 * shows only what's actually true of *this* scope: who follows it, and how
 * many — the same follower-row widget `/community` already uses for a
 * person, applied to a scope instead. Nothing generic is shown just to fill
 * the column.
 */
export async function ScopeSidebar({ scopeId }: { scopeId: string }) {
  const t = await getTranslations("community");
  const [followerCount, followers] = await Promise.all([
    getScopeFollowerCount(scopeId),
    getScopeFollowers(scopeId, 8),
  ]);

  if (followerCount === 0) return null;

  return (
    <section className="ds-widget ds-widget--activity" aria-labelledby="rail-followers">
      <h2 className="ds-widget__title" id="rail-followers">
        <Users size={13} strokeWidth={1.75} aria-hidden />
        {t("followersTitle")}
        <span className="ds-widget-list__count">{followerCount}</span>
      </h2>
      <ul className="ds-follower-row">
        {followers.map((follower) => (
          <li key={follower.slug}>
            <Avatar name={follower.name} size="sm" />
          </li>
        ))}
      </ul>
    </section>
  );
}
