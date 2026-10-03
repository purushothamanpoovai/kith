import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ScopeType } from "@/generated/prisma/client";
import type { ContentRecord } from "@/domain/content/types";
import { Breadcrumbs } from "@/components/discovery/breadcrumbs";
import { ScopeCardGrid } from "@/components/discovery/scope-card";
import { ScopeContentSections } from "@/components/discovery/scope-content-sections";
import { ScopeKindChips, ScopeKindGrid } from "@/components/discovery/scope-kind-filter";
import { ScopeSidebar } from "@/components/discovery/scope-sidebar";
import { ScopeSubscribeButton } from "@/components/discovery/scope-subscribe-button";
import { SetScopeLensButton } from "@/components/discovery/set-scope-lens-button";
import { CommentThread } from "@/components/community/comment-thread";
import { ReactionBar } from "@/components/community/reaction-bar";
import { DecorativePattern, Ornament } from "@/components/graphics/decorative-pattern";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { resolveScopeTheme, themeAttributes } from "@/domain/theme/theme-config";
import { getActiveScopeId } from "@/lib/scope-context";
import {
  countScopeReactions,
  getUserScopeReactionIds,
  listScopeComments,
} from "@/repositories/community-repository";
import { getCurrentUser } from "@/services/auth-service";
import {
  countScopeContentByType,
  getScopeContentByKind,
  getScopeModuleContent,
  SCOPE_KIND_FILTERS,
  summarizeKindCounts,
  type ScopeKindFilter,
} from "@/services/content-service";
import {
  getScopeDescription,
  getScopeLabel,
  getScopeWithRelations,
} from "@/services/scope-service";
import { isSubscribedToScope } from "@/services/subscription-service";

function parseKindFilter(value: string | undefined): ScopeKindFilter {
  return (SCOPE_KIND_FILTERS as string[]).includes(value ?? "")
    ? (value as ScopeKindFilter)
    : "all";
}

/**
 * A religion / tradition / topic / region / language page (§24).
 *
 * The page is tinted by the scope's own contextual theme — accent, pattern
 * and surface treatment — while keeping the platform's structure, type scale
 * and navigation identical (§5). The mapping lives in the theme config, so
 * this component contains no branch on any particular tradition (§44).
 *
 * Sections render only when they have content. The previous version also
 * emitted a row of non-interactive "module tabs" that looked like controls
 * but did nothing; those are gone.
 *
 * The scope itself can be reacted to and discussed, the same way a piece of
 * content can (`ReactionBar`/`CommentThread` with `scopeId` instead of
 * `contentId`) — appreciating "Arabic" or leaving a note on it is a genuine
 * response to the scope, not something that needs a piece of content to
 * attach to. The side rail is scope-specific too (`ScopeSidebar`): who
 * follows this scope, not a generic editorial rail borrowed from the home
 * feed that had nothing to do with the page it sat on.
 */
