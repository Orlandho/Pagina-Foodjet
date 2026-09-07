#!/bin/sh
set -e

echo "⏳ Aplicando migraciones..."
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
    echo "🌱 Ejecutando seed..."
    npx prisma db seed
fi

echo "🚀 Arrancando API..."
exec npx nodemon src/index.js
