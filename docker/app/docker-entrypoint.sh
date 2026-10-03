#!/bin/sh
set -eu

MEDIA_ROOT="${MEDIA_ROOT:-/data/media}"
mkdir -p "$MEDIA_ROOT"
chown -R nextjs:nodejs "$MEDIA_ROOT" || true

echo "Waiting for PostgreSQL and applying migrations..."
i=0
until gosu nextjs npx prisma migrate deploy; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "Prisma migrate deploy failed after retries."
    exit 1
  fi
  sleep 2
done

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "Seeding database..."
  gosu nextjs npx tsx prisma/seed/index.ts
fi

echo "Starting Next.js..."
exec gosu nextjs node server.js
