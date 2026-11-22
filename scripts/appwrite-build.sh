#!/bin/sh
set -eu

(
    cd backend
    ./node_modules/.bin/prisma generate
    ./node_modules/.bin/prisma migrate deploy
    if [ "${RUN_SEED:-false}" = true ]; then
        FOODJET_PRIVATE_SEED=true node prisma/seed.js
    fi
    npm prune --omit=dev --ignore-scripts --no-audit --no-fund
)

mkdir -p appwrite-dist/backend appwrite-dist/frontend
cp -R backend/package.json backend/src backend/prisma backend/node_modules appwrite-dist/backend/
for asset in index.html styles.css logo.ico fonts img js; do
    cp -R "frontend/$asset" appwrite-dist/frontend/
done

# La versión pública del curso conserva el diseño e identifica sus pagos simulados.
node -e "
const fs = require('node:fs');
const file = 'appwrite-dist/frontend/index.html';
const html = fs.readFileSync(file, 'utf8');
const main = '<main id=\x22main-content\x22>';
if (!html.includes(main)) throw new Error('No se encontró el contenido principal de FoodJet.');
const notice = '<aside class=\x22container mt-3 small text-muted\x22 aria-label=\x22Demostración académica\x22>Demostración de E-Business. Para probar pedidos y pagos, usa datos ficticios.</aside>';
fs.writeFileSync(file, html.replace(main, main + notice));
"
