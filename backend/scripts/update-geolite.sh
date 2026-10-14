#!/bin/sh
# Download GeoLite2-Country into MAXMIND_DB_PATH.
# Requires MAXMIND_ACCOUNT_ID, MAXMIND_LICENSE_KEY, and MAXMIND_DB_PATH.
# Do not print the license key. The database is not committed.
set -eu
if [ -z "${MAXMIND_ACCOUNT_ID:-}" ] || [ -z "${MAXMIND_LICENSE_KEY:-}" ] || [ -z "${MAXMIND_DB_PATH:-}" ]; then
  echo "MAXMIND_ACCOUNT_ID, MAXMIND_LICENSE_KEY, and MAXMIND_DB_PATH are required" >&2
  exit 1
fi
tmp="$(mktemp -d)"
archive="$tmp/geolite.tar.gz"
curl -fsSL -u "${MAXMIND_ACCOUNT_ID}:${MAXMIND_LICENSE_KEY}" \
  "https://download.maxmind.com/geoip/databases/GeoLite2-Country/download?suffix=tar.gz" \
  -o "$archive"
tar -xzf "$archive" -C "$tmp"
found="$(find "$tmp" -name 'GeoLite2-Country.mmdb' | head -n 1)"
if [ -z "$found" ]; then
  echo "GeoLite2-Country.mmdb was not in the archive" >&2
  exit 1
fi
mkdir -p "$(dirname "$MAXMIND_DB_PATH")"
mv "$found" "$MAXMIND_DB_PATH"
rm -rf "$tmp"
echo "GeoLite2-Country updated"
