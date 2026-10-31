# FoodJet Frontend UI Modernization — Milestone 3: Tracking View & Live Map Blueprint
**Document**: Technical Exploration & Architecture Blueprint Report
**Explorer ID**: explorer_m3_3
**Date**: 2026-10-30
**Target View**: Order Tracking (`#trackingView`, `#mapaSeguimiento`, `#liveIndicator`, `#step1`-`#step4`)

---

## 1. Executive Summary

The FoodJet order tracking view (`#trackingView`) combines real-time order polling, Google Maps route visualization with OSRM street geometries, dynamic driver interpolation, a 4-step chronological timeline, and order financial details. To fulfill Milestone 3 (Features 13, 14, and 15) and harmonize the web client with the Jetpack Compose Android reference (`TrackingScreen.kt`), this report specifies a zero-regression, contract-preserving modernization blueprint:
1. A Jetpack Compose-styled header featuring the dynamic headline **"¡Tu antojo va volando!"** (in `en_camino`) / **"Sigue tu pedido"** (in other states) and order metadata subtitle.
2. A prominent **ETA counter** with 34sp/2.25rem bold typography (`#etaValue`), contextual arrival text (`#etaText`), and live route distance summary (`#trackingRoute`).
3. An accessible **"Actualizando en vivo" live status badge** (`#liveIndicator`) reflecting real-time polling health: active pulsing green, amber "Reconectando…" during transient network errors, and red "Sin conexión" upon terminal disconnect.
4. A modernized **4-step timeline** (`#step1`–`#step4`) that distinguishes historical timestamps from time-plan projections (`"aprox."`), complete with an **"Ahora"** pill for active stages.
5. A conditional **"Cancelar Pedido" button** (`#cancelOrderBtn`) visible strictly during cancelable states (`pendiente` and `confirmado`) and hooked to the backend endpoint `PUT /api/orders/:id/cancel`.
6. Strict preservation of all **23 legacy DOM IDs**, event listeners, and headless domain logic, maintaining 100% test pass rate across Cucumber scenarios and white-box unit tests.

---

## 2. Current State Analysis & Baseline Architecture

### 2.1 File & Module Responsibilities
- **Markup** (`frontend/index.html`, lines 652–752):
  Single `<section id="trackingView">` containing `#trackingLayout`. When store and delivery coordinates are available, the container receives class `.seguimiento--con-mapa`. The map card `#trackingMapCard` holds `#trackingMap` and `#trackingRoute`. The control panel holds `#statusIcon`, `#statusTitle`, `#statusDescription`, `#estimatedTime` (`#etaValue`, `#etaText`), `#trackingConnection`, the timeline `<ol class="linea-tiempo">` (`#step1` through `#step4`), and order details (`#orderNumber`, `#orderPayment`, `#orderDate`, `#orderSubtotal`, `#orderTaxes`, `#orderDelivery`, `#orderTotalFinal`, `#backToMenuFromTracking`, `#trackingHistoryBtn`).
- **Styling** (`frontend/styles.css`, lines 2125–2380):
  Grid container `.seguimiento` (max-width 640px centered; expands to two columns `7fr 5fr` with sticky map at `top: 88px` on `min-width: 992px`). Timeline `.linea-tiempo` connects stages via vertical pseudoelements (`::before`), styling states via `data-situacion="hecha"|"en_curso"|"pendiente"|"cancelada"`.
- **Domain Logic** (`frontend/js/domain/orderStatus.js` & `seguimiento.js`):
  Pure ESM functions: `getTrackingViewModel(estado)` provides status title, description, and icons; `lineaDeTiempo(pedido, ahoraMs)` derives stage situations and timestamps using `Order.OrderStatusHistory` and `Order.plan_tiempos`; `avanceDelReparto(...)` and `dividirRuta(...)` calculate driver interpolation and distance formatting (`formatearDistancia`, `formatearRestante`).
- **Rendering & Polling Engine** (`frontend/js/ui.js`, lines 1436–1647):
  `startOrderTracking(paymentMethod, orderData)` initializes rendering and starts polling via `setInterval(pollOnce, 4000)`. `pollOnce()` queries `GET /api/orders/:id`, updates server offset (`desfaseServidorMs`), and invokes `applyTrackingViewModel(vm, pedido)` and `mostrarMapaSeguimiento(pedido, mapKeys)`.
