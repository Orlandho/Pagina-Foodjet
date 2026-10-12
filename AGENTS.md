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

Con `SIMULAR_PEDIDOS=true` (el valor por defecto) cada pedido nuevo avanza
solo por sus estados y el seguimiento lo enseña en un mapa:

1. Inicia sesión como `cliente1@mail.com`, marca tu dirección en el mapa del
   checkout y confirma el pedido.
2. El seguimiento muestra el local, tu dirección y la ruta por calles. Cada
   etapa (confirmación, preparación, en camino, entregado) lleva su hora: la
   real cuando ya ocurrió y una estimada, con "aprox.", cuando aún no.
3. Al salir a reparto el repartidor recorre la ruta y la cifra grande dice
   cuánto falta. Con `SIM_ESCALA_TIEMPO=10` un pedido urbano tarda unos
   3 minutos de principio a fin.

Cómo funciona por dentro:

- Cada pedido nace con un **plan de tiempos** (`Order.plan_tiempos`):
  segundos que dura cada estado. `backend/src/jobs/simuladorPedidos.js` lo
  revisa cada 2 segundos y avanza los que vencieron.
- Al crear el pedido se pide la ruta a OSRM en segundo plano y se guarda en
  `Order.ruta`; la duración del reparto sale de su longitud a
  `REPARTIDOR_VELOCIDAD_KMH`, con el tope de `SIM_REPARTO_MAX_MIN`.
- Todo cambio de estado, lo haga el simulador, el personal, el cliente o la
  auto-cancelación, pasa por `backend/src/services/estadoPedido.js` y deja
  una fila en **`OrderStatusHistory`** con la hora y el origen. De ahí salen
  las horas de la línea de tiempo.
- La posición del repartidor no se envía: se deriva del momento de salida y
  la duración, en el servidor (`domain/simulacion.js`) y en el navegador
  (`frontend/js/domain/seguimiento.js`), que la anima entre consultas.
- El personal puede seguir moviendo pedidos desde el **Panel de
  Operaciones**; el simulador continúa desde el estado en que lo deje.
- Los pedidos anteriores a la simulación no tienen plan: no avanzan solos y
  su línea de tiempo no inventa horas.

El simulador antiguo (`ENABLE_JOBS=true`, un estado cada 15 s para todos los
pedidos) sigue disponible para los pedidos sin plan, junto con la
auto-cancelación.

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
| `GOOGLE_MAPS_API_KEY` | Key del mapa del checkout. Vacía = checkout sin mapa (dirección escrita + GPS del navegador). Ver más abajo |
| `OSRM_URL`, `OSRM_TIMEOUT_MS` | Servicio de rutas por calles para el reparto. Si no responde, la ruta cae a línea recta |
| `REPARTIDOR_VELOCIDAD_KMH` | Velocidad media del repartidor para estimar el tiempo de entrega |
| `SIMULAR_PEDIDOS` | `true` hace avanzar solos los pedidos nuevos y anima el reparto en el mapa |
| `SIM_ESCALA_TIEMPO` | Cuántas veces más rápido que la realidad (10 por defecto; 1 = tiempo real) |
| `SIM_CONFIRMACION_MIN`, `SIM_PREPARACION_MIN` | Minutos reales de esas etapas antes de aplicar la escala |
| `SIM_REPARTO_MAX_MIN` | Tope del reparto en minutos reales: un destino lejano se recorre más rápido |

### Key de Google Maps (mapa del checkout)

En el checkout el cliente marca en un mapa el punto exacto de entrega: un pin
fijo en el centro y el mapa se mueve debajo. El punto se guarda en
`DeliveryAddress.latitud/longitud` y es el destino del recorrido del
repartidor. Código en `frontend/js/mapaEntrega.js` y `frontend/js/domain/ubicacion.js`.

1. En [Google Cloud Console](https://console.cloud.google.com/) crea un
   proyecto con **facturación activada** (Google no sirve mapas sin ella; la
   cuota gratuita mensual sobra para el curso).
2. En *APIs y servicios → Biblioteca* activa **Maps JavaScript API** y
   **Geocoding API**. Sin la segunda el mapa funciona pero no se pueden buscar
   direcciones ni se rellena el texto al mover el pin.
3. En *Credenciales → Crear credenciales → Clave de API*, restríngela:
   - *Restricciones de aplicaciones*: **Sitios web**, con
     `https://foodjet.asen.pe/*` y `http://localhost:8081/*`.
   - *Restricciones de API*: solo las dos de arriba.
4. Pégala en `.env` como `GOOGLE_MAPS_API_KEY=...` y recrea el backend para
   que lea la variable: `docker compose up -d backend`.

La key viaja al navegador por `GET /api/config`: Google exige cargarla en el
cliente, y lo que la protege es la restricción por sitio web. Si Google la
rechaza (dominio no autorizado, API sin activar, sin facturación) el mapa se
retira solo y la consola del navegador dice por qué.

## 8. Tareas puntuales

```bash
# Volver a sembrar los datos
docker compose exec backend npx prisma db seed

# Crear una migración después de cambiar prisma/schema.prisma
docker compose run --rm --entrypoint sh backend -c "npx prisma migrate dev --name mi_cambio"

# Inspeccionar la base de datos
docker compose exec db psql -U foodjet_user -d FoodjetBackend

# Restablecer la contraseña de un usuario
docker compose exec backend node src/scripts/reset-password.js <email> [nueva]
```

Sobre el restablecimiento de contraseñas: **no las cambies con un UPDATE por
SQL**. Se guardan cifradas con bcrypt, así que escribir el texto plano en la
columna deja al usuario sin poder entrar (es lo que le pasaba a los usuarios
del script SQL original). El script aplica el mismo cifrado que el registro.

Sin el segundo argumento genera una contraseña aleatoria y la muestra. Cambiar
la contraseña **no cierra las sesiones abiertas**: el JWT no la contiene, así
que los tokens ya emitidos valen hasta caducar (24 h). Para invalidarlos todos
de golpe hay que rotar `JWT_SECRET` y reiniciar el backend.

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

### Un ajuste necesario en el panel: caché del navegador

Por defecto Cloudflare impone **4 horas** de caché de navegador a los estáticos
e **ignora la cabecera del origen**. Con eso, quien ya haya visitado el sitio
sigue ejecutando el JavaScript anterior después de cada despliegue, sin saberlo.

El Caddyfile ya envía `Cache-Control: no-cache` para HTML, JS y CSS (revalidar
en cada visita; con `ETag` la respuesta habitual es un 304 vacío, así que no
pesa). Para que Cloudflare lo respete hay que cambiar una opción:

**Caching → Configuration → Browser Cache TTL → `Respect Existing Headers`**

Sin ese cambio, el `no-cache` del origen no llega al navegador. Compruébalo con:

```bash
curl -sI https://foodjet.asen.pe/js/app.js | grep -i cache-control
```

Debe decir `no-cache`, no `max-age=14400`.

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
