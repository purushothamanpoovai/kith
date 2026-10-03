import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type ContentLabel,
  type ContentType,
  type ContentVisibility,
  type EventKind,
  type EventVisibility,
  type HeritageArchiveTier,
  type MediaRights,
  type RsvpMode,
  type ScopeType,
  type SubscriptionTargetType,
  type UserRole,
  type OrganizationKind,
  type OrganizationMemberRole,
  type OrganizationPublishMode,
  type OrganizationStatus,
  type ContentOrigin,
} from "../../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing DATABASE_URL");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const seedDir = path.dirname(fileURLToPath(import.meta.url));

type Localized = Record<string, string>;

type SeedUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  slug: string;
  role: UserRole;
  locale: string;
  primaryLanguage: string;
  additionalLanguages?: string[];
  bio?: string;
};

type SeedScope = {
  id: string;
  type: ScopeType;
  slug: string;
  parentId: string | null;
  sortOrder?: number;
  title: Localized;
  description?: Localized;
  modules?: string[];
};

async function readJson<T>(filename: string): Promise<T> {
  const raw = await readFile(path.join(seedDir, filename), "utf8");
  return JSON.parse(raw) as T;
}

async function seedUsers() {
  const users = await readJson<SeedUser[]>("users.json");
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email.toLowerCase(),
        passwordHash,
        name: user.name,
        slug: user.slug,
        role: user.role,
        locale: user.locale,
        primaryLanguage: user.primaryLanguage,
        additionalLanguages: user.additionalLanguages ?? [],
        profile: {
          create: {
            bio: user.bio,
            visibility: "public",
          },
        },
      },
      update: {
        email: user.email.toLowerCase(),
        name: user.name,
        slug: user.slug,
        role: user.role,
        locale: user.locale,
        primaryLanguage: user.primaryLanguage,
        additionalLanguages: user.additionalLanguages ?? [],
      },
    });
  }
}

async function seedScopes() {
  const scopes = await readJson<SeedScope[]>("scopes.json");
  const remaining = [...scopes];
  const created = new Set<string>();

  while (remaining.length > 0) {
    const next = remaining.filter(
      (scope) => !scope.parentId || created.has(scope.parentId),
    );
    if (next.length === 0) {
      throw new Error("Scope seed has a missing or cyclic parentId");
    }
    for (const scope of next) {
      await prisma.scope.upsert({
        where: { id: scope.id },
        create: {
          id: scope.id,
          type: scope.type,
          slug: scope.slug,
          parentId: scope.parentId,
          title: scope.title,
          description: scope.description ?? undefined,
          modules: scope.modules ?? [],
          sortOrder: scope.sortOrder ?? 0,
        },
        update: {
          type: scope.type,
          slug: scope.slug,
          parentId: scope.parentId,
          title: scope.title,
          description: scope.description ?? undefined,
          modules: scope.modules ?? [],
          sortOrder: scope.sortOrder ?? 0,
        },
      });
      created.add(scope.id);
    }
    remaining.splice(
      0,
      remaining.length,
      ...remaining.filter((scope) => !created.has(scope.id)),
    );
  }
}

async function rebuildClosures() {
  await prisma.scopeClosure.deleteMany();
  const scopes = await prisma.scope.findMany();
  const byId = new Map(scopes.map((scope) => [scope.id, scope]));

  for (const scope of scopes) {
    let depth = 0;
    let current: (typeof scope) | undefined = scope;
    while (current) {
      await prisma.scopeClosure.create({
        data: {
          ancestorId: current.id,
          descendantId: scope.id,
          depth,
        },
      });
      current = current.parentId ? byId.get(current.parentId) : undefined;
      depth += 1;
    }
  }
}

type SeedContent = {
  id: string;
  type: ContentType;
  slug: string;
  title: Localized;
  summary?: Localized;
  body?: Localized;
  blocks?: unknown;
  authorId: string;
  publishedById?: string;
  ownerUserId?: string;
  ownerOrganizationId?: string;
  origin?: "community" | "official";
  originalLanguage: string;
  contentLabel?: ContentLabel;
  readingMinutes?: number;
  coverImage?: string;
  embedUrl?: string;
  embedProvider?: "youtube" | "spotify" | "soundcloud";
  transcript?: Localized;
  originalText?: Localized;
  transliteration?: Localized;
  translation?: Localized;
  trendingScore?: number;
  scopeIds: string[];
};

