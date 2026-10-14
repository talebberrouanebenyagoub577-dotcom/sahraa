#!/bin/sh
# SAHRAA PostgreSQL Backup Script
# Runs daily via docker-compose db-backup service

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="sahraa_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

PGHOST="${PGHOST:-postgres}"
PGUSER="${POSTGRES_USER:-sahraa}"
PGDATABASE="${POSTGRES_DB:-sahraa}"
export PGPASSWORD="${POSTGRES_PASSWORD}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup: $FILENAME"

pg_dump -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" --no-owner --no-acl | gzip > "$BACKUP_DIR/$FILENAME"

SIZE=$(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)
echo "[$(date)] Backup complete: $FILENAME ($SIZE)"

# Remove old backups
find "$BACKUP_DIR" -name "sahraa_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true

REMAINING=$(ls -1 "$BACKUP_DIR"/sahraa_*.sql.gz 2>/dev/null | wc -l)
echo "[$(date)] Retained backups: $REMAINING (max age: ${RETENTION_DAYS} days)"
