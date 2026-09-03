# 🚀 Guía de ejecución local — FoodJet

Todo el entorno (PostgreSQL + API + web) se levanta con Docker Compose. No hace
falta instalar Node ni PostgreSQL en la máquina.

## 1. Requisitos

- Docker con el plugin `compose` (`docker compose version`).

## 2. Primer arranque

```bash
cp .env.example .env          # ajusta JWT_SECRET si quieres
docker compose build
docker compose up -d
```

El contenedor del backend aplica las migraciones de Prisma y siembra los datos
de demostración automáticamente al arrancar.

| Servicio | URL | Contenedor |
|---|---|---|
| Sitio completo (web + API) | http://localhost:8081 | `foodjet-web` (Caddy) |
| API directa, solo para depurar | http://localhost:3000/api | `foodjet-api` |
| Base de datos | `localhost:5433` | `foodjet-db` |

> El puerto de la web es **8081**, no 8080, porque en la máquina de desarrollo
> el 8080 ya está ocupado por otro proyecto.

**Todo pasa por el proxy.** Caddy sirve el frontend y reenvía `/api` al
backend en el mismo origen. Por eso el frontend llama a `/api` con una ruta
relativa: así funciona igual en `localhost:8081` que publicado en un dominio,
sin depender de que el visitante tenga un backend en su propia máquina.

## 3. Credenciales de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin@foodjet.com` | `Admin123!` | admin |
| `cliente1@mail.com` | `Cliente123!` | cliente (estudiante, con descuento) |
| `cliente2@mail.com` | `Cliente123!` | cliente |

Cupones de prueba: `PruebaCupon` (10 %) y `FOODJET20` (20 %).

## 4. Ver el seguimiento en tiempo real

La forma más clara de comprobar el monitoreo del pedido, y la mejor captura
para el informe, es con dos ventanas del navegador:

1. En una, inicia sesión como `cliente1@mail.com` y haz un pedido. Al
   confirmarlo aparece la línea de tiempo, que consulta el estado real cada
   4 segundos (se ve en la pestaña Red del navegador).
2. En otra ventana, inicia sesión como `admin@foodjet.com` y abre el **Panel
   de Operaciones**. Pulsa "Avanzar estado" sobre ese pedido.
3. La línea de tiempo del cliente avanza sola, sin recargar.

Como alternativa sin intervención manual, pon `ENABLE_JOBS=true` en el `.env`
y reinicia: los pedidos avanzan solos un estado cada 15 segundos.

## 5. Ejecutar las pruebas

```bash
npm ci                 # una sola vez
cd backend && npm ci && npx prisma generate && cd ..

npm test               # los dos perfiles
npm run test:frontend
npm run test:backend
```

Genera `reports/cucumber.html`, que es el informe adjuntable como evidencia.
El mismo flujo corre en GitHub Actions (`.github/workflows/ci.yml`).

## 6. Día a día

```bash
docker compose logs -f backend     # ver logs de la API
docker compose restart backend     # reiniciar la API
docker compose down                # parar todo (conserva los datos)
docker compose down -v             # parar y BORRAR la base de datos
```

El código está montado dentro del contenedor, así que **editar un archivo del
backend reinicia el servidor solo** (nodemon) y editar el frontend solo
requiere recargar el navegador.

## 7. Variables de entorno

| Variable | Para qué sirve |
|---|---|
| `DATABASE_URL` | Conexión a Postgres. Dentro de Compose el host es `db`, no `localhost` |
| `JWT_SECRET` | Firma de los tokens de sesión |
| `RUN_SEED` | `true` siembra los datos de demo al arrancar (es idempotente) |
| `ENABLE_JOBS` | `true` activa el simulador de avance de pedidos |
| `ORDER_SIMULATION_STEP_MS` | Milisegundos entre cada avance de estado (15000 por defecto) |
| `AUTO_CANCEL_MINUTES` | Minutos antes de cancelar un pedido sin confirmar |
| `DOMINIO` | Qué escucha Caddy. `:80` detrás del túnel; un dominio real haría que pidiera certificado por su cuenta |
| `HTTP_BIND` | Quién alcanza el proxy. `127.0.0.1` deja a Cloudflare como única entrada; `0.0.0.0` lo abre a la red local |
| `HTTP_PORT` | Puerto del proxy en el host (8081) |
| `TUNNEL_TOKEN` | Credencial del túnel de Cloudflare. Vacío = el sitio no sale a internet |

## 8. Tareas puntuales

```bash
# Volver a sembrar los datos
docker compose exec backend npx prisma db seed

# Crear una migración después de cambiar prisma/schema.prisma
docker compose run --rm --entrypoint sh backend -c "npx prisma migrate dev --name mi_cambio"

# Inspeccionar la base de datos
docker compose exec db psql -U foodjet_user -d FoodjetBackend
```

## 9. Publicar en internet (túnel de Cloudflare)

El sitio sale a internet por un **túnel de Cloudflare**: es el contenedor el
que abre la conexión hacia fuera, así que no hace falta abrir puertos en el
router ni tener IP fija (la de esta máquina es dinámica). Cloudflare pone el
HTTPS y entrega en claro por la red interna de Docker.

### Una sola vez, en el panel de Cloudflare

1. **Zero Trust → Networks → Tunnels → Create a tunnel**, tipo *Cloudflared*.
   Ponle un nombre, por ejemplo `foodjet`.
2. Copia el **token** que muestra y pégalo en `.env`:
   ```
   TUNNEL_TOKEN=<el token>
   ```
   Es una credencial: el `.env` no se versiona.
3. En la pestaña **Public Hostnames** del túnel, añade:

   | Campo | Valor |
   |---|---|
   | Subdomain | `foodjet` |
   | Domain | `asen.pe` |
   | Service | `HTTP` → `proxy:80` |

   `proxy` es el nombre del servicio en la red de Docker; cloudflared lo
   resuelve solo. El registro DNS lo crea Cloudflare por ti.

### Arrancar y parar

```bash
docker compose --profile tunel up -d      # publica el sitio
docker compose stop tunel                 # lo retira de internet
```

Sin `--profile tunel` el túnel no arranca y el sitio queda solo en local: el
resto del stack funciona igual.

### Comprobaciones

- `docker compose logs -f tunel` debe mostrar cuatro conexiones registradas.
- `HTTP_BIND=127.0.0.1` en `.env` hace que **la única entrada sea Cloudflare**.
  Ponlo en `0.0.0.0` solo si quieres además acceso desde tu red local. Docker
  publica los puertos saltándose firewalld, así que esa línea es el control
  real.

### Antes de dejarlo publicado

Ten presente qué estás exponiendo: el registro es abierto, los pagos son
simulados y la verificación de estudiante concede el descuento a cualquiera
que envíe la petición. Es una aplicación de curso, no un sistema en
producción. Si quieres que solo entre gente concreta, añade una política de
**Cloudflare Access** sobre `foodjet.asen.pe` y quedará detrás de un login.

## 10. El script SQL

`Script base de datos/create database Foodjet.sql` se conserva como **anexo
documental** del modelo de datos. No se usa para levantar el entorno: el
esquema lo gestiona Prisma Migrate y los datos los siembra
`backend/prisma/seed.js`.