type SeedSubscription = {
  id: string;
  userId: string;
  targetType: SubscriptionTargetType;
  scopeId?: string;
  authorId?: string;
  organizationId?: string;
  active?: boolean;
  notify?: boolean;
  feedPriority?: number;
};

async function seedContent() {
  const articles = await readJson<SeedContent[]>("articles.json");
  const posts = await readJson<SeedContent[]>("posts.json");
  const media = await readJson<SeedContent[]>("media.json");
  const orgContent = await readJson<SeedContent[]>("org-content.json");
  const all = [...articles, ...posts, ...media, ...orgContent];

  for (const item of all) {
    const origin: ContentOrigin = item.origin ?? (item.ownerOrganizationId ? "official" : "community");
    await prisma.content.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        type: item.type,
        slug: item.slug,
        title: item.title,
        summary: item.summary ?? undefined,
        body: item.body ?? undefined,
        blocks: item.blocks ?? undefined,
        authorId: item.authorId,
        publishedById: item.publishedById ?? item.authorId,
        ownerUserId: item.ownerOrganizationId ? undefined : (item.ownerUserId ?? item.authorId),
        ownerOrganizationId: item.ownerOrganizationId ?? undefined,
        origin,
        originalLanguage: item.originalLanguage,
        contentLabel: item.contentLabel ?? undefined,
        readingMinutes: item.readingMinutes ?? undefined,
        coverImage: item.coverImage ?? undefined,
        embedUrl: item.embedUrl ?? undefined,
        embedProvider: item.embedProvider ?? undefined,
        transcript: item.transcript ?? undefined,
        originalText: item.originalText ?? undefined,
        transliteration: item.transliteration ?? undefined,
        translation: item.translation ?? undefined,
        trendingScore: item.trendingScore ?? Math.floor(Math.random() * 40) + 10,
        status: "published",
        visibility: "public",
      },
      update: {
        type: item.type,
        slug: item.slug,
        title: item.title,
        summary: item.summary ?? undefined,
        body: item.body ?? undefined,
        blocks: item.blocks ?? undefined,
        authorId: item.authorId,
        publishedById: item.publishedById ?? item.authorId,
        ownerUserId: item.ownerOrganizationId ? null : (item.ownerUserId ?? item.authorId),
        ownerOrganizationId: item.ownerOrganizationId ?? null,
        origin,
        originalLanguage: item.originalLanguage,
        contentLabel: item.contentLabel ?? undefined,
        readingMinutes: item.readingMinutes ?? undefined,
        coverImage: item.coverImage ?? undefined,
        embedUrl: item.embedUrl ?? undefined,
        embedProvider: item.embedProvider ?? undefined,
        transcript: item.transcript ?? undefined,
        originalText: item.originalText ?? undefined,
        transliteration: item.transliteration ?? undefined,
        translation: item.translation ?? undefined,
      },
    });

    await prisma.contentScope.deleteMany({ where: { contentId: item.id } });
    for (const scopeId of item.scopeIds) {
      await prisma.contentScope.create({
        data: { contentId: item.id, scopeId },
      });
    }
  }
}

async function seedSubscriptions() {
  const subscriptions = await readJson<SeedSubscription[]>("subscriptions.json");
  for (const sub of subscriptions) {
    await prisma.subscription.upsert({
      where: { id: sub.id },
      create: {
        id: sub.id,
        userId: sub.userId,
        targetType: sub.targetType,
        scopeId: sub.scopeId ?? undefined,
        authorId: sub.authorId ?? undefined,
        organizationId: sub.organizationId ?? undefined,
        active: sub.active ?? true,
        notify: sub.notify ?? true,
        feedPriority: sub.feedPriority ?? 0,
      },
      update: {
        targetType: sub.targetType,
        scopeId: sub.scopeId ?? undefined,
        authorId: sub.authorId ?? undefined,
        organizationId: sub.organizationId ?? undefined,
        active: sub.active ?? true,
        notify: sub.notify ?? true,
        feedPriority: sub.feedPriority ?? 0,
      },
    });
  }
}

type SeedEventTicketTier = {
  id: string;
  name: Localized;
  description?: Localized;
  capacity?: number | null;
  sortOrder?: number;
};

