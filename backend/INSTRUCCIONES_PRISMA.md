# Instrucciones de Prisma

Este documento explica los comandos básicos de Prisma que necesitas para el proyecto y cuándo debes ejecutarlos.

**Nota importante:** Todos los comandos de Prisma deben ejecutarse siempre dentro de la carpeta `backend` (es decir, en el mismo nivel donde se encuentra el archivo `package.json` de tu backend y la carpeta `prisma`).

## 1. Generar el cliente de Prisma

```bash
npx prisma generate
```

**¿Cuándo ejecutarlo?**
- Inmediatamente después de descargar/clonar el proyecto y ejecutar `npm install`.
- Cada vez que hagas alguna modificación en tu archivo `prisma/schema.prisma`.
- Si encuentras el error `Cannot find module '.prisma/client/default'` al intentar iniciar el servidor (como te ocurrió anteriormente).

**¿Qué hace?**
Lee la estructura de tu base de datos definida en el archivo `schema.prisma` y genera un cliente hecho a la medida en la carpeta `node_modules/.prisma/client`. Esto es lo que te permite consultar tu base de datos desde tu código de Node.js.

## 2. Aplicar cambios a la base de datos (Migraciones)

```bash
npx prisma migrate dev --name describe_el_cambio
```

**¿Cuándo ejecutarlo?**
- Cuando agregas, modificas o eliminas modelos (tablas) o campos en tu archivo `schema.prisma` y necesitas que tu base de datos **PostgreSQL** se actualice para reflejar esos cambios.

## 3. Empujar el esquema a la base de datos (Prototipado rápido)

```bash
npx prisma db push
```

**¿Cuándo ejecutarlo?**
- Si no quieres mantener un historial de migraciones por ahora y solo quieres forzar que la estructura de tu base de datos PostgreSQL sea exactamente igual a lo que tienes definido en el `schema.prisma`.

## 4. Visualizar los datos (Prisma Studio)

```bash
npx prisma studio
```

**¿Cuándo ejecutarlo?**
- Cuando quieras abrir una interfaz gráfica en tu navegador para ver, agregar, editar o eliminar los datos que están actualmente guardados en tu base de datos PostgreSQL.
