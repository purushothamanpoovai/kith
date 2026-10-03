import { getTranslations, setRequestLocale } from "next-intl/server";
import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageFrame } from "@/components/layout/page-frame";
import {
  CommunitySidebar,
  CommunitySidebarSignedOut,
} from "@/components/community/community-sidebar";
import { PostCard } from "@/components/community/post-card";
import { ButtonLink } from "@/components/ui/button";
import {
  getUserBookmarkIds,
  getUserReactionIds,
} from "@/repositories/community-repository";
import { getCurrentUser } from "@/services/auth-service";
import { listContentByType } from "@/services/content-service";
import {
  filterContentForUser,
  getCurrentUserContentPreferences,
} from "@/services/preference-service";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("community");
  const tStates = await getTranslations("states");
  const user = await getCurrentUser();
  const prefs = user ? await getCurrentUserContentPreferences() : null;

  let posts = await listContentByType("post", 30);
  if (prefs) posts = await filterContentForUser(posts, prefs);

  const contentIds = posts.map((post) => post.id);
  const [reactedIds, bookmarkedIds] = user
    ? await Promise.all([
        getUserReactionIds(user.id, contentIds),
        getUserBookmarkIds(user.id, contentIds),
      ])
    : [new Set<string>(), new Set<string>()];

  return (
    <PageFrame
      eyebrow={t("eyebrow")}
      title={t("title")}
      lede={t("lede")}
      sidebar={
        user ? (
          <CommunitySidebar locale={locale} userId={user.id} />
        ) : (
          <CommunitySidebarSignedOut />
        )
      }
    >
      {posts.length === 0 ? (
        <EmptyState
          title={tStates("emptyCommentsTitle")}
          body={t("emptyPosts")}
          mark={<MessageCircle size={26} strokeWidth={1.25} />}
          actions={
            <ButtonLink href="/explore" variant="secondary">
              {tStates("exploreAction")}
            </ButtonLink>
          }
          as="h2"
        />
      ) : (
        <div className="ds-river">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              item={post}
              locale={locale}
              signedIn={Boolean(user)}
              hasReacted={reactedIds.has(post.id)}
              hasBookmarked={bookmarkedIds.has(post.id)}
            />
          ))}
        </div>
      )}
    </PageFrame>
  );
}
