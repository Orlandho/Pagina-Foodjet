# 📊 Diagramas de Arquitectura y Flujos — FoodJet

Este directorio contiene los diagramas técnicos de arquitectura, flujos e interacciones de **FoodJet**, tanto en su formato editable (`.mmd`) como en formato vectorial de alta resolución (`.svg`) compilados mediante Mermaid CLI (`mmdc`).

---

## 📁 Índice de Diagramas

| # | Archivo Fuente | Imagen Vectorial (SVG) | Descripción |
|---|---|---|---|
| **01** | [`01_arquitectura_sistema.mmd`](./01_arquitectura_sistema.mmd) | [`01_arquitectura_sistema.svg`](./01_arquitectura_sistema.svg) | Topología global, red, contenedores Docker (Caddy, Express, PostgreSQL, Cloudflare). |
| **02** | [`02_frontend_componentes_modulos.mmd`](./02_frontend_componentes_modulos.mmd) | [`02_frontend_componentes_modulos.svg`](./02_frontend_componentes_modulos.svg) | Arquitectura modular del frontend SPA (Vistas, State Store, Domain, API, Modales). |
| **03** | [`03_frontend_flujo_checkout.mmd`](./03_frontend_flujo_checkout.mmd) | [`03_frontend_flujo_checkout.svg`](./03_frontend_flujo_checkout.svg) | Diagrama de secuencia del checkout multimétodo (Efectivo, Tarjeta con Luhn, Billetera QR). |
| **04** | [`04_frontend_seguimiento_pedidos.mmd`](./04_frontend_seguimiento_pedidos.mmd) | [`04_frontend_seguimiento_pedidos.svg`](./04_frontend_seguimiento_pedidos.svg) | Flujo del sondeo y polling en tiempo real cada 4s, Visibility API y estados terminales. |
| **05** | [`05_backend_arquitectura_capas.mmd`](./05_backend_arquitectura_capas.mmd) | [`05_backend_arquitectura_capas.svg`](./05_backend_arquitectura_capas.svg) | Arquitectura en capas del Backend (Routes, Middlewares JWT/RBAC, Controllers, Domain, Prisma). |
| **06** | [`06_backend_maquina_estados.mmd`](./06_backend_maquina_estados.mmd) | [`06_backend_maquina_estados.svg`](./06_backend_maquina_estados.svg) | Máquina de estados del pedido (Pendiente, Confirmado, En preparación, En camino, Entregado, Cancelado). |
| **07** | [`07_backend_creacion_pedido_secuencia.mmd`](./07_backend_creacion_pedido_secuencia.mmd) | [`07_backend_creacion_pedido_secuencia.svg`](./07_backend_creacion_pedido_secuencia.svg) | Secuencia de creación de pedido atómica con `prisma.$transaction` y validación de negocio. |
| **08** | [`08_base_de_datos_er.mmd`](./08_base_de_datos_er.mmd) | [`08_base_de_datos_er.svg`](./08_base_de_datos_er.svg) | Diagrama de Entidad-Relación completo de la base de datos PostgreSQL / Prisma. |

---

## 🛠️ Recompilación de Diagramas con Mermaid CLI

Para regenerar o actualizar los archivos `.svg` tras modificar cualquier `.mmd`:

```powershell
Get-ChildItem "mermaid diagramas\*.mmd" | ForEach-Object {
    $svg = $_.FullName -replace '\.mmd$', '.svg'
    npx mmdc -i $_.FullName -o $svg
}
```
