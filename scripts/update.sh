#!/bin/bash
# SAHRAA Application Update Script
# Pulls latest code and redeploys with zero-downtime rolling update

set -euo pipefail

cd "$(dirname "$0")/.."

echo "============================================"
echo "  SAHRAA Application Update"
echo "============================================"

echo "[1/5] Pulling latest code..."
git pull origin main 2>/dev/null || git pull 2>/dev/null || echo "Git pull skipped."

echo "[2/5] Building new application image..."
docker compose build app

echo "[3/5] Running database migrations..."
docker compose run --rm migrate

echo "[4/5] Rolling update..."
docker compose up -d --no-deps app

echo "[5/5] Verifying health..."
sleep 15

if docker compose exec -T app node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
  echo "Update successful!"
  docker image prune -f
else
  echo "ERROR: Health check failed after update!"
  echo "Check logs: docker compose logs app --tail 50"
  exit 1
fi

echo "============================================"
echo "  SAHRAA updated successfully"
echo "============================================"