type SeedEvent = {
  id: string;
  slug: string;
  kind: EventKind;
  title: Localized;
  description?: Localized;
  startsAt: string;
  endsAt?: string;
  timezone: string;
  venueName?: Localized;
  venueAddress?: Localized;
  onlineUrl?: string;
  coverImage?: string;
  language: string;
  organizerId: string;
  organizationId?: string;
  visibility: EventVisibility;
  rsvpMode: RsvpMode;
  cancelled?: boolean;
  scopeIds: string[];
  ticketTiers?: SeedEventTicketTier[];
  invitation?: {
    id: string;
    slug: string;
    hostName: string;
    message?: Localized;
    visibility?: EventVisibility;
    shareToken?: string;
  };
};

type SeedHeritageEntry = {
  content: SeedContent & { visibility?: ContentVisibility };
  lineage: {
    id: string;
    recordedByName?: string;
    originallyToldBy?: string;
    location?: Localized;
    approximatePeriod?: string;
    sourceNote?: string;
    rights: MediaRights;
    archiveTier: HeritageArchiveTier;
    contributorId?: string;
  };
};

async function seedEvents() {
  const events = await readJson<SeedEvent[]>("events.json");
  for (const event of events) {
    await prisma.event.upsert({
      where: { id: event.id },
      create: {
        id: event.id,
        slug: event.slug,
        kind: event.kind,
        title: event.title,
        description: event.description ?? undefined,
        startsAt: new Date(event.startsAt),
        endsAt: event.endsAt ? new Date(event.endsAt) : undefined,
        timezone: event.timezone,
        venueName: event.venueName ?? undefined,
        venueAddress: event.venueAddress ?? undefined,
        onlineUrl: event.onlineUrl ?? undefined,
        coverImage: event.coverImage ?? undefined,
        language: event.language,
        organizerId: event.organizerId,
        organizationId: event.organizationId ?? undefined,
        visibility: event.visibility,
        rsvpMode: event.rsvpMode,
        cancelled: event.cancelled ?? false,
      },
      update: {
        slug: event.slug,
        kind: event.kind,
        title: event.title,
        description: event.description ?? undefined,
        startsAt: new Date(event.startsAt),
        endsAt: event.endsAt ? new Date(event.endsAt) : undefined,
        timezone: event.timezone,
        venueName: event.venueName ?? undefined,
        venueAddress: event.venueAddress ?? undefined,
        onlineUrl: event.onlineUrl ?? undefined,
        coverImage: event.coverImage ?? undefined,
        language: event.language,
        organizerId: event.organizerId,
        organizationId: event.organizationId ?? null,
        visibility: event.visibility,
        rsvpMode: event.rsvpMode,
        cancelled: event.cancelled ?? false,
      },
    });

    await prisma.eventScope.deleteMany({ where: { eventId: event.id } });
    for (const scopeId of event.scopeIds) {
      await prisma.eventScope.create({ data: { eventId: event.id, scopeId } });
    }

    for (const tier of event.ticketTiers ?? []) {
      await prisma.eventTicketTier.upsert({
        where: { id: tier.id },
        create: {
          id: tier.id,
          eventId: event.id,
          name: tier.name,
          description: tier.description ?? undefined,
          capacity: tier.capacity ?? null,
          sortOrder: tier.sortOrder ?? 0,
        },
        update: {
          name: tier.name,
          description: tier.description ?? undefined,
          capacity: tier.capacity ?? null,
          sortOrder: tier.sortOrder ?? 0,
        },
      });
    }

    if (event.invitation) {
      await prisma.invitation.upsert({
        where: { id: event.invitation.id },
        create: {
          id: event.invitation.id,
          eventId: event.id,
          slug: event.invitation.slug,
          hostName: event.invitation.hostName,
          message: event.invitation.message ?? undefined,
          visibility: event.invitation.visibility ?? event.visibility,
          shareToken: event.invitation.shareToken ?? undefined,
        },
        update: {
          slug: event.invitation.slug,
          hostName: event.invitation.hostName,
          message: event.invitation.message ?? undefined,
          visibility: event.invitation.visibility ?? event.visibility,
          shareToken: event.invitation.shareToken ?? undefined,
        },
      });
    }
  }
}