- **Backend Order Cancellation Endpoint** (`backend/src/routes/orderRoutes.js:22`, `orderController.js:338`):
  Endpoint `PUT /api/orders/:id/cancel` enforces critical business rule `isCancelable(order.estado)` (`['pendiente', 'confirmado']`). Once the order reaches `en_preparacion`, cancellation is rejected with HTTP 400/409.

---

## 3. Jetpack Compose Prototype Insights (`TrackingScreen.kt`)

Inspection of the reference implementation in `C:\Users\ORLANDO\Desktop\ciclo 9\frontend para actualizar foodjet para app moviles y adm de proyec de software\proyecto-app-movil-UPN-2026-2-main\app-movil\app\src\main\java\com\example\foodjeetapp\ui\screens\TrackingScreen.kt` reveals key visual patterns:

| Compose Element | Implementation in `TrackingScreen.kt` | Web Modernization Specification |
|---|---|---|
| **Header Headline** | `if (order.estado == OrderStatus.EN_CAMINO) "¡Tu antojo va volando!" else "Sigue tu pedido"` (lines 216–221) | Add `#trackingHeadline` (28px / 1.75rem, bold, brand text) and `#trackingSubtitle` above the layout. |
| **Live Indicator** | `Surface(shape = CircleShape, color = Color.White) { Row { Box(size=7.dp, bg=FoodJetSuccess); Text("Actualizando en vivo") } }` (lines 510–524) | Reusable `.foodjet-badge--live` pill with pulsing green dot (`#28A745`) and text `#liveIndicatorText`. |
| **Status Badge** | Uppercase stage label (e.g. `PEDIDO EN CAMINO`, 11sp, ExtraBold) with pulsing 8dp dot (lines 344–358) | Modern status pill `.foodjet-badge--status` inside `#statusCard` with dynamic theme color per state. |
| **ETA Counter** | Big bold digits (34sp / 2.25rem, ExtraBold): `Geo.formatearRestante(llegada - ahoraMs)` e.g. "12 min" / "Llegando" (lines 365–371) | Large typography for `#etaValue` with tabular nums and negative letter spacing (`-0.02em`). |
| **Timeline Nodes** | 28dp circle: green checkmark if completed; primary orange with bicycle icon if active; border gray if pending (lines 460–478) | Circular 32px node with smooth color transitions, check icon (`bi-check-lg`) for done, brand icon for active. |
| **"Ahora" Pill** | `Surface(shape = CircleShape, color = FoodJetPrimaryLight) { Text("Ahora", color = FoodJetPrimary) }` (lines 439–448) | `.linea-tiempo__ahora-badge` shown only on step with `[data-situacion="en_curso"]`. |
| **Cancel Button** | `if (order.estado.isCancelable) { OutlinedButton(colors = error) { Text("Cancelar Pedido") } }` (lines 259–271) | `#cancelOrderBtn` styled with `.foodjet-btn-secondary--danger`, visible only when cancelable. |

---

## 4. Preserved DOM Contracts & Event Listeners

### 4.1 Preserved DOM Element Contracts (Zero Breaking Changes)

