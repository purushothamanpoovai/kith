#!/bin/sh
set -eu

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
DEST_DB="/backups/postgres"
DEST_MEDIA="/backups/media"

mkdir -p "$DEST_DB" "$DEST_MEDIA"

echo "[backup] dumping database at ${TIMESTAMP}"
pg_dump --format=custom --file="${DEST_DB}/kith-${TIMESTAMP}.dump"

if [ -d /data/media ]; then
  echo "[backup] archiving media"
  tar -czf "${DEST_MEDIA}/media-${TIMESTAMP}.tar.gz" -C /data media 2>/dev/null || tar -czf "${DEST_MEDIA}/media-${TIMESTAMP}.tar.gz" -C /data/media .
fi

find "$DEST_DB" -type f -name "*.dump" -mtime "+${RETENTION_DAYS}" -delete
find "$DEST_MEDIA" -type f -name "*.tar.gz" -mtime "+${RETENTION_DAYS}" -delete

echo "[backup] complete ${TIMESTAMP}"
