#!/bin/bash
# SAHRAA Production Deploy Script
# Usage: ./scripts/deploy.sh [--seed]

set -euo pipefail

cd "$(dirname "$0")/.."

echo "============================================"
echo "  SAHRAA Production Deployment"
echo "============================================"

# Verify .env exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Copy .env.example to .env and configure it."
  exit 1
fi

source .env

# Validate required variables
for VAR in POSTGRES_PASSWORD JWT_SECRET JWT_REFRESH_SECRET; do
  if [ -z "${!VAR:-}" ]; then
    echo "Error: $VAR is not set in .env"
    exit 1
  fi
done

# Create required directories
mkdir -p backups certbot/conf certbot/www logs nginx/ssl

# Handle --seed flag
if [ "${1:-}" = "--seed" ]; then
  export SEED_DATABASE=true
  echo "Database seeding enabled for this deploy."
fi

echo "[1/4] Pulling latest images..."
docker compose pull postgres redis nginx certbot 2>/dev/null || true

echo "[2/4] Building application..."
docker compose build --no-cache app

echo "[3/4] Starting all services..."
docker compose up -d

echo "[4/4] Waiting for health checks..."
sleep 10

# Check service status
docker compose ps

# Verify app health
if docker compose exec -T app node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
  echo ""
  echo "============================================"
  echo "  SAHRAA deployed successfully!"
  echo "  URL: ${NEXT_PUBLIC_APP_URL:-http://localhost}"
  echo "============================================"
else
  echo ""
  echo "WARNING: App health check failed. Check logs:"
  echo "  docker compose logs app"
fi
