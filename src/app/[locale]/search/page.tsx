import { getTranslations, setRequestLocale } from "next-intl/server";
import { Search as SearchIcon } from "lucide-react";
import { ContentCard } from "@/components/content/content-card";
import { OrganizationCard } from "@/components/organizations/organization-card";
import { HeritageCard } from "@/components/heritage/heritage-card";
import { PageFrame } from "@/components/layout/page-frame";
import { EmptyState } from "@/components/ui/empty-state";
import { Section } from "@/components/ui/section";
import { Button, ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/tabs";
import { searchContent } from "@/services/content-service";
import { contentTitle } from "@/services/feed-service";
import { searchScopes } from "@/services/scope-service";
import { searchHeritage } from "@/repositories/heritage-repository";
import { listOrganizations } from "@/repositories/organization-repository";
import { pickLocalized } from "@/lib/localized";
import { sortLabelsAlphabetically } from "@/lib/scope-sort";

/**
 * Search (§33).
 *
 * A discovery tool rather than a list of blue links: results are grouped by
 * kind and each group keeps its own card pattern, so an article, a tradition,
 * an organization and a heritage record are distinguishable at a glance.
 * Groups with no matches are omitted entirely.
 */
export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q = "" } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("search");
  const tStates = await getTranslations("states");
  const tExplore = await getTranslations("explore");
  const tHeritage = await getTranslations("heritage");

  const query = q.trim();
  const [content, scopes, heritage, allOrgs] = query
    ? await Promise.all([
        searchContent(query, 20),
        searchScopes(query, locale, 12),
        searchHeritage(query, 6),
        listOrganizations(50),
      ])
    : [[], [], [], []];

  // Organizations have no search query of their own; filter the list in the
  // reader's locale rather than adding a repository method for the UI's sake.
  const needle = query.toLocaleLowerCase(locale);
  const organizations = query
    ? allOrgs
        .filter((org) =>
          pickLocalized(org.name, locale).toLocaleLowerCase(locale).includes(needle),
        )
        .slice(0, 4)
    : [];

  const sortedContent = sortLabelsAlphabetically(
    content,
    (item) => contentTitle(item, locale),
    locale,
  );

  const total =
    sortedContent.length + scopes.length + heritage.length + organizations.length;

  return (
    <PageFrame eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")}>
      <div className="ds-search">
        <form className="ds-search__form" action={`/${locale}/search`} method="get" role="search">
          <div className="ds-search-input">
            <SearchIcon size={16} strokeWidth={1.75} aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
            />
          </div>
          <Button type="submit" variant="primary" size="lg">
            {t("submit")}
          </Button>
        </form>

        {query ? (
          total === 0 ? (
            <EmptyState
              title={tStates("emptySearchTitle", { query })}
              body={tStates("emptySearchBody")}
              mark={<SearchIcon size={26} strokeWidth={1.25} />}
              actions={
                <ButtonLink href="/explore" variant="primary">
                  {tStates("exploreAction")}
                </ButtonLink>
              }
              as="h2"
            />
          ) : (
            <>
              {sortedContent.length > 0 ? (
                <div className="ds-result-group">
                  <Section title={t("contentResults")}>
                    <div className="ds-grid">
                      {sortedContent.map((item) => (
                        <ContentCard key={item.id} item={item} locale={locale} />
                      ))}
                    </div>
                  </Section>
                </div>
              ) : null}

              {scopes.length > 0 ? (
                <div className="ds-result-group">
                  <Section title={t("scopeResults")}>
                    <div className="ds-chip-rail">
                      {scopes.map((scope) => (
                        <Chip key={scope.id} href={scope.href}>
                          {scope.label}
                        </Chip>
                      ))}
                    </div>
                  </Section>
                </div>
              ) : null}

              {organizations.length > 0 ? (
                <div className="ds-result-group">
                  <Section title={tExplore("organizationsTitle")}>
                    <div className="ds-grid ds-grid--2">
                      {organizations.map((org) => (
                        <OrganizationCard
                          key={org.id}
                          organization={org}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </Section>
                </div>
              ) : null}

              {heritage.length > 0 ? (
                <div className="ds-result-group">
                  <Section title={tHeritage("title")}>
                    <div className="ds-grid">
                      {heritage.map((item) => (
                        <HeritageCard key={item.id} item={item} locale={locale} />
                      ))}
                    </div>
                  </Section>
                </div>
              ) : null}
            </>
          )
        ) : (
          <p className="ds-search__summary">{t("lede")}</p>
        )}
      </div>
    </PageFrame>
  );
}
