# Technical Specification Survey: Order Tracking (R4) & Themes, Accessibility & Execution Limits (R5)

**Author:** teamwork_spec_miner (`explorer_survey_figma_3`)  
**Parent Orchestrator:** `58c3ffd8-dc5b-402f-bd35-e8433b2f19cb`  
**Date:** 2026-10-31T21:35:00Z  
**Target Scope:** R4 (Seguimiento de pedidos fiel sin pérdida de funcionalidad) & R5 (Tema, accesibilidad y límites de ejecución)  

---

## Executive Summary

This survey probes the authoritative visual specification in Figma (`Order tracking - Desktop`, `05-figma-tracking.png`), prior visual audit captures (`11-web-tracking.png`, `12-web-tracking-loaded.png`), the live JavaScript/DOM architecture (`index.html`, `ui.js`, `seguimiento.js`, `mapaSeguimiento.js`, `app.js`, `styles.css`), and the executable Cucumber test suite (`frontend/features/seguimiento.feature`, `frontend/features/seguimiento_mapa.feature`).

The investigation identifies critical structural discrepancies between the current web layout and the authoritative Figma frame, diagnoses text wrapping and dark theme contrast failures, and defines the exact technical blueprint required to achieve high-fidelity alignment without breaking any functional or interface contracts.

---