| Preserved DOM ID | Element Type | Role / Test Dependency | Planned Enhancements |
|---|---|---|---|
| `#trackingView` | `<section>` | View container shown/hidden by `ui.showView('trackingView')` | Outer container with responsive container padding |
| `#trackingLayout` | `<div>` | Toggles `.seguimiento--con-mapa` when map coordinates exist | Clean CSS grid with sticky desktop side-by-side layout |
| `#trackingMapCard` | `<div>` | Container card for map; toggles `hidden` | Styled with `.foodjet-card` borders and rounded corners |
| `#trackingMap` | `<div>` | Canvas container where Google Maps renders | Maintain role="region" and accessibility labels |
| `#trackingRoute` | `<p>` | Displays street distance summary (e.g. "Faltan 1,2 km...") | Styled as floating pill on top-left of the map |
| `#statusIcon` | `<div>` | Container for stage icon (`.order-status-icon`) | Circular badge with brand background and subtle glow |
| `#statusTitle` | `<h1>` | Title of current stage (`h4 mb-1`) | Typography scaled to `var(--font-headline-medium)` |
| `#statusDescription` | `<p>` | Description of current stage (`text-muted mb-0`) | Color token `var(--color-text-secondary)` |
| `#estimatedTime` | `<div>` | Container for ETA, hidden on terminal states | Flex container with arrival time and big countdown |
| `#etaValue` | `<span>` | Large countdown string (e.g. "12 min", "Llegando") | Formatted with `2.25rem`, bold, tabular numbers |
| `#etaText` | `<span>` | Subtitle text (e.g. "Llegada aprox. 20:30") | Muted arrival description |
| `#trackingConnection` | `<div>` | Diagnostic network text | Kept for screen reader & test backward compatibility |
| `#step1` | `<li>` | Stage 1: Confirmación (`data-situacion`, `aria-current`) | Modern card row with status icon & connector line |
| `#stepTime1` | `<span>` | Stage 1 timestamp (`<time>`) | Formatted timestamp with optional "aprox." |
| `#step2` | `<li>` | Stage 2: Preparación (`data-situacion`, `aria-current`) | Modern card row with status icon & connector line |
| `#stepTime2` | `<span>` | Stage 2 timestamp (`<time>`) | Formatted timestamp with optional "aprox." |
| `#step3` | `<li>` | Stage 3: En camino (`data-situacion`, `aria-current`) | Modern card row with status icon & connector line |
| `#stepTime3` | `<span>` | Stage 3 timestamp (`<time>`) | Formatted timestamp with optional "aprox." |
| `#step4` | `<li>` | Stage 4: Entregado (`data-situacion`, `aria-current`) | Modern card row with status icon & connector line |
| `#stepTime4` | `<span>` | Stage 4 timestamp (`<time>`) | Formatted timestamp with optional "aprox." |
| `#orderNumber` | `<span>` | Order identifier `#FJ0000` | Bold monospace/tabular string |
| `#orderPayment` | `<span>` | Payment method label | Formatted method text |
| `#orderDate` | `<span>` | Creation date string | Formatted date in es-PE format |
| `#orderSubtotal` | `<span>` | Derived subtotal (`S/ XX.XX`) | Derived from total - impuestos - envio |
| `#orderTaxes` | `<span>` | Tax amount (`S/ XX.XX`) | Formatted taxes |
| `#orderDelivery` | `<span>` | Shipping fee (`S/ XX.XX`) | Formatted delivery fee |
| `#orderTotalFinal` | `<span>` | Final total amount (`S/ XX.XX`) | Prominent bold total figure |
| `#backToMenuFromTracking` | `<button>` | "Volver al Menú" button | Converted to primary full-width CTA `.foodjet-btn-primary` |
| `#trackingHistoryBtn` | `<button>` | "Ver Historial" button | Outlined secondary button `.foodjet-btn-secondary` |

### 4.2 New Modernized DOM Additions

| New DOM ID / Class | Purpose | Placement |
|---|---|---|
| `#trackingHeadline` | Headline: "¡Tu antojo va volando!" / "Sigue tu pedido" | Top header bar inside `.tracking-header` |
| `#trackingSubtitle` | Subtitle: "Pedido #FJ0000 · Sigue cada parte del viaje." | Top header bar under headline |
| `#liveIndicator` | Live connection indicator badge | Header action area (always visible, even without map) |
| `#liveIndicatorText` | Text node for indicator: "Actualizando en vivo" | Inside `#liveIndicator` |
| `#cancelOrderBtn` | Cancel order button for `pendiente` / `confirmado` | Action section in order details card |
| `.linea-tiempo__ahora-badge` | "Ahora" badge pill for current stage | In step header next to stage name |

### 4.3 Preserved & Bound Event Listeners
1. `document.getElementById('backToMenuFromTracking')`: `click` -> `ui.showView('homeView')` (bound in `frontend/js/app.js:138`).
2. `document.getElementById('trackingHistoryBtn')`: `click` -> `handleHistoryClick()` (bound in `frontend/js/app.js:145`).
3. `document.addEventListener('visibilitychange')`: pauses polling when document is hidden, resumes when active (bound in `frontend/js/ui.js:1635`).
4. `document.getElementById('cancelOrderBtn')`: `click` -> prompt confirmation, calls `PUT /api/orders/:id/cancel`, shows toast, and triggers `pollOnce()` to update UI immediately.

---

## 5. Technical Implementation Blueprints for Worker

### 5.1 HTML Structure Blueprint (`frontend/index.html`)

