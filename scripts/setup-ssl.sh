#!/bin/bash
# SAHRAA SSL Setup with Let's Encrypt
# Usage: ./scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com

set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: $0 <domain> <email>"
  echo "Example: $0 sahraa.com admin@sahraa.com"
  exit 1
fi

cd "$(dirname "$0")/.."

echo "============================================"
echo "  SAHRAA SSL Setup for: $DOMAIN"
echo "============================================"

# Ensure HTTP-only config is active and app is running
if [ -f nginx/conf.d/sahraa-ssl.conf ]; then
  echo "SSL config already active."
else
  echo "[1/5] Ensuring HTTP-only config is active..."
  # Disable SSL config if partially enabled
  mv nginx/conf.d/sahraa-ssl.conf nginx/conf.d/sahraa-ssl.conf.disabled 2>/dev/null || true
  docker compose restart nginx
fi

echo "[2/5] Obtaining SSL certificate..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

echo "[3/5] Enabling HTTPS configuration..."
# Generate SSL nginx config from template
sed "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/conf.d/sahraa-ssl.conf.disabled > nginx/conf.d/sahraa-ssl.conf

# Disable HTTP-only config
mv nginx/conf.d/sahraa-http-only.conf nginx/conf.d/sahraa-http-only.conf.disabled 2>/dev/null || true

echo "[4/5] Reloading Nginx with SSL..."
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload

echo "[5/5] Updating .env..."
if grep -q "NEXT_PUBLIC_APP_URL" .env; then
  sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$DOMAIN|" .env
else
  echo "NEXT_PUBLIC_APP_URL=https://$DOMAIN" >> .env
fi

# Rebuild app with correct URL
docker compose up -d --build app

echo ""
echo "============================================"
echo "  SSL configured successfully!"
echo "  https://$DOMAIN"
echo "  Certificates auto-renew via certbot container"
echo "============================================"
