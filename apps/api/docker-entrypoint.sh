#!/bin/sh
set -e

echo "[entrypoint] running migrations…"
node /app/apps/api/scripts/migrate.js

echo "[entrypoint] starting API…"
exec node /app/apps/api/dist/main.js
