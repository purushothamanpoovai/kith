/**
 * Fetches factual summaries from Wikipedia's REST API (CC BY-SA 4.0).
 * Uses curl for reliable TLS in local/dev environments.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type WikiSummary = {
  title: string;
  extract: string;
  description: string;
  contentUrls?: { desktop?: { page?: string } };
  thumbnail?: { source: string };
};

const WIKI_REST = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const USER_AGENT = "KithDevotionalPlatform/1.0 (local seed enrichment; contact: dev@localhost)";

function encodeTitle(title: string): string {
  return encodeURIComponent(title.replace(/ /g, "_"));
}

function pageUrlFor(title: string, summary: WikiSummary): string {
  return (
    summary.contentUrls?.desktop?.page ??
    `https://en.wikipedia.org/wiki/${encodeTitle(summary.title || title)}`
  );
}

async function curlJson(url: string): Promise<{ status: number; body: string }> {
  const { stdout } = await execFileAsync(
    "curl",
    [
      "-sS",
      "-w",
      "\n%{http_code}",
      "-H",
      `User-Agent: ${USER_AGENT}`,
      "-H",
      "Accept: application/json",
      url,
    ],
    { maxBuffer: 10 * 1024 * 1024 },
  );

  const trimmed = stdout.trimEnd();
  const newline = trimmed.lastIndexOf("\n");
  const body = trimmed.slice(0, newline);
  const status = Number.parseInt(trimmed.slice(newline + 1), 10);
  return { status, body };
}

export async function fetchWikiSummary(title: string): Promise<(WikiSummary & { pageUrl: string }) | null> {
  const url = `${WIKI_REST}${encodeTitle(title)}`;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const { status, body } = await curlJson(url);

      if (status === 429) {
        const waitMs = 3000 * (attempt + 1);
        console.warn(`Rate limited for "${title}", waiting ${waitMs}ms…`);
        await delay(waitMs);
        continue;
      }

      if (status !== 200) {
        console.warn(`Wikipedia fetch failed for "${title}": HTTP ${status}`);
        return null;
      }

      const data = JSON.parse(body) as WikiSummary;
      if (!data.extract) {
        return null;
      }

      return {
        ...data,
        pageUrl: pageUrlFor(title, data),
      };
    } catch (error) {
      console.warn(`Wikipedia fetch error for "${title}" (attempt ${attempt + 1}):`, error);
      await delay(2000);
    }
  }

  return null;
}

export function truncateExtract(text: string, maxChars = 680): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxChars) {
    return cleaned;
  }
  const cut = cleaned.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 200 ? lastSpace : maxChars).trim()}…`;
}

export function splitIntoParagraphs(text: string, maxParagraphs = 3): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const paragraphs: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > 320 && current.length > 80) {
      paragraphs.push(current.trim());
      current = sentence;
      if (paragraphs.length >= maxParagraphs - 1) {
        break;
      }
    } else {
      current += sentence;
    }
  }
  if (current.trim() && paragraphs.length < maxParagraphs) {
    paragraphs.push(current.trim());
  }
  return paragraphs.length > 0 ? paragraphs : [text];
}

export function attributionBlock(pageTitle: string, pageUrl: string): string {
  return `This overview incorporates factual material from Wikipedia contributors, "${pageTitle}," licensed under CC BY-SA 4.0. Source: ${pageUrl}`;
}

export async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