export async function ScopeDetailPage({
  type,
  slug,
  locale,
  basePath,
  searchParams,
}: {
  type: ScopeType;
  slug: string;
  locale: string;
  /** This page's own route, e.g. "/religions/hinduism" — the kind-filter
   *  chips link back to it, so each caller passes its real path rather than
   *  this component guessing a plural from `type` (entities/languages don't
   *  pluralize predictably: /entities/[slug], /languages/[code]). */
  basePath: `/${string}`;
  searchParams?: Promise<{ kind?: string }>;
}) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const tCommon = await getTranslations("common");

  const scope = await getScopeWithRelations(type, slug, locale);
  if (!scope) {
    notFound();
  }

  const kind = parseKindFilter((await searchParams)?.kind);
  const user = await getCurrentUser();
  const moduleKeys = scope.modules.length > 0 ? scope.modules : ["overview"];
  const [
    activeScopeId,
    subscribed,
    contentByModule,
    comments,
    reacted,
    reactionCount,
    kindCounts,
    kindItems,
  ] = await Promise.all([
    getActiveScopeId(),
    user ? isSubscribedToScope(user.id, scope.id) : Promise.resolve(false),
    kind === "all"
      ? getScopeModuleContent(scope.id, moduleKeys)
      : Promise.resolve<Record<string, ContentRecord[]>>({}),
    listScopeComments(scope.id),
    user
      ? getUserScopeReactionIds(user.id, [scope.id]).then((set) => set.has(scope.id))
      : Promise.resolve(false),
    countScopeReactions(scope.id),
    countScopeContentByType(scope.id).then(summarizeKindCounts),
    kind === "all"
      ? Promise.resolve<ContentRecord[]>([])
      : getScopeContentByKind(scope.id, kind),
  ]);

  const title = getScopeLabel(scope, locale);
  const description = getScopeDescription(scope, locale);
  const theme = resolveScopeTheme(scope.type, scope.slug);
  const isLens = activeScopeId === scope.id;
  const hasContent =
    kind === "all"
      ? moduleKeys.some((key) => (contentByModule[key] ?? []).length > 0)
      : kindItems.length > 0;

  // Wikipedia-sourced descriptions carry their attribution inline; split it
  // out so the licence note reads as a note rather than as prose.
  const sourceIndex = description.indexOf("This overview incorporates");
  const about = sourceIndex > 0 ? description.slice(0, sourceIndex).trim() : description;
  const sourceNote = sourceIndex > 0 ? description.slice(sourceIndex).trim() : null;

  return (
    <div className="ds-animate-in" {...themeAttributes(theme)}>
      <Breadcrumbs
        items={scope.breadcrumbs}
        locale={locale}
        ariaLabel={tCommon("breadcrumb")}
      />

      <header className="ds-hero">
        <DecorativePattern pattern={theme.pattern} opacity={0.08} fade="inline" />
        <Ornament corner="br" size={88} />
        <div className="ds-hero__inner">
          <span className="ds-kicker ds-caps">
            {t(`scopes.types.${scope.type}`)}
          </span>
          <h1 className="ds-hero__title">{title}</h1>
          {about ? <p className="ds-hero__lede">{about}</p> : null}
          <div className="ds-hero__actions">
            <ScopeSubscribeButton
              scopeId={scope.id}
              subscribed={subscribed}
              signedIn={Boolean(user)}
            />
            <SetScopeLensButton scopeId={scope.id} isActive={isLens} />
          </div>
          {isLens ? (
            <div className="ds-hero__facts">
              <Badge tone="accent">{t("scopeContext.activeLens")}</Badge>
            </div>
          ) : null}
        </div>
      </header>

      <div className="ds-columns">
        <div className="ds-columns__main">
          {kindCounts.all > 0 ? (
            <ScopeKindChips basePath={basePath} active={kind} counts={kindCounts} />
          ) : null}

          {kind === "all" ? (
            hasContent ? (
              <ScopeContentSections
                scopeId={scope.id}
                modules={moduleKeys}
                locale={locale}
                contentByModule={contentByModule}
              />
            ) : (
              <EmptyState
                title={t("content.emptyTitle")}
                body={t("scopes.emptyBody")}
                as="h2"
              />
            )
          ) : (
            <ScopeKindGrid items={kindItems} locale={locale} />
          )}

          {scope.children.length > 0 ? (
            <Section title={t("scopes.relatedScopes")}>
              <ScopeCardGrid scopes={scope.children} locale={locale} compact />
            </Section>
          ) : null}

          {sourceNote ? <p className="ds-source-note">{sourceNote}</p> : null}

          <ReactionBar
            scopeId={scope.id}
            anchorId="discussion"
            reactionCount={reactionCount}
            commentCount={comments.length}
            hasReacted={reacted}
            signedIn={Boolean(user)}
          />

          <CommentThread
            scopeId={scope.id}
            comments={comments}
            signedIn={Boolean(user)}
            locale={locale}
            userName={user?.name}
            anchorId="discussion"
          />
        </div>

        <aside className="ds-columns__aside">
          <ScopeSidebar scopeId={scope.id} />
        </aside>
      </div>
    </div>
  );
}
