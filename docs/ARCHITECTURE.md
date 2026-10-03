# Kith — Architecture & Role Model

> **Product boundary:** Global religious + devotional + cultural heritage community platform.  
> **Not** a general-purpose social network.

This document assesses the current implementation (Phase 0–10), defines the target role/organization model, and outlines an incremental migration plan.

---

## 1. Current architecture assessment

### What exists today

| Layer | Status | Notes |
|-------|--------|-------|
| **Stack** | ✅ Solid | Docker Compose, Next.js 16, PostgreSQL, Prisma 7, Nginx, local media |
| **Scopes** | ✅ Good foundation | Religion, tradition, entity, topic, region, language, etc. + closure table |
| **Content** | ⚠️ Partial | Articles, posts, media, heritage; single `authorId`; no ownership split |
| **Auth** | ✅ Working | Credentials + DB sessions; visitor vs signed-in |
| **Subscriptions** | ⚠️ Partial | Scope + author only; no organization follows |
| **Events / RSVP** | ✅ Basic | User-organizer; no organization events |
| **Moderation** | ⚠️ Partial | Reports queue; flat role check; no escalation hierarchy |
| **Admin** | ⚠️ Minimal | `/admin` = moderation queue only |
| **Create UX** | ❌ Wrong | `/create` visible to all; placeholder only |
| **Organizations** | ❌ Missing | `ScopeType.organization` exists but no Organization entity |
| **Permissions** | ❌ Scattered | `lib/permissions.ts` — 30 lines, role string checks only |
| **Audit log** | ❌ Missing | No record of admin actions |

### Current roles (`UserRole` enum)

| Role | Current meaning | Target mapping |
|------|-----------------|----------------|
| `user` | Registered member | **Community Member** — read, follow, react, comment |
| `contributor` | Implicit publisher (seed) | **Remove global publish** → scope/org assignment only |
| `admin` | Platform admin | **`super_admin`** |
| `global_moderator` | Staff moderator | Merge into **`super_admin`** or scoped **`content_publisher`** |
| `scope_moderator` | Scope-limited mod | **`ScopeModerator`** table + permissions |
| `community_moderator` | Community mod | **Organization `content_moderator`** role |

### Critical gaps vs target model

1. **No Organization entity** — cannot model temples, churches, trusts, etc.
2. **No createdBy / publishedBy / owner split** — content tied only to `authorId`
3. **No official vs community distinction** in UI or schema
4. **Create nav shown to everyone** — violates “normal users don't publish”
5. **No centralized `can(user, action, resource)`** — security risk as features grow
6. **ScopeModerator** exists but unused in permission checks
7. **No organization verification workflow**
8. **No audit trail** for role/org changes

### What to preserve (do not break)

