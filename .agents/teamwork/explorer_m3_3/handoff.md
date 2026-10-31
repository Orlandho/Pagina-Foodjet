# Handoff Report — Explorer M3-3: Order Tracking, Live Map & Timeline Modernization
**Author**: Explorer M3-3 (`teamwork_explorer`)
**Recipient**: Parent Orchestrator (`20c340e3-fa46-461e-a7ae-9dd6bbd67479`) / Worker M3-3
**Date**: 2026-10-30T23:25:00Z
**Scope**: Milestone 3 — Tracking View (#trackingView), Live Map (#mapaSeguimiento), Live Connection Indicator (#liveIndicator), ETA Counter, and 4-Step Timeline (#step1–#step4).

---

## 1. Observation

1. **Existing DOM & Tracking Structure**:
   In `frontend/index.html` lines 652–752, `#trackingView` contains `#trackingLayout`, `#trackingMapCard` (with `#trackingMap` and `#trackingRoute`), `#statusIcon`, `#statusTitle`, `#statusDescription`, `#estimatedTime` (`#etaValue`, `#etaText`), `#trackingConnection`, `<ol class="linea-tiempo">` with `#step1`–`#step4` and `#stepTime1`–`#stepTime4`, and order summary spans (`#orderNumber`, `#orderPayment`, `#orderDate`, `#orderSubtotal`, `#orderTaxes`, `#orderDelivery`, `#orderTotalFinal`), followed by action buttons `#backToMenuFromTracking` (has inline `style="display: none;"`) and `#trackingHistoryBtn`.
2. **Interactive Route Map Architecture**:
   In `frontend/js/mapaSeguimiento.js` lines 313–315, `principal = crearMapaSeguimiento({ lienzo: 'trackingMap', tarjeta: 'trackingMapCard', layout: 'trackingLayout', ruta: 'trackingRoute' })`. When store and delivery address coordinates exist and Google Maps API key is available, `mostrarColumna(true)` sets `trackingMapCard.hidden = false` and adds `.seguimiento--con-mapa` to `#trackingLayout`. Lines 170–195 animate the driver position smoothly every 250ms along OSRM street segments via `requestAnimationFrame` using `avanceDelReparto(...)` and `dividirRuta(...)` from `frontend/js/domain/seguimiento.js`.
3. **Live Indicator State in Polling Engine**:
   In `frontend/js/ui.js` lines 1558–1575 (`pollOnce`), polling queries `fetchOrderByIdAPI` every 4000ms (`POLL_MS = 4000`). On failure (`!resultado.ok`), it increments `trackingFallos` up to `MAX_FALLOS = 5` and sets text on `#trackingConnection`. In `frontend/styles.css` lines 450–492, `.foodjet-badge--live` and `.foodjet-badge__dot` already exist with `@keyframes foodjet-pulse-live 1.8s infinite ease-in-out`, but no live indicator pill is currently placed in `#trackingView`.
4. **Timeline Historical vs Estimated Timestamps**:
   In `frontend/js/domain/seguimiento.js` lines 80–110 (`lineaDeTiempo`), each stage receives `situacion: 'hecha' | 'en_curso' | 'pendiente' | 'cancelada'`, `hora`, and `estimada: boolean`. In `frontend/js/ui.js` lines 1520–1523, the timestamp is rendered as `<time datetime="...">` with `aprox. ` prepended if `etapa.estimada` is true. In `frontend/features/seguimiento_mapa.feature` lines 9–46, this behavior is strictly verified by scenarios `UT-SEG-001` through `UT-SEG-005`.
5. **Order Cancellation Backend Business Rule**:
   In `backend/src/routes/orderRoutes.js` line 22, the customer cancellation endpoint is `router.put('/:id/cancel', authMiddleware, orderController.cancelOrder)`. In `backend/src/controllers/orderController.js` lines 354–363, cancellation enforces `isCancelable(order.estado)` where `CANCELABLES = ['pendiente', 'confirmado']`. Cancellation from `en_preparacion`, `en_camino`, or `entregado` is rejected with HTTP 400/409.
6. **Compose Android Prototype Reference**:
   In `ciclo 9/.../TrackingScreen.kt` lines 216–285, the screen presents:
   - Dynamic headline: "¡Tu antojo va volando!" when `order.estado == OrderStatus.EN_CAMINO`, else "Sigue tu pedido".
   - Subtitle: `Pedido #FJXXXX · Sigue cada parte del viaje.`.
   - Floating "Actualizando en vivo" badge with green pulsing dot.
   - Prominent ETA counter: 34sp extra-bold countdown digits (e.g., "12 min") and arrival estimation.
   - 4-step vertical timeline with circular node colors (green check for completed, brand orange with "Ahora" pill for active, gray for pending).
   - Cancel button (`OutlinedButton` with error color) visible strictly when `order.estado.isCancelable`.
7. **Current Test Baseline**:
   - `npm run test:frontend`: 86 scenarios passed (327 steps).
   - `npm run test:unit`: 25 white-box unit tests passed (100% domain coverage).
   - `node tests/unit/e2e_acceptance_tiers.test.mjs`: 68 tests across Tiers 1–4 passed.
   - `node tests/unit/challenger_m2_2_empirical.test.mjs`: 20 challenge tests passed.

---

## 2. Logic Chain

1. **Header Modernization**:
   Observation 1 and Observation 6 show that the web client currently lacks a top header banner in `#trackingView`, whereas the Compose prototype establishes brand identity through "¡Tu antojo va volando!" and order metadata. Adding `#trackingHeadline` and `#trackingSubtitle` above `#trackingLayout` matches the prototype aesthetic without disturbing any child elements of `#trackingLayout`.
2. **Live Indicator Integration**:
   Observation 3 shows that while CSS tokens and pulse keyframes for `.foodjet-badge--live` exist in `styles.css`, `#trackingView` only updates plain text inside `#trackingConnection`. By placing `#liveIndicator` in the top header and updating its modifier classes (`--live`, `--reconnecting`, `--disconnected`) in `ui.js:pollOnce()`, the client gains visible, accessible, real-time connection status across both map-enabled and map-fallback states.
3. **Preservation of Route Map & Driver Animation**:
   Observation 2 demonstrates that `mapaSeguimiento.js` is deeply coupled to element IDs `trackingMap`, `trackingMapCard`, `trackingLayout`, and `trackingRoute`. To prevent broken map instances or animation leaks, these 4 IDs, their hierarchical relationship, and the class toggle `.seguimiento--con-mapa` must remain untouched.
4. **4-Step Timeline Contract & Visual Upgrades**:
   Observation 4 shows that `orderStatus.steps.mjs` and `seguimiento_mapa.feature` depend on `#step1`–`#step4`, `#stepTime1`–`#stepTime4`, and attribute `data-situacion`. Upgrading the styling to feature 32px circular nodes, green connecting lines for completed stages, and an `.linea-tiempo__ahora-badge` ("Ahora") for active stages enhances visual fidelity while keeping DOM IDs and dataset attributes 100% backward compatible.
5. **Customer Order Cancellation Button**:
   Observation 5 establishes that the backend already provides `PUT /api/orders/:id/cancel` restricted to `['pendiente', 'confirmado']`. Observation 6 shows the Compose prototype implements this via a dedicated cancel button. Adding `#cancelOrderBtn` inside the details action area and toggling its visibility via `['pendiente', 'confirmado'].includes(vm.estado)` delivers Feature 15 with full business rule alignment.
6. **Zero-Regression Guarantee**:
   Observation 7 establishes a passing baseline of 199 tests. Preserving all 23 legacy DOM IDs guarantees that cucumber step definitions and unit tests will continue to pass without modification.

---

## 3. Caveats

1. **Google Maps API Key Dependency**: The interactive route map (`#trackingMap`) requires a valid Google Maps API key with Maps JavaScript API enabled. In environments without an API key or when network errors occur, the map card is hidden cleanly via `hidden`, and the tracking panel centers as a single column. The blueprint explicitly accommodates this degraded mode.
2. **Order Cancellation Concurrency**: If a restaurant or admin advances the order to `en_preparacion` concurrently while the customer views `pendiente`, the backend returns HTTP 409 (`Conflict`). The UI must handle this by displaying a toast and calling `pollOnce()` to refresh the timeline.
3. **Mobile Screen Real Estate**: On small screens (360px), map height must not exceed 280px to avoid pushing the status card and timeline below the initial viewport fold.

---

## 4. Conclusion

The Order Tracking View is thoroughly analyzed and ready for implementation by the Worker agent. The implementation requires:
1. Enhancing `frontend/index.html` with `#trackingHeadline`, `#trackingSubtitle`, `#liveIndicator`, `#cancelOrderBtn`, and Compose card structure while preserving all 23 existing DOM IDs.
2. Appending the specified CSS rules to `frontend/styles.css` using the design token system (`--color-*`, `--radius-*`, `--font-*`).
3. Enhancing `frontend/js/ui.js` (`applyTrackingViewModel` and `pollOnce`) to update the live indicator, dynamic headline, and cancel button visibility.
4. Hooking `#cancelOrderBtn` to `PUT /api/orders/:id/cancel` with confirmation and toast feedback.

---

## 5. Verification Method

To verify the implementation independently:

1. **Verify Preserved DOM IDs**:
   Inspect `frontend/index.html` to confirm all 23 required DOM IDs exist:
   `trackingView`, `trackingLayout`, `trackingMapCard`, `trackingMap`, `trackingRoute`, `statusIcon`, `statusTitle`, `statusDescription`, `estimatedTime`, `etaValue`, `etaText`, `trackingConnection`, `step1`, `stepTime1`, `step2`, `stepTime2`, `step3`, `stepTime3`, `step4`, `stepTime4`, `orderNumber`, `orderPayment`, `orderDate`, `orderSubtotal`, `orderTaxes`, `orderDelivery`, `orderTotalFinal`, `backToMenuFromTracking`, `trackingHistoryBtn`.
2. **Verify New Elements**:
   Confirm presence of `#trackingHeadline`, `#trackingSubtitle`, `#liveIndicator`, `#liveIndicatorText`, and `#cancelOrderBtn`.
3. **Execute Automated Test Suites**:
   Run the full verification suite in terminal:
   ```powershell
   npm run test:frontend
   npm run test:unit
   node tests/unit/e2e_acceptance_tiers.test.mjs
   node tests/unit/challenger_m2_2_empirical.test.mjs
   ```
   *Expected result*: 100% passing tests (0 failures, 0 regressions).
4. **Inspect Live Indicator State Transitions**:
   Verify in `frontend/js/ui.js`:
   - Connected poll -> `.foodjet-badge--live` ("Actualizando en vivo").
   - Transient failure -> `.foodjet-badge--reconnecting` ("Reconectando…").
   - 5 consecutive failures -> `.foodjet-badge--disconnected` ("Sin conexión").
5. **Inspect Responsive Layout**:
   - Desktop (>= 992px): 2 columns (`.seguimiento--con-mapa`), map sticky at `top: 88px`.
   - Mobile (< 992px): 1 single column, map stacked above status card, no horizontal scroll.
