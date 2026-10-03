#!/bin/sh
# SAHRAA Health Monitor
# Checks app, database, and redis health every CHECK_INTERVAL seconds

APP_URL="${APP_URL:-http://app:3000}"
CHECK_INTERVAL="${CHECK_INTERVAL:-60}"
LOG_FILE="/logs/health.log"

mkdir -p /logs

log() {
  echo "[$(date -Iseconds)] $1" >> "$LOG_FILE"
  echo "[$(date -Iseconds)] $1"
}

# Install wget if not available
apk add --no-cache wget >/dev/null 2>&1 || true

log "SAHRAA health monitor started (interval: ${CHECK_INTERVAL}s)"

while true; do
  # Check application health endpoint
  HTTP_CODE=$(wget -qO- --server-response "$APP_URL/api/health" 2>&1 | awk '/HTTP\// {print $2}' | tail -1)

  if [ "$HTTP_CODE" = "200" ]; then
    log "STATUS: healthy (HTTP $HTTP_CODE)"
  else
    log "STATUS: UNHEALTHY (HTTP ${HTTP_CODE:-timeout})"
    # Log response body for debugging
    wget -qO- "$APP_URL/api/health" 2>/dev/null >> "$LOG_FILE" || true
  fi

  # Rotate log if > 10MB
  if [ -f "$LOG_FILE" ] && [ "$(wc -c < "$LOG_FILE" 2>/dev/null || echo 0)" -gt 10485760 ]; then
    mv "$LOG_FILE" "${LOG_FILE}.old"
    log "Log rotated"
  fi

  sleep "$CHECK_INTERVAL"
done