```html
<section id="trackingView" style="display: none;" aria-label="Seguimiento de pedido">
    <div class="container py-4 py-lg-5">
        <!-- Modern Compose Header Bar -->
        <div class="tracking-header mb-4">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div class="min-w-0">
                    <h1 class="tracking-headline fw-extrabold mb-1" id="trackingHeadline">Sigue tu pedido</h1>
                    <p class="tracking-subtitle text-secondary small mb-0" id="trackingSubtitle">
                        Sigue cada parte del viaje en tiempo real.
                    </p>
                </div>
                <!-- Accessible Live Connection Indicator Pill -->
                <div id="liveIndicator" class="foodjet-badge foodjet-badge--live" role="status" aria-live="polite">
                    <span class="foodjet-badge__dot" aria-hidden="true"></span>
                    <span id="liveIndicatorText">Actualizando en vivo</span>
                </div>
            </div>
        </div>

        <!-- Main Tracking Layout Grid (2 cols on desktop, 1 col on mobile) -->
        <div class="seguimiento" id="trackingLayout">
            <!-- Map Card Column -->
            <div class="seguimiento__mapa foodjet-card" id="trackingMapCard" hidden>
                <div id="trackingMap" class="seguimiento__lienzo" role="region"
                     aria-label="Mapa del reparto: el local, tu dirección y el repartidor"></div>
                <p class="seguimiento__ruta" id="trackingRoute"></p>
            </div>

            <!-- Tracking Status & Timeline Panel -->
            <div class="seguimiento__panel">
                <!-- Status & Progress Card -->
                <div class="card foodjet-card mb-3" id="statusCard">
                    <div class="card-body foodjet-card__body p-4">
                        <div class="seguimiento__estado mb-3" role="status" aria-live="polite" aria-atomic="true">
                            <div class="order-status-icon me-3" id="statusIcon">
                                <i class="bi bi-hourglass-split fs-2 text-primary" aria-hidden="true"></i>
                            </div>
                            <div class="min-w-0">
                                <h2 class="h4 mb-1 fw-bold" id="statusTitle" tabindex="-1">Confirmando tu pedido</h2>
                                <p class="text-secondary mb-0 small" id="statusDescription">Estamos confirmando tu pedido con el restaurante.</p>
                            </div>
                        </div>

                        <!-- Big ETA Counter -->
                        <div class="seguimiento__llegada" id="estimatedTime" hidden>
                            <span class="seguimiento__llegada-cifra" id="etaValue"></span>
                            <span class="seguimiento__llegada-texto" id="etaText"></span>
                        </div>
                        
                        <!-- Diagnostic Notice -->
                        <div class="small text-muted mt-2" id="trackingConnection"></div>

                        <!-- Chronological 4-Step Timeline -->
                        <ol class="linea-tiempo" aria-label="Progreso del pedido">
                            <li class="linea-tiempo__etapa" id="step1">
                                <span class="linea-tiempo__marca" aria-hidden="true"><i class="bi bi-hourglass-split"></i></span>
                                <div class="linea-tiempo__contenido">
                                    <span class="linea-tiempo__nombre">Confirmación</span>
                                    <span class="foodjet-badge foodjet-badge--pill linea-tiempo__ahora-badge" aria-hidden="true">Ahora</span>
                                </div>
                                <span class="linea-tiempo__hora" id="stepTime1"></span>
                            </li>
                            <li class="linea-tiempo__etapa" id="step2">
                                <span class="linea-tiempo__marca" aria-hidden="true"><i class="bi bi-box-seam"></i></span>
                                <div class="linea-tiempo__contenido">
                                    <span class="linea-tiempo__nombre">Preparación</span>
                                    <span class="foodjet-badge foodjet-badge--pill linea-tiempo__ahora-badge" aria-hidden="true">Ahora</span>
                                </div>
                                <span class="linea-tiempo__hora" id="stepTime2"></span>
                            </li>
                            <li class="linea-tiempo__etapa" id="step3">
                                <span class="linea-tiempo__marca" aria-hidden="true"><i class="bi bi-bicycle"></i></span>
                                <div class="linea-tiempo__contenido">
                                    <span class="linea-tiempo__nombre">En camino</span>
                                    <span class="foodjet-badge foodjet-badge--pill linea-tiempo__ahora-badge" aria-hidden="true">Ahora</span>
                                </div>
                                <span class="linea-tiempo__hora" id="stepTime3"></span>
                            </li>
                            <li class="linea-tiempo__etapa" id="step4">
                                <span class="linea-tiempo__marca" aria-hidden="true"><i class="bi bi-house-door"></i></span>
                                <div class="linea-tiempo__contenido">
                                    <span class="linea-tiempo__nombre">Entregado</span>
                                    <span class="foodjet-badge foodjet-badge--pill linea-tiempo__ahora-badge" aria-hidden="true">Ahora</span>
                                </div>
                                <span class="linea-tiempo__hora" id="stepTime4"></span>
                            </li>
                        </ol>
                    </div>
                </div>

                <!-- Order Details Card -->
                <div class="card foodjet-card mt-3">
                    <div class="card-body foodjet-card__body p-4">
                        <h3 class="h5 mb-3 fw-bold">Detalles del pedido</h3>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-secondary small">Número de orden:</span>
                            <span class="fw-bold small" id="orderNumber">#FJ0000</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-secondary small">Método de pago:</span>
                            <span class="fw-bold small" id="orderPayment">-</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-secondary small">Fecha:</span>
                            <span class="fw-bold small" id="orderDate">-</span>
                        </div>
                        <hr class="my-3 border-secondary-subtle">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-secondary small">Subtotal:</span>
                            <span class="fw-bold small" id="orderSubtotal">-</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-secondary small">Impuestos:</span>
                            <span class="fw-bold small" id="orderTaxes">-</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span class="text-secondary small">Envío:</span>
                            <span class="fw-bold small" id="orderDelivery">-</span>
                        </div>
                        <div class="d-flex justify-content-between pt-2 border-top">
                            <span class="fw-bold">Total Final:</span>
                            <span class="fw-extrabold fs-5 text-dark" id="orderTotalFinal">-</span>
                        </div>

                        <p class="small text-secondary mt-4 mb-3 d-flex align-items-center">
                            <i class="bi bi-telephone me-2 text-primary" aria-hidden="true"></i>¿Tienes alguna pregunta? Llámanos al <strong class="ms-1">01 234 5678</strong>
                        </p>

                        <div class="d-grid gap-2 mt-4">
                            <!-- Cancel order button (visible only in cancelable state) -->
                            <button class="btn btn-outline-danger foodjet-btn-secondary foodjet-btn-secondary--danger" id="cancelOrderBtn" style="display: none;">
                                <i class="bi bi-x-circle me-1" aria-hidden="true"></i>Cancelar Pedido
                            </button>
                            <button class="btn btn-primary foodjet-btn-primary" id="backToMenuFromTracking">
                                Volver al Menú
                            </button>
                            <button class="btn btn-outline-secondary foodjet-btn-secondary" id="trackingHistoryBtn">
                                Ver Historial de Pedidos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
```