## 1. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Tracking Layout | Two-Column Desktop Grid | Contained 2-column asynchronous layout (min-width: 992px) with ~62% left column (Map + Order Summary underneath) and ~38% right column (Status Card with ETA + Timeline + Callout). | Viewport width >= 992px, `#trackingLayout` | 2-column CSS Grid matching Figma `Order tracking - Desktop` | Reverts to 1-column single stack at mobile/tablet widths (< 992px) | `05-figma-tracking.png`, `styles.css:2140` |
| 2 | Tracking Layout | Contained Map Height on Left | Interactive map canvas contained to a balanced viewport height (~380px–420px on desktop) instead of dominating the whole screen (`calc(100vh - 120px)`). | Screen height & container CSS | Contained map canvas leaving immediate room for Order Summary card directly below | Minimum height floor 280px on desktop, 240px on mobile | `05-figma-tracking.png`, `styles.css:2165` |
| 3 | Tracking Layout | Order Summary Directly Under Map | Order summary card located directly beneath the map card in the left column, showing Order Number, total price, product items summary, and destination address + payment method. | Order data (`id`, `total`, `OrderItem`, `DeliveryAddress`, `Transaction`) | Compact order summary card spanning the width of the map | Shows fallback '-' or default strings if address/payment data is missing | `05-figma-tracking.png`, `index.html:876` |
| 4 | Map & Route | Interactive Google Map with Route | Real Google Maps canvas rendering origin store, delivery destination, and OSRM street route polyline. | Coordinates of restaurant and delivery address, `pedido.ruta` | Interactive vector map with route polyline | Falls back to dashed straight line if route unavailable; degrades to no-map if key rejected | `mapaSeguimiento.js:131`, `05-figma-tracking.png` |
| 5 | Map & Route | Animated Courier Marker on Route | Smoothly interpolated courier position between 4-second poll cycles using `requestAnimationFrame` and server-corrected time drift. | `pedido.envio_iniciado_en`, `plan_tiempos.en_camino`, `Date.now() + desfaseMs` | Moving HTML overlay marker (`.marcador-seguimiento--repartidor`) with bicycle icon | Hides courier marker when order is delivered or before departure (`salio && !entregado`) | `mapaSeguimiento.js:165`, `seguimiento.js:136` |
| 6 | Live Connection | Floating Live Connection Badge | Truthful live connection pill badge overlay in top-left of map with pulsing green dot (`Actualizando en vivo`), amber reconnecting badge (`Reconectando…`), or red disconnected badge (`Sin conexión`). | Polling health & network responses | Dynamic pill badge with ARIA status announcements | Switches to reconnecting on failure; stops after 5 consecutive failures | `05-figma-tracking.png`, `ui.js:1579`, `styles.css:3716` |
| 7 | ETA & Timeline | Prominent ETA Display | Prominent estimated arrival time (e.g. "12–18 min" or "12 min") in large bold display font (~2.5rem), accompanied by estimated arrival clock timestamp (`Llegada aprox. HH:MM`). | `linea.llegada.hora`, server-corrected time, `formatearRestante` | Large ETA value + arrival time subtext | Hidden automatically when order reaches terminal state (`entregado`/`cancelado`) | `05-figma-tracking.png`, `ui.js:1676`, `styles.css:3818` |
| 8 | ETA & Timeline | 4-Stage Chronological Timeline | Vertical timeline with 4 stages: Confirmación, Preparación, En camino, Entregado. Shows real timestamps for past events and "aprox. HH:MM" for future projected events. | `OrderStatusHistory` entries, `plan_tiempos`, `lineaDeTiempo()` | 4 distinct list items with icons, status badges, and formatted timestamps | Pedidos before simulation without time plans show stage titles without fabricated times | `05-figma-tracking.png`, `seguimiento.js:80`, `seguimiento_mapa.feature` |
| 9 | ETA & Timeline | Word-Wrap Protection on Stage Titles | Enforces `white-space: nowrap` and `min-width: 0` on stage names to prevent Spanish word breaking (e.g., prevents "Confirmació\nn" bug). | Stage label string (`.linea-tiempo__nombre`) | Clean single-line stage title | Prevents hyphenation / mid-word breaking on narrow panels | `11-web-tracking.png`, `styles.css:2293` |
| 10 | Order Action | Strict Conditional Order Cancellation | "Cancelar Pedido" button visible ONLY in states `pendiente` and `confirmado`. Strictly hidden once cooking/dispatch starts (`en_preparacion`, `en_camino`, `entregado`, `cancelado`). | `orderData.estado` | Secondary outline-danger button with confirmation dialog and PUT `/api/orders/:id/cancel` | Hidden completely (`display: none`) when cancellation is no longer allowed | `app.js:522`, `ui.js:1631`, `ORIGINAL_REQUEST.md:26` |
| 11 | Order Hierarchy | No Fabricated Courier or Chat Data | Explicitly retains UI hierarchy with real backend data only; DOES NOT invent fake driver name ("Diego Ramirez"), phone, rating, avatar, or courier chat. | Available backend order data | Clean status notification callout banner ("Ten tu celular cerca para recibir tu pedido") | No missing mock images or fake phone calls | `ORIGINAL_REQUEST.md:26`, `05-figma-tracking.png` |
| 12 | Navigation | Tracking Action Controls | "Volver al Menú" button navigating to `homeView` and "Ver Historial de Pedidos" button navigating to `orderHistoryView`. | Button click events | Calls `ui.showView('homeView')` / `ui.showView('orderHistoryView')` | Automatically stops active polling when navigating away | `app.js:138`, `ui.js:93` |
| 13 | Polling Lifecycle | Visibility-Aware API Polling | Polls `GET /api/orders/:id` every 4,000 ms. Automatically suspends polling when browser tab is hidden and resumes when visible. | `document.visibilitychange`, `document.hidden` | Starts/stops `setInterval` without redundant network requests | Re-polls immediately upon tab reactivation | `ui.js:1792` |
| 14 | Theme Support | High-Contrast Dark Mode Styling | Complete dark mode styling (`@media (prefers-color-scheme: dark)`) with dark surfaces (`#1E1E1E`), dark backgrounds (`#121212`), accessible orange ETA (`#F5AF69`), and dark text on light buttons. | User OS color scheme | WCAG AA compliant dark theme matching Figma structure | Fixes illegible white text on white banner buttons and light CTA controls | `styles.css:1450`, `styles.css:2944` |
| 15 | Accessibility | Keyboard & Screen Reader Operability | Visible 2px outline on `:focus-visible`, `h1#trackingHeadline` programmatic focus target with `tabindex="-1"`, `aria-live="polite"` live regions for status changes. | Keyboard Tab/Shift+Tab, Screen reader focus | WCAG 2.1/2.2 SC 2.4.7, 2.4.11, 4.1.3 compliance | Inactive mouse clicks have `outline: none` | `styles.css:1228`, `index.html:791` |
| 16 | Accessibility | Prefers-Reduced-Motion Compliance | Honors user system preference `prefers-reduced-motion: reduce` by disabling pulse animations on active timeline stage, live connection dot, and courier marker. | `prefers-reduced-motion: reduce` | Static non-animating indicators | Smooth scrolling disabled; transitions zeroed out | `styles.css:1300`, `styles.css:2360` |
| 17 | Responsive | 390px Viewport Integrity | Responsive layout down to 390px mobile viewport without horizontal scrolling (`overflow-x: hidden`), minimum 44×44px tap targets, and readable font sizes. | Viewport width 390px | Single-column scrollable layout with touch-friendly controls | Zero clipping or horizontal scrollbars | `ORIGINAL_REQUEST.md:36`, `styles.css:2128` |

