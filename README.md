# Kith

On-premises multilingual community platform. Phase 0 is the operational foundation only: Docker Compose, Next.js, PostgreSQL, Prisma, Nginx, auth shell, localization, health checks, media volume, and backups.

The product UI is intentionally unfinished. Discovery, publishing, feed, events, and heritage come in later phases.

## What runs

| Service | Role |
|---|---|
| `nginx` | Reverse proxy on port 80, `/healthz`, `/media/` |
| `app` | Next.js 16 monolith (App Router) |
| `postgres` | PostgreSQL 16 |
| `backup` | `pg_dump` + media archive on a cron schedule |

There is no Redis, search cluster, Kubernetes, cloud object storage, or external identity provider.

## Requirements

- Docker Engine with the Compose v2 plugin (`docker compose`)
- At least 2 GB RAM for the first image build
- Host port `HTTP_PORT` (default 80)

If `docker` is not on your PATH, install the engine first (Ubuntu example: `docker.io` and `docker-compose-v2`), then add your user to the `docker` group.

## Deploy on a fresh machine

```bash
git clone <this-repo> kith
cd kith
cp .env.example .env
```

Edit `.env`:

```bash
# Use a long random password. Avoid @ : / # in the password; it is placed in DATABASE_URL.
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' )

# Session signing material
AUTH_SECRET=$(openssl rand -base64 48)

# Keep false until TLS is enabled in front of Nginx
AUTH_COOKIE_SECURE=false
```

Start everything:

```bash
docker compose up -d --build
```

On a machine that already has images, `docker compose up -d` is enough.

Watch startup until the app has migrated and seeded:

```bash
docker compose logs -f app
```

You should see Prisma migrate, seed, then `Starting Next.js`.

Open:

- App: http://localhost/en
- Tamil UI: http://localhost/ta
- Hindi UI: http://localhost/hi
- Nginx health: http://localhost/healthz
- App + database health: http://localhost/api/health

Expected health payload:

```json
{ "status": "ok", "db": "ok", "time": "..." }
```

## Demo accounts

Seeded on first start (idempotent upsert). Change these passwords immediately.

| Email | Password | Role |
|---|---|---|
| `admin@kith.local` | `ChangeMe_Admin_0` | super_admin |
| `member@kith.local` | `ChangeMe_Member_0` | community member (no publish) |
| `ravi.k@kith.local` | `ChangeMe_Ravi_0` | org admin — Shirdi Sai Baba Temple |
| `priya.s@kith.local` | `ChangeMe_Priya_0` | org content moderator — temple |
| `kavitha.m@kith.local` | `ChangeMe_Contrib_1` | public scope publisher (Shaivism) |

Every organization also has two dedicated dummy accounts, all sharing the password `user@123`:

| Email | Role |
|---|---|
| `<org-slug>.admin@kith.local` | org admin |
| `<org-slug>.moderator@kith.local` | org content moderator |

e.g. `shirdi-sai-baba-temple.admin@kith.local` / `nagore-dargah.moderator@kith.local`. See the `members` array in `prisma/seed/organizations.json` for the full list across all 7 seeded organizations.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the role, organization, and permission model.

Stop automatic reseeding later with `SEED_ON_START=false` if you no longer want fixture users refreshed on boot. The seed does not overwrite password hashes on update, so a changed demo password is kept.

## Data layout

Compose volumes:

- `postgres_data` — PostgreSQL files
- `media_data` — uploaded media at `/data/media` in `app` and `/data/media` in Nginx (`/media/` URL)
- `backup_data` — dumps under `/backups/postgres` and `/backups/media`

JSON under `prisma/seed/` is the canonical fixture catalog. The running app never reads those files. UI and services talk to PostgreSQL through repository/service functions.

## Backups

The `backup` container:

1. Runs one dump at start
2. Repeats on `BACKUP_CRON` (default every 6 hours)
3. Deletes files older than `BACKUP_RETENTION_DAYS` (default 7)

Inspect:

```bash
docker compose exec backup ls -l /backups/postgres /backups/media
```

Restore a database dump:

```bash
docker compose cp docker/backup/restore.sh backup:/usr/local/bin/restore.sh
docker compose exec backup chmod +x /usr/local/bin/restore.sh
docker compose exec backup restore.sh /backups/postgres/kith-YYYYMMDDTHHMMSSZ.dump
docker compose restart app
```

Restore media by extracting the matching `media-*.tar.gz` into the `media_data` volume.

## Schema and seed (operators)

Migrations run automatically in the app entrypoint (`prisma migrate deploy`).

To run seed manually:

```bash
docker compose exec app npx tsx prisma/seed/index.ts
```

Phase 0 tables only: `User`, `Profile`, `Session`, `Scope`, `ScopeClosure`. Later features add their own migrations.

## Local development (optional)

Copy `.env.example` to `.env`, then start Postgres and the dev server:

```bash
npm run db:start        # local Postgres from .data/postgres on port 5433
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Set `DATABASE_URL` and `AUTH_SECRET` in `.env` for the host process. `MEDIA_ROOT` can be `./data/media`.

### The local database

Development uses a project-local Postgres cluster stored in `.data/postgres`, run
as your own user on port **5433** — not Docker, and not the system-wide
`postgresql` service. It does **not** survive a reboot, so start it again after one:

```bash
npm run db:start     # start it
npm run db:status    # is it running?
npm run db:stop      # stop it cleanly
```

Override `PG_BIN` if your Postgres binaries live elsewhere, or `PGPORT` to use a
different port (keep it in step with `DATABASE_URL`).

> A system-wide Postgres may also be listening on the default port **5432** with a
> `kith` role of its own. That is a *different, empty* database — this project's
> data only exists on 5433. If queries suddenly return no rows, check the port.

Alternatively, `docker compose up -d postgres` runs Postgres in a container, but
note the compose service publishes its own port and does not share `.data/postgres`.

### Production build locally

`next start` does **not** work with this project's `output: "standalone"` config —
it starts and reports "Ready" but serves 404s. Use:

```bash
npm run build
npm start            # stages static/public into .next/standalone, then runs it
```

## Localization

UI locales: English (`en`), Tamil (`ta`), Hindi (`hi`). Routes are prefixed: `/ta/login`.

RTL is wired through `dir` on `<html>` and logical CSS (`margin-inline`, `inset-inline`, `border-block`). Arabic and Urdu are recognized as RTL when those locales are added later; they are not shipped as UI catalogs in Phase 0.

## Security notes

- Credentials auth only. Passwords are bcrypt-hashed. Session tokens are random and stored as HMAC-SHA256 hashes.
- Cookies are HttpOnly and SameSite=Lax. Enable `AUTH_COOKIE_SECURE=true` behind HTTPS.
- Nginx sets `client_max_body_size 50m` and rate-limits login/register.
- Upload validation helpers live in `src/lib/media/validate-upload.ts` (MIME allowlist, size cap, filename sanitization). The public upload UI is not in Phase 0.
- Do not expose PostgreSQL to the internet. It is on the internal Compose network only.

## Stopping

```bash
docker compose down
```

Volumes are kept. To destroy data:

```bash
docker compose down -v
```
