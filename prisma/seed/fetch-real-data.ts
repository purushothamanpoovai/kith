/**
 * Enriches seed JSON files with factual summaries from Wikipedia (CC BY-SA 4.0).
 * Run: npm run db:seed:fetch
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  attributionBlock,
  delay,
  fetchWikiSummary,
  splitIntoParagraphs,
  truncateExtract,
} from "./lib/wikipedia";

const seedDir = path.dirname(fileURLToPath(import.meta.url));

type Localized = Record<string, string>;

type SeedScope = {
  id: string;
  description?: Localized;
  [key: string]: unknown;
};

type SeedArticle = {
  id: string;
  summary?: Localized;
  blocks?: Array<{
    type: string;
    text?: Localized;
    attribution?: Localized;
    level?: number;
    src?: string;
    alt?: string;
    caption?: Localized;
  }>;
  coverImage?: string;
  readingMinutes?: number;
  [key: string]: unknown;
};

type SeedEvent = {
  id: string;
  description?: Localized;
  [key: string]: unknown;
};

type SeedOrganization = {
  id: string;
  description?: Localized;
  [key: string]: unknown;
};

type WikiSources = {
  scopes: Record<string, string>;
  articles: Record<string, string>;
  events: Record<string, string>;
  organizations: Record<string, string>;
};

async function readJson<T>(filename: string): Promise<T> {
  const raw = await readFile(path.join(seedDir, filename), "utf8");
  return JSON.parse(raw) as T;
}

async function writeJson(filename: string, data: unknown): Promise<void> {
  await writeFile(
    path.join(seedDir, filename),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );
}

function estimateReadingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.min(12, Math.round(words / 180)));
}

function buildArticleBlocks(
  paragraphs: string[],
  pageTitle: string,
  pageUrl: string,
): SeedArticle["blocks"] {
  const blocks: NonNullable<SeedArticle["blocks"]> = paragraphs.map((paragraph) => ({
    type: "paragraph",
    text: { en: paragraph },
  }));

  blocks.push({
    type: "paragraph",
    text: { en: attributionBlock(pageTitle, pageUrl) },
  });

  return blocks;
}

async function enrichScopes(sources: WikiSources): Promise<number> {
  const scopes = await readJson<SeedScope[]>("scopes.json");
  let updated = 0;

  for (const scope of scopes) {
    const wikiTitle = sources.scopes[scope.id];
    if (!wikiTitle) {
      continue;
    }

    const summary = await fetchWikiSummary(wikiTitle);
    await delay(1200);
    if (!summary) {
      continue;
    }

    const extract = truncateExtract(summary.extract, 420);
    scope.description = {
      ...scope.description,
      en: extract,
    };
    updated += 1;
    console.log(`  scope ${scope.id} ← "${summary.title}"`);
  }

  await writeJson("scopes.json", scopes);
  return updated;
}

async function enrichArticles(sources: WikiSources): Promise<number> {
  const articles = await readJson<SeedArticle[]>("articles.json");
  let updated = 0;

  for (const article of articles) {
    const wikiTitle = sources.articles[article.id];
    if (!wikiTitle) {
      continue;
    }

    const summary = await fetchWikiSummary(wikiTitle);
    await delay(1200);
    if (!summary) {
      continue;
    }

    const pageUrl = summary.pageUrl;
    const paragraphs = splitIntoParagraphs(summary.extract, 3);
    const fullText = paragraphs.join(" ");

    article.summary = {
      ...article.summary,
      en: truncateExtract(summary.description || summary.extract, 220),
    };
    article.blocks = buildArticleBlocks(paragraphs, summary.title, pageUrl);
    article.readingMinutes = estimateReadingMinutes(fullText);
    delete article.coverImage;

    updated += 1;
    console.log(`  article ${article.id} ← "${summary.title}"`);
  }

  await writeJson("articles.json", articles);
  return updated;
}

async function enrichEvents(sources: WikiSources): Promise<number> {
  const events = await readJson<SeedEvent[]>("events.json");
  let updated = 0;

  for (const event of events) {
    const wikiTitle = sources.events[event.id];
    if (!wikiTitle) {
      continue;
    }

    const summary = await fetchWikiSummary(wikiTitle);
    await delay(1200);
    if (!summary) {
      continue;
    }

    const pageUrl = summary.pageUrl;
    const factual = truncateExtract(summary.extract, 380);
    const attribution = attributionBlock(summary.title, pageUrl);

    event.description = {
      ...event.description,
      en: `${factual} ${attribution}`,
    };
    delete event.coverImage;

    updated += 1;
    console.log(`  event ${event.id} ← "${summary.title}"`);
  }

  await writeJson("events.json", events);
  return updated;
}

async function enrichOrganizations(sources: WikiSources): Promise<number> {
  const orgs = await readJson<SeedOrganization[]>("organizations.json");
  let updated = 0;

  for (const org of orgs) {
    const wikiTitle = sources.organizations[org.id];
    if (!wikiTitle) {
      continue;
    }

    const summary = await fetchWikiSummary(wikiTitle);
    await delay(1200);
    if (!summary) {
      continue;
    }

    const pageUrl = summary.pageUrl;
    org.description = {
      ...org.description,
      en: `${truncateExtract(summary.extract, 360)} ${attributionBlock(summary.title, pageUrl)}`,
    };

    updated += 1;
    console.log(`  organization ${org.id} ← "${summary.title}"`);
  }

  await writeJson("organizations.json", orgs);
  return updated;
}

async function main() {
  console.log("Fetching real data from Wikipedia REST API…\n");
  const sources = await readJson<WikiSources>("wikipedia-sources.json");

  console.log("Scopes:");
  const scopeCount = await enrichScopes(sources);

  console.log("\nArticles:");
  const articleCount = await enrichArticles(sources);

  console.log("\nEvents:");
  const eventCount = await enrichEvents(sources);

  console.log("\nOrganizations:");
  const orgCount = await enrichOrganizations(sources);

  console.log(
    `\nDone. Updated ${scopeCount} scopes, ${articleCount} articles, ${eventCount} events, ${orgCount} organizations.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