---

## 2. Edge Cases

| # | Feature | Input / Condition | Observed / Required Behavior |
|---|---|---|---|
| 1 | Timeline Projection | Newly created order with `estado = 'pendiente'` and `plan_tiempos` | Stage 1 (Confirmación) is `en_curso` with estimated time; stages 2, 3, 4 are `pendiente` with projected sequential times calculated from plan durations. |
| 2 | Timeline Retardation | Order still in `pendiente` after planned duration has expired | Immediate next stage is projected starting from current time `ahoraMs` rather than past expired time; prevents displaying historical times for future steps. |
| 3 | Legacy Orders | Order created prior to simulation feature (no `plan_tiempos`, empty `historial`) | Displays current active stage from `estado` but omits timestamps for future stages; never fabricates fictitious hours. |
| 4 | Terminal Delivered | Order transition to `entregado` | All 4 timeline stages marked `hecha` with checkmarks; courier animation stops at destination; ETA container hidden; polling stops; success toast shown. |
| 5 | Terminal Cancelled | Order transition to `cancelado` | All timeline stages marked `cancelada` with strike-through / muted styling; ETA container hidden; polling stops; warning toast shown. |
| 6 | Order Cancellation | Order in `en_preparacion` or later attempting cancellation | `cancelOrderBtn` is hidden (`display: none`). Backend endpoint `/api/orders/:id/cancel` returns HTTP 400 if called directly. |
| 7 | Network Drop | Server unreachable during polling (HTTP 500 / network failure) | `liveIndicator` immediately turns amber with `Reconectando…`; notice displays "Sin conexión con el servidor, reintentando…"; re-tries up to 5 times. |
| 8 | Persistent Offline | 5 consecutive poll failures | `liveIndicator` turns red with `Sin conexión`; polling is cleanly stopped via `clearInterval` to avoid flooding network. |
| 9 | Google Maps Key Rejection | Invalid API key or domain restriction error (`gm_authFailure`) | `keyFueRechazada()` triggers; Google map container is cleanly hidden (`mostrarColumna(false)`); app degrades gracefully to text layout without crashing. |
| 10 | Route Latency | `pedido.ruta` not yet generated by backend OSRM on initial render | Map displays origin and destination with a clean dashed provisional polyline until route coordinates arrive, then smoothly replaces with street route. |
| 11 | Courier Animation | Browser tab backgrounded during delivery | `document.visibilitychange` stops polling interval and `cancelAnimationFrame`; upon tab refocus, polls state immediately and synchronizes courier position. |
| 12 | Timeline Text Wrapping | Narrow right column width (e.g. 320px–360px panel) | Stage names ("Confirmación", "Preparación") must not wrap mid-word ("Confirmació\nn"); "Ahora" badge wraps gracefully without breaking title string. |
| 13 | Dark Mode Banner CTA | OS in dark mode (`prefers-color-scheme: dark`) | White banner buttons (`.foodjet-hero-cta-btn`) have explicit dark text (`color: #121212 !important`), preventing white-on-white invisibility. |
| 14 | Dark Mode ETA Counter | OS in dark mode (`prefers-color-scheme: dark`) | Large ETA figure uses high-contrast light orange (`#F5AF69`), preventing unreadable dark red/orange on dark grey surface. |
| 15 | 200% Browser Zoom | Browser zoomed to 200% at 1440px or 1280px | Layout adapts with auto/min-height containers; text wraps cleanly without truncation; zero horizontal overflow. |
| 16 | Reduced Motion | User has `prefers-reduced-motion: reduce` enabled | All pulsing indicators (dot on live badge, active timeline icon glow, courier icon pulse) are completely stopped (`animation: none !important`). |

---

## 3. Detailed Structural Gap Analysis (Figma vs Current Web)

### 3.1 Layout Architecture Gap
- **Figma Design (`05-figma-tracking.png`):**
  - **Left Side:**
    1. Contained Interactive Map (`height: ~400px`, `border-radius: 16px`).
    2. Embedded Overlay Pill: `• Actualizando en vivo` positioned inside top-left corner of the map.
    3. Order Summary Card (`Tu pedido #FJ-2048`, `S/ 46.60`, items list, address & payment) positioned **directly under the map**.
  - **Right Side:**
    1. Prominent ETA Card with status badge (`• TU ANTOJO YA ESTÁ EN CAMINO`), huge ETA (`12–18 min`), and subtext (`Llegada estimada: 1:35–1:41 p. m.`).
    2. Chronological 4-Stage Timeline (Confirmación, Preparación, En camino, Entregado).
    3. Callout Notification Banner (`¡Ya falta poquito! / Ten tu celular cerca...`).
    4. Action buttons: `Cancelar Pedido` (conditional), `Volver al Menú`, `Ver Historial de Pedidos`.