async function seedHeritage() {
  const entries = await readJson<SeedHeritageEntry[]>("heritage.json");
  for (const entry of entries) {
    const item = entry.content;
    await prisma.content.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        type: item.type,
        slug: item.slug,
        title: item.title,
        summary: item.summary ?? undefined,
        body: item.body ?? undefined,
        blocks: item.blocks ?? undefined,
        authorId: item.authorId,
        originalLanguage: item.originalLanguage,
        contentLabel: item.contentLabel ?? undefined,
        readingMinutes: item.readingMinutes ?? undefined,
        coverImage: item.coverImage ?? undefined,
        embedUrl: item.embedUrl ?? undefined,
        embedProvider: item.embedProvider ?? undefined,
        transcript: item.transcript ?? undefined,
        originalText: item.originalText ?? undefined,
        transliteration: item.transliteration ?? undefined,
        translation: item.translation ?? undefined,
        visibility: item.visibility ?? "public",
        status: "published",
      },
      update: {
        type: item.type,
        slug: item.slug,
        title: item.title,
        summary: item.summary ?? undefined,
        body: item.body ?? undefined,
        authorId: item.authorId,
        originalLanguage: item.originalLanguage,
        contentLabel: item.contentLabel ?? undefined,
        coverImage: item.coverImage ?? undefined,
        embedUrl: item.embedUrl ?? undefined,
        embedProvider: item.embedProvider ?? undefined,
        transcript: item.transcript ?? undefined,
        visibility: item.visibility ?? "public",
      },
    });

    await prisma.contentScope.deleteMany({ where: { contentId: item.id } });
    for (const scopeId of item.scopeIds) {
      await prisma.contentScope.create({ data: { contentId: item.id, scopeId } });
    }

    const lineage = entry.lineage;
    await prisma.heritageLineage.upsert({
      where: { id: lineage.id },
      create: {
        id: lineage.id,
        contentId: item.id,
        recordedByName: lineage.recordedByName ?? undefined,
        originallyToldBy: lineage.originallyToldBy ?? undefined,
        location: lineage.location ?? undefined,
        approximatePeriod: lineage.approximatePeriod ?? undefined,
        sourceNote: lineage.sourceNote ?? undefined,
        rights: lineage.rights,
        archiveTier: lineage.archiveTier,
        contributorId: lineage.contributorId ?? undefined,
      },
      update: {
        recordedByName: lineage.recordedByName ?? undefined,
        originallyToldBy: lineage.originallyToldBy ?? undefined,
        location: lineage.location ?? undefined,
        approximatePeriod: lineage.approximatePeriod ?? undefined,
        sourceNote: lineage.sourceNote ?? undefined,
        rights: lineage.rights,
        archiveTier: lineage.archiveTier,
        contributorId: lineage.contributorId ?? undefined,
      },
    });
  }
}

async function seedModerators() {
  const pairs: Array<{ userId: string; scopeId: string; organizationId?: string }> = [
    { userId: "user_admin", scopeId: "shaivism" },
    { userId: "user_contrib_kavitha", scopeId: "shaivism" },
    { userId: "user_contrib_maria", scopeId: "catholicism" },
    { userId: "user_contrib_rajesh", scopeId: "hinduism" },
    { userId: "user_contrib_fatima", scopeId: "topic-devotion" },
    { userId: "user_contrib_leela", scopeId: "lang-ml" },
    { userId: "user_priya_sharma", scopeId: "hinduism", organizationId: "org_shirdi_sai_temple" },
  ];
  for (const pair of pairs) {
    await prisma.scopeModerator.upsert({
      where: { userId_scopeId: { userId: pair.userId, scopeId: pair.scopeId } },
      create: pair,
      update: { organizationId: pair.organizationId ?? null },
    });
  }
}

type SeedOrganizationService = {
  id: string;
  name: Localized;
  language?: string;
  dayOfWeek?: number | null;
  startTime: string;
  endTime?: string;
  note?: Localized;
  sortOrder?: number;
};

type SeedOrganization = {
  id: string;
  slug: string;
  name: Localized;
  description?: Localized;
  kind: OrganizationKind;
  status: OrganizationStatus;
  publishMode?: OrganizationPublishMode;
  scopeIds?: string[];
  website?: string;
  location?: Localized;
  members?: Array<{ userId: string; role: OrganizationMemberRole }>;
  services?: SeedOrganizationService[];
};

