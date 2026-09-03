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
| Web | http://localhost:8081 | `foodjet-web` |
| API | http://localhost:3000/api | `foodjet-api` |
| Base de datos | `localhost:5433` | `foodjet-db` |

> El puerto de la web es **8081**, no 8080, porque en la máquina de desarrollo
> el 8080 ya está ocupado por otro proyecto.

## 3. Credenciales de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin@foodjet.com` | `Admin123!` | admin |
| `cliente1@mail.com` | `Cliente123!` | cliente (estudiante, con descuento) |
| `cliente2@mail.com` | `Cliente123!` | cliente |

Cupones de prueba: `PruebaCupon` (10 %) y `FOODJET20` (20 %).

## 4. Día a día

```bash
docker compose logs -f backend     # ver logs de la API
docker compose restart backend     # reiniciar la API
docker compose down                # parar todo (conserva los datos)
docker compose down -v             # parar y BORRAR la base de datos
```

El código está montado dentro del contenedor, así que **editar un archivo del
backend reinicia el servidor solo** (nodemon) y editar el frontend solo
requiere recargar el navegador.

## 5. Variables de entorno

| Variable | Para qué sirve |
|---|---|
| `DATABASE_URL` | Conexión a Postgres. Dentro de Compose el host es `db`, no `localhost` |
| `JWT_SECRET` | Firma de los tokens de sesión |
| `RUN_SEED` | `true` siembra los datos de demo al arrancar (es idempotente) |
| `ENABLE_JOBS` | `true` activa el simulador de avance de pedidos |
| `ORDER_SIMULATION_STEP_MS` | Milisegundos entre cada avance de estado (15000 por defecto) |
| `AUTO_CANCEL_MINUTES` | Minutos antes de cancelar un pedido sin confirmar |

## 6. Tareas puntuales

```bash
# Volver a sembrar los datos
docker compose exec backend npx prisma db seed

# Crear una migración después de cambiar prisma/schema.prisma
docker compose run --rm --entrypoint sh backend -c "npx prisma migrate dev --name mi_cambio"

# Inspeccionar la base de datos
docker compose exec db psql -U foodjet_user -d FoodjetBackend
```

## 7. El script SQL

`Script base de datos/create database Foodjet.sql` se conserva como **anexo
documental** del modelo de datos. No se usa para levantar el entorno: el
esquema lo gestiona Prisma Migrate y los datos los siembra
`backend/prisma/seed.js`.