- **Current Implementation (`12-web-tracking-loaded.png`, `index.html:805`):**
  - Left Side: Contains ONLY the map card (`#trackingMapCard`). The map has an exaggerated height (`min(640px, calc(100vh - 120px))`), leaving no space below it.
  - Right Side: Stacks `#statusCard` AND the "Detalles del pedido" card one under the other.
  - Connection indicator is rendered outside the map in the top header (`tracking-header`), separated from the map canvas.

### 3.2 Heading & Typography Gap
- **Figma Headline:** `¡Tu antojo va volando!` with subtitle `Pedido #FJ-2048 · Sigue cada parte del viaje.`.
- **Current Headline:** `Sigue tu pedido` / `Pedido #FJ0056 · Sigue cada parte del viaje en tiempo real.`.
  - *Recommendation:* Dynamically set headline to `¡Tu antojo va volando!` during active delivery / preparation as in Figma, and retain `#trackingHeadline` and `#trackingSubtitle` DOM contracts.

### 3.3 Visual Hierarchy & Non-Existent Courier Data Protection
- **Constraint (ORIGINAL_REQUEST.md:26):**
  "No inventar datos inexistentes de repartidor (nombre, avatar, valoración, teléfono), chat o soporte, conservando el espacio y jerarquía con la información real disponible y documentando la adaptación."
- In Figma, there is a mockup card for courier "Diego Ramirez" with a fake avatar and chat button.
- **Authoritative Resolution:**
  The backend database schema (`prisma/schema.prisma`) has no courier entities, chat tables, or driver profiles. Instead of inventing mock courier data, the UI will retain the exact visual balance by using a high-fidelity **Status Notification Callout Banner**:
  - Icon: Notification bell or delivery alert icon.
  - Title: Status-responsive encouragement (e.g. `¡Ya falta poquito!` during delivery, `¡En preparación!` during cooking).
  - Body: Truthful instruction based on real order state (e.g. `Ten tu celular cerca para recibir tu pedido en la puerta.` or `El restaurante está preparando tus productos con mucho cuidado.`).
  - Action Controls: `Cancelar Pedido` (when cancelable), `Volver al Menú`, `Ver Historial de Pedidos`.

---

## 4. DOM Contract & Interface Preservation Index

The following DOM element IDs and function interfaces exist in the current application and **MUST BE STRICTLY PRESERVED** by any visual restructuring:

### 4.1 DOM IDs Required by JavaScript
1. `trackingView` — Primary section view container toggled by `showView('trackingView')`.
2. `trackingHeadline` — Main heading element (`h1`) updated dynamically with status.
3. `trackingSubtitle` — Subtitle element displaying order number and status summary.
4. `liveIndicator` — Pill badge container toggling `.foodjet-badge--live`, `.foodjet-badge--reconnecting`, `.foodjet-badge--disconnected`.
5. `liveIndicatorText` — Text inside connection badge ("Actualizando en vivo", "Reconectando…", "Sin conexión").
6. `trackingLayout` — Grid container receiving class `.seguimiento--con-mapa`.
7. `trackingMapCard` — Map card column, shown/hidden by `mostrarColumna()`.
8. `trackingMap` — Google Maps container div instantiated by `google.maps.Map`.
9. `trackingRoute` — Floating route distance pill (`Faltan 1,3 km por calles...`).
10. `statusCard` — Status and progress card container.
11. `statusIcon` — Icon container updated with status icon class.
12. `statusTitle` — Heading updated with `vm.title`.
13. `statusDescription` — Paragraph updated with `vm.description`.
14. `estimatedTime` — Block containing the large ETA display (hidden on terminal states).
15. `etaValue` — Big ETA numeral (e.g. "12 min").
16. `etaText` — Subtext timestamp (e.g. "Llegada aprox. 4:01 p. m.").
17. `trackingConnection` — Diagnostic notice element for network warnings.
18. `step1`, `step2`, `step3`, `step4` — List items for the 4 chronological stages.
19. `stepTime1`, `stepTime2`, `stepTime3`, `stepTime4` — Time elements displaying real or estimated timestamps.
20. `orderNumber` — Order ID display (`#FJ0056`).
21. `orderPayment` — Payment method label ('Efectivo', 'Tarjeta', 'Billetera Digital').
22. `orderDate` — Order date formatted with `toLocaleDateString('es-PE')`.
23. `orderSubtotal` — Order subtotal (`S/ XX.XX`).
24. `orderTaxes` — Order taxes (`S/ XX.XX`).
25. `orderDelivery` — Delivery cost (`S/ XX.XX`).
26. `orderTotalFinal` — Total price (`S/ XX.XX`).
27. `cancelOrderBtn` — Order cancellation button with `data-order-id`.
28. `backToMenuFromTracking` — Return to menu button.
29. `trackingHistoryBtn` — Navigate to order history button.

