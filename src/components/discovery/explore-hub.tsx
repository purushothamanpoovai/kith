import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageFrame } from "@/components/layout/page-frame";
import { OrganizationCard } from "@/components/organizations/organization-card";
import { ScopeTree } from "@/components/discovery/scope-tree";
import { ScopeOutlineList } from "@/components/discovery/scope-outline-list";
import { HeritageCard } from "@/components/heritage/heritage-card";
import { Section, sectionDomId } from "@/components/ui/section";
import { DecorativePattern } from "@/components/graphics/decorative-pattern";
import { DimensionGlyph, type DimensionKind } from "@/components/graphics/dimension-glyph";
import { resolveScopeTheme } from "@/domain/theme/theme-config";
import {
  getReligionTree,
  getScopesWithCounts,
  type ScopeRecord,
  type ScopeTreeNode,
} from "@/services/scope-service";
import {
  exploreSectionLabelOverride,
  getExploreSections,
  type ExploreSectionRecord,
} from "@/services/explore-section-service";
import { listOrganizations } from "@/repositories/organization-repository";
import { listHeritageArchive } from "@/repositories/heritage-repository";

/**
 * Explore, as a hierarchical reference index rather than a page of card
 * rails (§ Explore redesign).
 *
 * Religion → Tradition → Sacred Entity is the one dimension with genuine
 * parent/child structure, so it renders as a literal, collapsible tree
 * (`ScopeTree`) — the shape a researcher or journalist actually wants when
 * scanning "what belongs under what", rather than a rail of equally-weighted
 * cards with no visible relationship between entries. Topics, Regions, and
 * Languages are flat, cross-cutting lists with no such hierarchy — each
 * renders as a plain outline list (`ScopeOutlineList`), still a lookup table
 * rather than a card grid, but without inventing a tree structure that
 * doesn't exist in the data. Sacred Places and Heritage are not Scope-backed
 * at all (an Organization, an archive entry) and keep a card presentation,
 * since browsing a place or a recorded memory benefits from the image a card
 * gives and there is no hierarchy to represent either way.
 *
 * A note on sensitive handling: sacred entities (deities, prophets, saints)
 * are presented in the religion tree with the same plain, respectful listing
 * as everything else — no imagery, no devotional or trivia framing, just a
 * name and a link — because that is the register appropriate to a reference
 * index covering living traditions' sacred figures across several faiths at
 * once, not any one tradition's own devotional presentation of them.
 *
 * Which bands exist, in what order, under what label, is still a row in
 * `ExploreSection` that a super admin owns (/admin/explore).
 */

/** Keys whose content comes from somewhere other than the scope table. */
const ORGANIZATIONS_KEY = "organizations";
const HERITAGE_KEY = "heritage";
/** The one scope-backed section that renders as a tree instead of a list. */
const RELIGION_KEY = "religions";

function sumTreeContentCounts(nodes: ScopeTreeNode[]): number {
  return nodes.reduce(
    (sum, node) => sum + node.contentCount + sumTreeContentCounts(node.children),
    0,
  );
}

/** Flattens a tree into { nodeId: contentCount } for every node at any depth. */
function flattenTreeCounts(nodes: ScopeTreeNode[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const node of nodes) {
    out[node.id] = node.contentCount;
    Object.assign(out, flattenTreeCounts(node.children));
  }
  return out;
}

