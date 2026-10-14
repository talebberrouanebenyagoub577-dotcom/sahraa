#!/bin/sh
set -eu
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required. Set it in EasyPanel. The API will not start." >&2
  exit 1
fi
cd /app
node --import tsx src/migrate.ts
exec node --import tsx src/server.ts
