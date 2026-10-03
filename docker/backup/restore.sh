#!/bin/sh
set -eu

if [ "${1:-}" = "" ]; then
  echo "Usage: restore.sh /backups/postgres/kith-YYYYMMDDTHHMMSSZ.dump"
  exit 1
fi

DUMP_FILE="$1"

echo "Restoring ${DUMP_FILE} into ${PGDATABASE}..."
pg_restore --clean --if-exists --no-owner --dbname="${PGDATABASE}" "${DUMP_FILE}"
echo "Restore complete. Restart the app container to pick up schema changes if needed."