export async function ExploreHub({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations();

  const sections = await getExploreSections();

  const [religionTree, scopesByKey, organizations, heritage] = await Promise.all([
    getReligionTree(),
    // One query per scope-backed section, still in parallel — the section
    // list is admin-sized (a handful of rows), not user-generated. Religion
    // is excluded here: it is fetched as a tree above instead of a flat list.
    Promise.all(
      sections
        .filter((section) => section.scopeType !== null && section.key !== RELIGION_KEY)
        .map(async (section) => {
          const scopes = await getScopesWithCounts(section.scopeType!);
          return [section.key, scopes] as const;
        }),
    ).then(
      (entries) => new Map<string, Array<ScopeRecord & { contentCount: number }>>(entries),
    ),
    listOrganizations(),
    listHeritageArchive(4),
  ]);

  const religionContentCount = sumTreeContentCounts(religionTree);

  /** The reader-facing label: the admin's override for this locale, else the
   *  built-in message, so an unconfigured section reads exactly as before.
   *  `t.has` guards the fallback because a section added later may have no
   *  built-in message at all, and a missing key throws rather than degrading. */
  function labelFor(section: ExploreSectionRecord): string {
    const override = exploreSectionLabelOverride(section, locale);
    if (override) return override;
    if (section.key === ORGANIZATIONS_KEY) return t("explore.organizationsTitle");
    if (section.key === HERITAGE_KEY) return t("explore.heritageTitle");
    const key = `scopes.${section.key}` as "scopes.topics";
    return t.has(key) ? t(key) : section.key;
  }

  function ledeFor(section: ExploreSectionRecord): string | undefined {
    const key = `scopes.${section.key}Lede` as "scopes.topicsLede";
    return t.has(key) ? t(key) : undefined;
  }

  function countFor(section: ExploreSectionRecord): number {
    if (section.key === ORGANIZATIONS_KEY) return organizations.length;
    if (section.key === HERITAGE_KEY) return heritage.length;
    if (section.key === RELIGION_KEY) return religionContentCount;
    return scopesByKey.get(section.key)?.length ?? 0;
  }

  // A band with nothing in it is omitted entirely (§24) — its tile stays, but
  // has no on-page section to scroll to, so it opens the dedicated index page
  // instead of jumping to nothing.
  const rendered = sections.filter((section) => countFor(section) > 0);
  const renderedKeys = new Set(rendered.map((section) => section.key));

  const religionSection = rendered.find((s) => s.key === RELIGION_KEY);
  const outlineSections = rendered.filter(
    (section) => section.scopeType !== null && section.key !== RELIGION_KEY,
  );
  const organizationsSection = rendered.find((s) => s.key === ORGANIZATIONS_KEY);
  const heritageSection = rendered.find((s) => s.key === HERITAGE_KEY);

  return (
    <PageFrame
      eyebrow={t("explore.eyebrow")}
      title={t("explore.title")}
      lede={t("explore.lede")}
    >
      <div className="ds-explore">
        <nav aria-label={t("explore.indexTitle")}>
          <ul className="ds-dimension-index">
            {sections.map((section) => {
              const label = labelFor(section);
              const scrollsToSection = renderedKeys.has(section.key);
              // Heritage has no scope type of its own; it borrows the
              // organization mark, the same way the hand-written sacred-places
              // tile always has.
              const kind = (section.scopeType ?? "organization") as DimensionKind;
              const theme = resolveScopeTheme(kind);
              const tileClassName = `ds-dimension${
                section.imageUrl ? " ds-dimension--art" : ""
              }`;
              const tileContent = section.imageUrl ? (
                <>
                  <span className="ds-dimension__art">
                    {/* eslint-disable-next-line @next/next/no-img-element --
                        served from the local /media mount, not through the
                        image optimiser (matches content-cover.tsx). */}
                    <img
                      src={section.imageUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span className="ds-dimension__label">{label}</span>
                  <span className="ds-dimension__count">
                    {t("explore.itemCount", { count: countFor(section) })}
                  </span>
                </>
              ) : (
                <>
                  <DecorativePattern
                    pattern={theme.pattern}
                    opacity={0.16}
                    fade="block"
                  />
                  <span className="ds-dimension__glyph">
                    {section.icon ? (
                      <span aria-hidden>{section.icon}</span>
                    ) : (
                      <DimensionGlyph kind={kind} />
                    )}
                  </span>
                  <span className="ds-dimension__label">{label}</span>
                  <span className="ds-dimension__count">
                    {t("explore.itemCount", { count: countFor(section) })}
                  </span>
                </>
              );
              return (
                <li key={section.id}>
                  {/* No `themeAttributes` here: the app's own theme rules say
                      contextual accents are for a single scope's own detail
                      page, not for several unrelated scopes shown side by
                      side. The pattern's shape still varies per dimension;
                      only its colour comes from the page's one ambient
                      accent. */}
                  {scrollsToSection ? (
                    // A same-page anchor never needs locale-prefixing, so a
                    // plain <a> is used here rather than the locale-aware
                    // `Link`, which is built to rewrite pathnames and isn't
                    // meant for a bare `#id`.
                    <a href={`#${sectionDomId(label)}`} className={tileClassName}>
                      {tileContent}
                    </a>
                  ) : (
                    <Link href={section.href as `/${string}`} className={tileClassName}>
                      {tileContent}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {religionSection ? (
          <Section
            key={religionSection.id}
            title={labelFor(religionSection)}
            lede={ledeFor(religionSection)}
            link={{
              href: religionSection.href,
              label: t("explore.seeAllIn", { name: labelFor(religionSection) }),
            }}
          >
            <p className="ds-metadata">{t("explore.religionTreeNote")}</p>
            <ScopeTree
              nodes={religionTree}
              locale={locale}
              formatCount={Object.fromEntries(
                Object.entries(flattenTreeCounts(religionTree)).map(([id, count]) => [
                  id,
                  t("explore.itemCount", { count }),
                ]),
              )}
            />
          </Section>
        ) : null}

        {outlineSections.map((section) => {
          const label = labelFor(section);
          const scopes = scopesByKey.get(section.key) ?? [];
          return (
            <Section
              key={section.id}
              title={label}
              lede={ledeFor(section)}
              link={{
                href: section.href,
                label: t("explore.seeAllIn", { name: label }),
              }}
            >
              <ScopeOutlineList
                scopes={scopes}
                locale={locale}
                itemCountLabel={(count) => t("explore.itemCount", { count })}
              />
            </Section>
          );
        })}

        {organizationsSection ? (
          <Section
            title={labelFor(organizationsSection)}
            lede={t("explore.organizationsLede")}
            link={{
              href: organizationsSection.href,
              label: t("explore.seeAllIn", {
                name: labelFor(organizationsSection),
              }),
            }}
          >
            <div className="ds-grid ds-grid--2">
              {organizations.slice(0, 6).map((org) => (
                <OrganizationCard key={org.id} organization={org} locale={locale} />
              ))}
            </div>
          </Section>
        ) : null}

        {heritageSection ? (
          <Section
            title={labelFor(heritageSection)}
            lede={t("explore.heritageLede")}
            link={{ href: heritageSection.href, label: t("cards.viewAll") }}
          >
            <div className="ds-grid">
              {heritage.map((item) => (
                <HeritageCard key={item.id} item={item} locale={locale} />
              ))}
            </div>
          </Section>
        ) : null}
      </div>
    </PageFrame>
  );
}