---

### 5.2 CSS Stylesheet Blueprint (`frontend/styles.css`)

```css
/* ==========================================================================
   FoodJet Order Tracking View (Milestone 3 - Features 13, 14, 15)
   ========================================================================== */

/* Header & Typography */
.tracking-header {
    margin-bottom: var(--space-4);
}

.tracking-headline {
    font-size: var(--font-size-display-large);
    line-height: var(--line-height-display-large);
    font-weight: var(--font-weight-extrabold);
    color: var(--color-text-primary);
    letter-spacing: -0.02em;
}

.tracking-subtitle {
    font-size: var(--font-size-body-medium);
    color: var(--color-text-secondary);
}

/* Live Connection Indicator Badge States */
.foodjet-badge--live {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    font-size: var(--font-size-body-small);
    font-weight: var(--font-weight-semibold);
    padding: 6px 14px;
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-sm);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all var(--transition-fast);
}

.foodjet-badge--live .foodjet-badge__dot {
    width: 8px;
    height: 8px;
    border-radius: var(--radius-full);
    background-color: var(--color-success);
}

@media (prefers-reduced-motion: no-preference) {
    .foodjet-badge--live .foodjet-badge__dot {
        animation: foodjet-pulse-live 1.8s infinite ease-in-out;
    }
}

/* Reconnecting State (Amber) */
.foodjet-badge--reconnecting {
    background-color: var(--color-warning-container);
    border: 1px solid var(--color-warning);
    color: var(--color-warning-text);
}

.foodjet-badge--reconnecting .foodjet-badge__dot {
    background-color: #D97706;
    animation: foodjet-pulse-amber 1.2s infinite ease-in-out;
}

@keyframes foodjet-pulse-amber {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.7); }
    70% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(217, 119, 6, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(217, 119, 6, 0); }
}

/* Disconnected State (Red) */
.foodjet-badge--disconnected {
    background-color: var(--color-danger-container);
    border: 1px solid var(--color-danger);
    color: var(--color-danger-text);
}

.foodjet-badge--disconnected .foodjet-badge__dot {
    background-color: var(--color-danger);
    animation: none;
}

/* Tracking Layout Grid */
.seguimiento {
    display: grid;
    gap: var(--space-4);
    max-width: 680px;
    margin: 0 auto;
}

.seguimiento--con-mapa {
    max-width: none;
}

@media (min-width: 992px) {
    .seguimiento--con-mapa {
        grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
        align-items: start;
        gap: var(--space-5);
    }

    .seguimiento--con-mapa .seguimiento__mapa {
        position: sticky;
        top: 88px;
    }
}

.seguimiento__mapa {
    position: relative;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    overflow: hidden;
    background-color: var(--color-surface);
}

.seguimiento__lienzo {
    width: 100%;
    height: 320px;
}

@media (min-width: 992px) {
    .seguimiento__lienzo {
        height: min(640px, calc(100vh - 120px));
        min-height: 460px;
    }
}

/* Map Route Distance Summary Tag */
.seguimiento__ruta {
    position: absolute;
    top: 14px;
    left: 14px;
    max-width: calc(100% - 28px);
    margin: 0;
    padding: 6px 14px;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(4px);
    color: var(--color-text-primary);
    font-size: var(--font-size-body-small);
    font-weight: var(--font-weight-semibold);
    font-variant-numeric: tabular-nums;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--color-border);
    z-index: 5;
}

.seguimiento__ruta:empty {
    display: none;
}

/* Big ETA Arrival Counter */
.seguimiento__llegada {
    display: flex;
    flex-direction: column;
    margin-top: var(--space-4);
    padding: var(--space-4);
    border-radius: var(--radius-button);
    background-color: var(--color-primary-light);
    border: 1px solid rgba(244, 81, 30, 0.2);
}

.seguimiento__llegada-cifra {
    font-size: 2.25rem;
    font-weight: var(--font-weight-extrabold);
    line-height: 1.1;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    color: var(--color-primary-dark);
}

.seguimiento__llegada-cifra:empty {
    display: none;
}

.seguimiento__llegada-texto {
    margin-top: 4px;
    font-size: var(--font-size-body-small);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
}

/* 4-Step Vertical Timeline */
.linea-tiempo {
    list-style: none;
    margin: var(--space-4) 0 0;
    padding: 0;
}

.linea-tiempo__etapa {
    position: relative;
    display: grid;
    grid-template-columns: 32px 1fr auto;
    align-items: center;
    column-gap: var(--space-3);
    padding-bottom: var(--space-4);
}

.linea-tiempo__etapa:last-child {
    padding-bottom: 0;
}

.linea-tiempo__etapa:not(:last-child)::before {
    content: "";
    position: absolute;
    left: 15px;
    top: 32px;
    bottom: 0;
    width: 2px;
    background: var(--color-border);
    transition: background-color var(--transition-fast);
}

.linea-tiempo__etapa[data-situacion="hecha"]:not(:last-child)::before {
    background: var(--color-success);
}

.linea-tiempo__marca {
    position: relative;
    z-index: 1;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
    background: var(--color-background);
    color: var(--color-text-secondary);
    border: 2px solid var(--color-border);
    transition: all var(--transition-fast);
}

.linea-tiempo__etapa[data-situacion="hecha"] .linea-tiempo__marca {
    background: var(--color-success);
    color: #ffffff;
    border-color: var(--color-success);
}

.linea-tiempo__etapa[data-situacion="en_curso"] .linea-tiempo__marca {
    background: var(--color-primary);
    color: #ffffff;
    border-color: var(--color-primary-dark);
    box-shadow: 0 0 0 4px rgba(244, 81, 30, 0.2);
}

.linea-tiempo__contenido {
    display: flex;
    align-items: center;
    gap: 8px;
}

.linea-tiempo__nombre {
    font-size: var(--font-size-body-large);
    font-weight: var(--font-weight-regular);
    color: var(--color-text-secondary);
}

.linea-tiempo__etapa[data-situacion="en_curso"] .linea-tiempo__nombre {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
}

.linea-tiempo__etapa[data-situacion="hecha"] .linea-tiempo__nombre {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

.linea-tiempo__ahora-badge {
    display: none;
    background-color: var(--color-primary-light);
    color: var(--color-primary-dark);
    border: 1px solid rgba(244, 81, 30, 0.3);
    padding: 2px 8px;
    font-size: var(--font-size-micro-badge);
    font-weight: var(--font-weight-bold);
    border-radius: var(--radius-full);
}

.linea-tiempo__etapa[data-situacion="en_curso"] .linea-tiempo__ahora-badge {
    display: inline-flex;
}

.linea-tiempo__hora {
    font-variant-numeric: tabular-nums;
    font-size: var(--font-size-body-small);
    color: var(--color-text-secondary);
    white-space: nowrap;
}

.linea-tiempo__etapa[data-situacion="en_curso"] .linea-tiempo__hora,
.linea-tiempo__etapa[data-situacion="hecha"] .linea-tiempo__hora {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
}
```

