#!/bin/sh
set -eu

(
    cd backend
    npm ci --include=dev --no-audit --no-fund
    node --input-type=module <<'NODE'
import { writeFile } from 'node:fs/promises';

const certificateUrl = 'https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt';
const response = await fetch(certificateUrl);
if (!response.ok) throw new Error(`No se pudo obtener el certificado de Supabase (${response.status}).`);
await writeFile('prisma/supabase-ca.crt', await response.text());
NODE
    ./node_modules/.bin/prisma generate
    ./node_modules/.bin/prisma migrate deploy
    if [ "${RUN_SEED:-false}" = true ]; then
        FOODJET_PRIVATE_SEED=true node prisma/seed.js
    fi
    npm prune --omit=dev --ignore-scripts --no-audit --no-fund
)

mkdir -p appwrite-web
for asset in index.html styles.css logo.ico fonts img js; do
    cp -R "frontend/$asset" appwrite-web/
done

# La versión pública del curso conserva el diseño e identifica sus pagos simulados.
node -e "
const fs = require('node:fs');
const file = 'appwrite-web/index.html';
const html = fs.readFileSync(file, 'utf8');
const main = '<main id=\x22main-content\x22>';
if (!html.includes(main)) throw new Error('No se encontró el contenido principal de FoodJet.');
const notice = '<aside class=\x22container mt-3 small text-muted\x22 aria-label=\x22Demostración académica\x22>Demostración de E-Business. Para probar pedidos y pagos, usa datos ficticios.</aside>';
fs.writeFileSync(file, html.replace(main, main + notice));
"