type SeedProduct = {
  id: string;
  organizationId: string;
  name: Localized;
  description?: Localized;
  imageUrl?: string;
  price?: string;
  purchaseUrl: string;
  sortOrder?: number;
  active?: boolean;
};

type SeedExploreSection = {
  id: string;
  key: string;
  scopeType: ScopeType | null;
  label?: Localized;
  imageUrl?: string;
  icon?: string;
  href: string;
  sortOrder?: number;
  active?: boolean;
};

async function seedOrganizations() {
  const orgs = await readJson<SeedOrganization[]>("organizations.json");
  for (const org of orgs) {
    await prisma.organization.upsert({
      where: { id: org.id },
      create: {
        id: org.id,
        slug: org.slug,
        name: org.name,
        description: org.description,
        kind: org.kind,
        status: org.status,
        publishMode: org.publishMode ?? "admin_approval",
        website: org.website,
        location: org.location,
        verifiedAt: org.status === "verified" ? new Date() : undefined,
        createdById: "user_admin",
      },
      update: {
        slug: org.slug,
        name: org.name,
        description: org.description,
        kind: org.kind,
        status: org.status,
        publishMode: org.publishMode ?? "admin_approval",
        website: org.website,
        location: org.location,
        verifiedAt: org.status === "verified" ? new Date() : undefined,
      },
    });

    if (org.scopeIds?.length) {
      await prisma.organizationScope.deleteMany({ where: { organizationId: org.id } });
      for (const scopeId of org.scopeIds) {
        await prisma.organizationScope.create({
          data: { organizationId: org.id, scopeId },
        });
      }
    }

    for (const member of org.members ?? []) {
      await prisma.organizationMembership.upsert({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: member.userId,
          },
        },
        create: {
          organizationId: org.id,
          userId: member.userId,
          role: member.role,
        },
        update: { role: member.role, active: true },
      });
    }

    for (const service of org.services ?? []) {
      await prisma.organizationService.upsert({
        where: { id: service.id },
        create: {
          id: service.id,
          organizationId: org.id,
          name: service.name,
          language: service.language ?? "en",
          dayOfWeek: service.dayOfWeek ?? null,
          startTime: service.startTime,
          endTime: service.endTime ?? undefined,
          note: service.note ?? undefined,
          sortOrder: service.sortOrder ?? 0,
        },
        update: {
          name: service.name,
          language: service.language ?? "en",
          dayOfWeek: service.dayOfWeek ?? null,
          startTime: service.startTime,
          endTime: service.endTime ?? null,
          note: service.note ?? undefined,
          sortOrder: service.sortOrder ?? 0,
        },
      });
    }
  }
}

async function seedProducts() {
  const products = await readJson<SeedProduct[]>("products.json");
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        organizationId: product.organizationId,
        name: product.name,
        description: product.description ?? undefined,
        imageUrl: product.imageUrl ?? undefined,
        price: product.price ?? undefined,
        purchaseUrl: product.purchaseUrl,
        sortOrder: product.sortOrder ?? 0,
        active: product.active ?? true,
      },
      update: {
        name: product.name,
        description: product.description ?? undefined,
        imageUrl: product.imageUrl ?? undefined,
        price: product.price ?? undefined,
        purchaseUrl: product.purchaseUrl,
        sortOrder: product.sortOrder ?? 0,
        active: product.active ?? true,
      },
    });
  }
}

async function seedExploreSections() {
  const sections = await readJson<SeedExploreSection[]>("explore-sections.json");
  for (const section of sections) {
    await prisma.exploreSection.upsert({
      where: { key: section.key },
      create: {
        id: section.id,
        key: section.key,
        scopeType: section.scopeType ?? undefined,
        label: section.label ?? undefined,
        imageUrl: section.imageUrl ?? undefined,
        icon: section.icon ?? undefined,
        href: section.href,
        sortOrder: section.sortOrder ?? 0,
        active: section.active ?? true,
      },
      // Label/image/icon/active are admin-owned once the row exists, so a
      // re-seed only refreshes the structural fields.
      update: {
        scopeType: section.scopeType ?? null,
        href: section.href,
      },
    });
  }
}

async function main() {
  await seedUsers();
  await seedScopes();
  await rebuildClosures();
  await seedOrganizations();
  await seedProducts();
  await seedExploreSections();
  await seedContent();
  await seedHeritage();
  await seedSubscriptions();
  await seedEvents();
  await seedModerators();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
