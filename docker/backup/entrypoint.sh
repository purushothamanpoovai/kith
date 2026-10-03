#!/bin/sh
set -eu

mkdir -p /backups/postgres /backups/media
echo "${BACKUP_CRON:-0 */6 * * *} /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root

echo "[backup] running initial backup"
/usr/local/bin/backup.sh || echo "[backup] initial backup skipped or failed"

echo "[backup] starting cron (${BACKUP_CRON:-0 */6 * * *})"
exec crond -f -d 8