- Scope discovery graph and seed JSON → DB pipeline
- Repository → service → page data flow (UI never reads JSON)
- Multilingual routing (en, ta, hi, ml, ur) + RTL
- Feed scoring, subscriptions, community interactions
- Events, heritage, moderation queue (extend, don't replace)

---

## 2. Required schema changes

### New enums

- `PlatformRole` refinement via `UserRole` cleanup (see migration)
- `OrganizationKind` — religion-neutral org types
- `OrganizationStatus` — pending | verified | rejected | suspended
- `OrganizationPublishMode` — immediate | admin_approval | editor_workflow
- `OrganizationMemberRole` — org_admin | content_moderator | event_manager | media_manager | translator
- `ContentOrigin` — community | official
- `ScopeModeratorPermission` — publish | edit | moderate

### New models

```
Organization
OrganizationMembership  (user ↔ org + role)
OrganizationScope         (org ↔ scope)
AuditLog                  (admin actions)
```

### Content ownership (extend `Content`)

```
createdById         → User     (was authorId — kept as alias)
publishedById       → User?
ownerUserId         → User?    (independent publisher ownership)
ownerOrganizationId → Organization?
origin              ContentOrigin
```

**Validation rule:** For published content, exactly one owner path:
- `ownerOrganizationId` set → official org content
- else `ownerUserId` or default to `createdById` → community/personal content

### Event extension

```
organizationId → Organization?  (org-hosted events)
```

### Subscription extension

```
SubscriptionTargetType + organization
```

### Deferred (post-MVP)

- `ContentRevision` — track edit history (schema stub optional)
- Premium organization features
- Full approval workflow UI (schema supports `OrganizationPublishMode`)

---

## 3. Required permission changes

### Central permission service

```typescript
can(user, action, context?) → boolean
```

**Actions (MVP):**

| Action | Visitor | Member | Scope publisher | Org moderator | Org admin | Super admin |
|--------|---------|--------|-----------------|---------------|-----------|-------------|
| `content:read:public` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `content:react` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `content:comment` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `content:bookmark` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `scope:subscribe` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `content:create` | ❌ | ❌ | scope* | org scope* | org | ✅ |
| `content:publish` | ❌ | ❌ | scope* | org* | org | ✅ |
| `organization:manage` | ❌ | ❌ | ❌ | ❌ | own org | ✅ |
| `organization:create` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `admin:access` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

\*Within assigned scope and/or organization context.

### Evaluation order

```
ROLE + ORGANIZATION + SCOPE + RESOURCE + ACTION
```

1. Super admin → allow (except explicit denies)
2. Organization admin → org resources
3. Organization role → org resources per role
4. ScopeModerator (public) → scope tree match
5. Default deny

### Server-side rule

**Every mutation** must call `can()` — never trust UI alone.

---

## 4. Required UI changes

| Area | Change |
|------|--------|
| **Navigation** | Hide Create / Publisher Studio unless authorized; Admin only for super_admin |
| **Visitors** | Read-only; auth prompts on react/comment/follow/RSVP |
| **Role badge** | Header shows human-readable role context |
| **Content cards** | Official vs Community badge; org name when official |
| **Create page** | Gate + publishing context selector for org publishers |
| **Admin** | Organizations, Users, Roles sections (MVP: org CRUD + assign admin) |
| **Org dashboard** | Stub route for org admins (`/org/[slug]/manage`) |

---

## 5. Required seed-data changes

Acceptance-test scenario:

1. `super_admin` — `admin@kith.local`
2. `member` — `member@kith.local` (Amara Devi)
3. Organization — **Shirdi Sai Baba Temple** (verified)
4. **Ravi Kumar** — Organization Admin
5. **Second user** — Organization Content Moderator
6. **Public content publisher** — scope: Tamil devotional literature (no org)
7. Sample official org article (owned by temple, created by moderator)
8. Sample community post (owned by member)

Existing contributor seed users → reclassified as `ScopeModerator` entries, not global publishers.

---

## 6. Migration plan

### Migration `20260901220000_roles_organizations`

1. Add enum values + new tables (non-destructive)
2. Add Content ownership columns; backfill `publishedById = authorId`, `ownerUserId = authorId`, `origin = community`
3. Add Organization seed data
4. Map `admin` → `super_admin` in application layer (enum alias)

### Rollback strategy

New columns nullable; old `authorId` unchanged. Organizations additive.

---

## 7. Implementation order

| Step | Deliverable | Status |
|------|-------------|--------|
| 1 | This document | ✅ |
| 2 | Prisma schema + migration | ✅ |
| 3 | `permission-service.ts` | ✅ |
| 4 | Wire server actions | ✅ (MVP) |
| 5 | Organization repository + seed | ✅ |
| 6 | Nav + role badge + content attribution UI | ✅ |
| 7 | Admin organization management (MVP) | ✅ |
| 8 | Org dashboard stub | ✅ |
| 9 | Full approval workflow UI | Post-MVP |
| 10 | ContentRevision | Post-MVP |

---

## 8. Content ownership examples

### Official organization content

```
createdBy:     Kavitha (org content moderator)
publishedBy:   Kavitha
publishedAs:   Shirdi Sai Baba Temple
owner:         Shirdi Sai Baba Temple
origin:        official
```

If Kavitha leaves the temple, content remains with the organization.

### Independent public publisher

```
createdBy:     Maria Thomas
publishedBy:   Maria Thomas
owner:         Maria Thomas
origin:        community
organization:  (none)
```

### Community member reflection

```
createdBy:     Amara Devi
owner:         Amara Devi
origin:        community
contentLabel:  personal_reflection
```

---

## 9. Moderation escalation (target)

```
Community report
  → Organization content moderator
  → Organization admin
  → Global scope moderator / super admin
```

MVP: existing report queue + `can(user, 'moderation:act', report)` checks.

---

## 10. Acceptance test mapping

| # | Scenario | MVP implementation |
|---|----------|---------------------|
| 1–4 | Visitor read / comment prompt | Auth prompts + server reject |
| 5–7 | Register, interact, no publish | Permission service + nav gate |
| 8–10 | Super admin creates org, assigns Ravi | Admin org actions + seed |
| 11–15 | Moderator publish as org, ownership | Content fields + attribution UI |
| 16 | Moderator denied other org | `can()` scope/org check |
| 17–18 | Public publisher, individual owner | ScopeModerator without org |
| 19 | Super admin manages all | super_admin bypass |
| 20 | Official badge | ContentOrigin UI |
| 21 | No admin controls for members | Nav filtering |
| 22 | Server rejects unauthorized | All actions use `can()` |
| 23–24 | Staff removal preserves content | ownerOrganizationId, not createdBy |
| 25 | Religion-neutral | OrganizationKind enum |

---

## 11. Infrastructure constraints (unchanged)

- No Redis, microservices, K8s, Elasticsearch, cloud services
- Docker Compose monolith
- Local media storage
- Multilingual + RTL preserved
