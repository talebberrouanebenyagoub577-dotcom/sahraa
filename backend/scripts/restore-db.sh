#!/bin/bash
# SAHRAA PostgreSQL Restore Script
# Usage: ./scripts/restore-db.sh backups/sahraa_20250609_120000.sql.gz

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  echo "Available backups:"
  ls -lh backups/sahraa_*.sql.gz 2>/dev/null || echo "  No backups found."
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

source .env 2>/dev/null || true

PGUSER="${POSTGRES_USER:-sahraa}"
PGDATABASE="${POSTGRES_DB:-sahraa}"

echo "WARNING: This will REPLACE the current database!"
echo "Backup file: $BACKUP_FILE"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Stopping application..."
docker compose stop app

echo "Restoring database..."
docker compose exec -T postgres psql -U "$PGUSER" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$PGDATABASE' AND pid <> pg_backend_pid();" || true
docker compose exec -T postgres dropdb -U "$PGUSER" --if-exists "$PGDATABASE"
docker compose exec -T postgres createdb -U "$PGUSER" "$PGDATABASE"
gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U "$PGUSER" -d "$PGDATABASE" -q

echo "Restarting application..."
docker compose start app

echo "Restore complete."
