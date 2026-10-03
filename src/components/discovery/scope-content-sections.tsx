import { getTranslations } from "next-intl/server";
import { ArticleCard, ContentCard } from "@/components/content/content-card";
import { Section } from "@/components/ui/section";
import type { ContentRecord } from "@/domain/content/types";
import { contentTitle } from "@/services/feed-service";
import { sortLabelsAlphabetically } from "@/lib/scope-sort";

/**
 * The content bands on a scope page (§24).
 *
 * A module with nothing in it is not rendered at all. The previous version
 * emitted an "Quiet for now / No article, post, poem have been published"
 * card for every empty module, which is precisely the empty placeholder
 * section the directive rules out — and it was why a religion page could be
 * mostly apology.
 */
export async function ScopeContentSections({
  modules,
  locale,
  contentByModule,
}: {
  scopeId: string;
  modules: string[];
  locale: string;
  contentByModule: Record<string, ContentRecord[]>;
}) {
  const t = await getTranslations();

  const populated = modules
    .map((moduleKey) => ({
      moduleKey,
      items: sortLabelsAlphabetically(
        contentByModule[moduleKey] ?? [],
        (item) => contentTitle(item, locale),
        locale,
      ),
    }))
    .filter((band) => band.items.length > 0);

  if (populated.length === 0) return null;

  return (
    <>
      {populated.map(({ moduleKey, items }) => {
        const [lead, ...rest] = items;
        return (
          <Section
            key={moduleKey}
            title={t(`scopes.modules.${moduleKey}` as "scopes.modules.overview")}
          >
            <div className="ds-stack">
              {/* A lead only earns its size when there is a grid behind it. */}
              {rest.length >= 2 ? (
                <ArticleCard item={lead} locale={locale} density="lead" />
              ) : (
                <ContentCard item={lead} locale={locale} />
              )}
              {rest.length > 0 ? (
                <div className="ds-grid">
                  {rest.map((item) => (
                    <ContentCard key={item.id} item={item} locale={locale} />
                  ))}
                </div>
              ) : null}
            </div>
          </Section>
        );
      })}
    </>
  );
}
