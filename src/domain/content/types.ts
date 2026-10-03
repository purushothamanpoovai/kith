import type { LocalizedString } from "@/lib/localized";
import type {
  ContentLabel,
  ContentOrigin,
  ContentStatus,
  ContentType,
  ContentVisibility,
  EmbedProvider,
} from "@/generated/prisma/client";

export type ContentBlock =
  | { type: "paragraph"; text: LocalizedString }
  | { type: "heading"; text: LocalizedString; level?: 2 | 3 }
  | { type: "quote"; text: LocalizedString; attribution?: LocalizedString }
  | { type: "image"; src: string; alt: string; caption?: LocalizedString };

export type ContentRecord = {
  id: string;
  type: ContentType;
  status: ContentStatus;
  /** "public" reads free of login; anything else requires a signed-in
   *  reader — enforced centrally by `canViewContent` (§ login-gated reading). */
  visibility: ContentVisibility;
  slug: string;
  title: LocalizedString;
  summary?: LocalizedString | null;
  body?: LocalizedString | null;
  blocks?: ContentBlock[] | null;
  authorId: string;
  authorName?: string;
  authorSlug?: string;
  originalLanguage: string;
  coverImage?: string | null;
  readingMinutes?: number | null;
  /** Always a validated third-party embed link (see src/lib/media/embed.ts)
   *  — Kith never stores or serves a self-hosted media file. */
  embedUrl?: string | null;
  embedProvider?: EmbedProvider | null;
  transcript?: LocalizedString | null;
  originalText?: LocalizedString | null;
  transliteration?: LocalizedString | null;
  translation?: LocalizedString | null;
  contentLabel?: ContentLabel | null;
  origin?: ContentOrigin;
  publishedById?: string | null;
  publishedByName?: string;
  ownerUserId?: string | null;
  ownerOrganizationId?: string | null;
  ownerOrganizationName?: LocalizedString | null;
  ownerOrganizationSlug?: string | null;
  trendingScore: number;
  publishedAt: Date;
  updatedAt: Date;
  scopeIds: string[];
  reactionCount?: number;
};

export type FeedItem = ContentRecord & {
  score: number;
  matchReasons: string[];
};

export type SeedContent = {
  id: string;
  type: ContentType;
  slug: string;
  title: LocalizedString;
  summary?: LocalizedString;
  body?: LocalizedString;
  blocks?: ContentBlock[];
  authorId: string;
  originalLanguage: string;
  coverImage?: string;
  readingMinutes?: number;
  embedUrl?: string;
  embedProvider?: EmbedProvider;
  transcript?: LocalizedString;
  originalText?: LocalizedString;
  transliteration?: LocalizedString;
  translation?: LocalizedString;
  contentLabel?: ContentLabel;
  trendingScore?: number;
  scopeIds: string[];
};