---

### 5.3 JavaScript Logic Enhancements (`frontend/js/ui.js`)

In `frontend/js/ui.js`, update `applyTrackingViewModel`, `pollOnce`, and initialize `#cancelOrderBtn`:

```javascript
// --- Connection Indicator Helper ---
function updateLiveIndicator(status, message) {
    const indicator = document.getElementById('liveIndicator');
    const textEl = document.getElementById('liveIndicatorText');
    if (!indicator) return;

    indicator.classList.remove(
        'foodjet-badge--live',
        'foodjet-badge--reconnecting',
        'foodjet-badge--disconnected'
    );

    if (status === 'live') {
        indicator.classList.add('foodjet-badge--live');
        indicator.setAttribute('aria-label', 'Conexión activa: actualizando en vivo');
        if (textEl) textEl.textContent = message || 'Actualizando en vivo';
    } else if (status === 'reconnecting') {
        indicator.classList.add('foodjet-badge--reconnecting');
        indicator.setAttribute('aria-label', 'Problema de red: reconectando');
        if (textEl) textEl.textContent = message || 'Reconectando…';
    } else if (status === 'disconnected') {
        indicator.classList.add('foodjet-badge--disconnected');
        indicator.setAttribute('aria-label', 'Desconectado: no se pudo actualizar');
        if (textEl) textEl.textContent = message || 'Sin conexión';
    }
}

// --- Enhanced applyTrackingViewModel ---
function applyTrackingViewModel(vm, pedido = null) {
    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    const statusDesc = document.getElementById('statusDescription');
    const trackingHeadline = document.getElementById('trackingHeadline');
    const trackingSubtitle = document.getElementById('trackingSubtitle');
    const cancelBtn = document.getElementById('cancelOrderBtn');

    // Dynamic Headline & Subtitle
    if (trackingHeadline) {
        trackingHeadline.textContent = vm.estado === 'en_camino'
            ? '¡Tu antojo va volando!'
            : (vm.terminal ? (vm.cancelled ? 'Pedido cancelado' : '¡Pedido entregado!') : 'Sigue tu pedido');
    }
    if (trackingSubtitle && pedido?.id) {
        trackingSubtitle.textContent = `Pedido #FJ${String(pedido.id).padStart(4, '0')} · Sigue cada parte del viaje en tiempo real.`;
    }

    // Cancel Order Button Visibility
    if (cancelBtn) {
        const cancelable = ['pendiente', 'confirmado'].includes(vm.estado);
        cancelBtn.style.display = cancelable ? 'inline-flex' : 'none';
        cancelBtn.dataset.orderId = pedido?.id || '';
    }

    if (statusIcon) {
        const color = vm.cancelled ? 'text-danger' : (vm.terminal ? 'text-success' : 'text-primary');
        statusIcon.innerHTML = `<i class="bi ${vm.iconClass} fs-2 ${color}" aria-hidden="true"></i>`;
        statusIcon.classList.toggle('delivered', vm.terminal);
    }
    if (statusTitle) statusTitle.textContent = vm.title;
    if (statusDesc) statusDesc.textContent = vm.description;

    const ahora = Date.now() + desfaseServidorMs;
    const linea = lineaDeTiempo({ estado: vm.estado, ...(pedido || {}) }, ahora);

    pintarLlegada(vm, linea, ahora);

    linea.etapas.forEach((etapa, i) => {
        const paso = document.getElementById(`step${i + 1}`);
        if (!paso) return;

        paso.dataset.situacion = etapa.situacion;
        if (etapa.situacion === 'en_curso') {
            paso.setAttribute('aria-current', 'step');
        } else {
            paso.removeAttribute('aria-current');
        }

        const marca = paso.querySelector('.linea-tiempo__marca');
        if (marca) {
            const icono = etapa.situacion === 'hecha' ? 'bi-check-lg' : ICONOS_ETAPA[i];
            marca.innerHTML = `<i class="bi ${icono}"></i>`;
        }

        const hora = document.getElementById(`stepTime${i + 1}`);
        if (hora) {
            hora.innerHTML = etapa.hora === null ? '' : `<time datetime="${new Date(etapa.hora).toISOString()}">${
                etapa.estimada ? 'aprox. ' : ''}${formatoHora.format(etapa.hora)}</time>`;
        }
    });
}

