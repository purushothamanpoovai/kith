import type { ScopeType } from "@/generated/prisma/client";
import type { LocalizedString } from "@/lib/localized";
import type { ScopeRecord } from "@/repositories/scope-repository";

export type ScopeBreadcrumb = {
  id: string;
  type: ScopeType;
  slug: string;
  title: LocalizedString;
  href: string;
};

export type ScopeWithRelations = ScopeRecord & {
  breadcrumbs: ScopeBreadcrumb[];
  children: ScopeRecord[];
};

export type ExploreCategory = {
  type: ScopeType;
  href: string;
  count: number;
};
