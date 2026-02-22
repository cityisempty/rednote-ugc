#!/bin/sh
set -e

cd /app/server

echo "==> Running database migrations..."
npx prisma migrate deploy

echo "==> Seeding database..."
npx prisma db seed || echo "Seed skipped (may already exist)"

echo "==> Starting Nginx..."
nginx

echo "==> Starting Node.js server..."
exec node dist/server/src/index.js