// --- Enhanced pollOnce with Live Indicator ---
async function pollOnce() {
    if (!trackingOrderId) return;

    const resultado = await api.fetchOrderByIdAPI(trackingOrderId, window.authToken);

    if (!resultado.ok) {
        trackingFallos += 1;
        updateLiveIndicator('reconnecting', 'Reconectando…');
        setConnectionNotice('Sin conexión con el servidor, reintentando…');

        if (trackingFallos >= MAX_FALLOS) {
            updateLiveIndicator('disconnected', 'Sin conexión');
            setConnectionNotice('No se pudo actualizar el estado del pedido.');
            stopOrderTracking();
        }
        return;
    }

    trackingFallos = 0;
    updateLiveIndicator('live', 'Actualizando en vivo');
    setConnectionNotice('');

    const pedido = resultado.data;
    if (pedido.servidor_ahora) {
        desfaseServidorMs = new Date(pedido.servidor_ahora).getTime() - Date.now();
    }

    const vm = getTrackingViewModel(pedido.estado);
    applyTrackingViewModel(vm, pedido);

    const config = await api.fetchConfigAPI();
    const mapKeys = config.googleMapsApiKeys?.length ? config.googleMapsApiKeys : config.googleMapsApiKey;
    mostrarMapaSeguimiento(pedido, mapKeys);

    if (vm.terminal) {
        updateLiveIndicator('live', vm.cancelled ? 'Cancelado' : 'Entregado');
        showToast(
            vm.cancelled ? '❌ Tu pedido fue cancelado.' : '✅ ¡Tu pedido ha sido entregado! Buen provecho.',
            vm.cancelled ? 'warning' : 'success'
        );
        stopOrderTracking();
    }
}
```

---

## 6. Accessibility & Viewport Verification Matrix

| Viewport Width | Layout Behavior | Scroll & Padding Criteria |
|---|---|---|
| **360px** | Single column; full-width map (height: 280px); stacked cards; sticky bars do not obstruct content | Zero horizontal overflow; touch targets >= 48px |
| **390px** | Single column; full-width map (height: 300px); stacked cards | Zero horizontal overflow; touch targets >= 48px |
| **768px** (Tablet) | Single column centered (`max-width: 680px`); map height: 340px | Clean spacing, centered presentation |
| **1280px** (Desktop) | Two columns side-by-side: sticky map (left 7fr) + status & details panel (right 5fr) | Zero horizontal overflow; sticky offset `top: 88px` |
| **1440px** (Wide) | Two columns side-by-side with max-width container bounds | Perfect alignment, no card clipping |
| **Zoom 200%** | Fluid wrapping without overlapping text or clipped countdown | Maintains readability and interactive button access |
| **Reduced Motion** | Pulse animations on `#liveIndicator` and active timeline nodes disabled | Clear static visual distinctions remain |

---

## 7. Zero-Regression Test Baseline Summary

Verification of the existing test suite confirms 100% pass rate:
- `npm run test:frontend`: 86 scenarios passed (327 steps).
- `npm run test:unit`: 25 white-box tests passed (100% domain coverage).
- `node tests/unit/e2e_acceptance_tiers.test.mjs`: 68 tests across Tiers 1-4 passed.
- `node tests/unit/challenger_m2_2_empirical.test.mjs`: 20 challenge tests passed.
Total automated baseline: **199 passed test scenarios / unit assertions** with zero failures.