### 4.2 Module Export Contracts
- `frontend/js/ui.js`:
  - `showView(viewToShowId)`
  - `startOrderTracking(paymentMethod, orderData)`
  - `stopOrderTracking()`
  - `pollTrackingOnce()`
  - `updateLiveIndicator(status, message)`
- `frontend/js/domain/seguimiento.js`:
  - `ETAPAS_SEGUIMIENTO`
  - `lineaDeTiempo(pedido, ahoraMs)`
  - `longitudRuta(ruta)`
  - `avanceDelReparto({ inicioMs, duracionMs, ahoraMs, entregado })`
  - `dividirRuta(ruta, fraccion)`
  - `formatearDistancia(metros)`
  - `formatearRestante(restanteMs)`
- `frontend/js/mapaSeguimiento.js`:
  - `mostrarMapaSeguimiento(pedido, apiKey)`
  - `detenerMapaSeguimiento()`
  - `crearMapaSeguimiento(ids)`

---

## 5. Themes, Accessibility & Execution Limits Survey

### 5.1 Light Theme Priority & Validation
- Figma reference is on a light surface (`#F8F8F4` / white).
- Base font colors: Primary text `#1C1C1C`, Secondary text `#6B6B66`, Border `#E6E4DC`.
- Light theme must be verified at **1440px** and **1280px** viewports before evaluating dark theme.

### 5.2 Dark Theme Remediations Needed
- **Banner and Light CTA Buttons:**
  - Selector: `.foodjet-hero-cta-btn`, `.btn-light`
  - Problem: In dark mode, `.foodjet-hero-cta-btn` keeps `background-color: #ffffff !important` while inheriting `--color-text-primary: #E8E8E8`, rendering light text on a white button.
  - Fix: Explicit rule in `@media (prefers-color-scheme: dark)`:
    ```css
    .foodjet-hero-cta-btn {
        background-color: #FFFFFF !important;
        color: #121212 !important;
    }
    ```
- **Timeline ETA Counter in Dark Mode:**
  - Selector: `.seguimiento__llegada-cifra`
  - Problem: Uses `var(--color-primary-dark, #D94310)`, which has low contrast against dark backgrounds.
  - Fix: In dark mode, use `--color-text-accessible-orange: #F5AF69`.
- **Timeline Text Wrapping:**
  - Selector: `.linea-tiempo__nombre`
  - Problem: In narrow right columns, "Confirmación" wraps as "Confirmació\nn".
  - Fix:
    ```css
    .linea-tiempo__nombre {
        white-space: nowrap;
    }
    .linea-tiempo__contenido {
        min-width: 0;
        flex-wrap: wrap;
    }
    ```

### 5.3 Accessibility (WCAG 2.1/2.2 AA)
- Focus rings: Must use 2px solid outline with 2px offset.
- `h1#trackingHeadline`: Must include `tabindex="-1"` so `viewToShow.querySelector('h1')?.focus()` actually shifts keyboard focus upon view navigation.
- Minimum interactive touch targets: 44×44px for `#cancelOrderBtn`, `#backToMenuFromTracking`, `#trackingHistoryBtn`.
- Zero horizontal overflow at 390px viewport (`overflow-x: hidden`).
- Prefers-reduced-motion: All pulse animations (`foodjet-pulse-live`, `etapa-en-curso`, `repartidor-late`) must be disabled when `prefers-reduced-motion: reduce` is active.

### 5.4 Execution Limits
- Strictly frontend-only (`frontend/index.html`, `frontend/styles.css`, `frontend/js/ui.js`, `frontend/js/mapaSeguimiento.js`).
- **NO changes to `backend/`**, Prisma schema, migrations, or database seeds.
- **NO Docker restarts, no destructive seed scripts**.
- **NO auto-commits, push, merge, or deployment**.
