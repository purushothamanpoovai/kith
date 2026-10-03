export {
  getHeritageBySlug,
  listHeritageArchive,
  searchHeritage,
} from "@/repositories/heritage-repository";
export type { HeritageRecord } from "@/repositories/heritage-repository";

import type { HeritageRecord } from "@/repositories/heritage-repository";
import { pickLocalized } from "@/lib/localized";

export function heritageTitle(item: HeritageRecord, locale: string): string {
  return pickLocalized(item.title, locale);
}

export function heritageSummary(item: HeritageRecord, locale: string): string {
  return pickLocalized(item.summary, locale);
}

export function heritageText(item: HeritageRecord, locale: string): string {
  return (
    pickLocalized(item.transcript, locale) ||
    pickLocalized(item.body, locale) ||
    pickLocalized(item.summary, locale)
  );
}

export function heritageLocation(item: HeritageRecord, locale: string): string {
  return pickLocalized(item.lineage.location, locale);
}
