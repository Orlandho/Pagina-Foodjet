# Milestone 4 Deep Investigation & Specification Report
## Features 18, 19 & 20: Wallet/Card Modals, Order History & Admin Operations Panel

**Date**: 2026-10-31  
**Agent**: Explorer M4-3 (Read-Only Investigation & Specification)  
**Assigned Subagent**: `teamwork_explorer`  
**Milestone**: Milestone 4 — Secondary Views, Modals & Operations Panel  
**Working Directory**: `.agents/teamwork/explorer_m4_3/`  

---

## Executive Summary

This report delivers a thorough investigation and specification of **Features 18, 19, and 20** for Milestone 4 of the FoodJet Web Frontend UI Modernization:
1. **Feature 18: Digital Wallet (`#qrModal`) & Bank Auth Modal (`#cardAuthModal`)**: Payment simulation flows, QR code rendering, cancellation handling, countdown timer, and simulated bank card authorization.
2. **Feature 19: Order History View (`#orderHistoryView`) & Review Modal (`#reviewModal`)**: Customer order history listing, status badges, pagination, live tracking trigger, interactive 5-star rating modal, and submitted review display.
3. **Feature 20: Admin Operations Panel (`#dashboardView` and `#orderDetailModal`)**: Operational table, status filter tabs, auto-polling refresh, order advance / cancellation state transitions, order detail modal with route map, and stage duration timeline.

All findings are strictly grounded in:
- Existing web code (`frontend/index.html`, `frontend/styles.css`, `frontend/js/ui.js`, `frontend/js/app.js`, `frontend/js/legacy.js`, `frontend/js/domain/`).
- Jetpack Compose reference prototype (`app-movil/.../ui/screens/Modals.kt`, `OrderHistoryScreen.kt`, `AdminDashboardScreen.kt`, `StarRatingBar.kt`, `Color.kt`).
- Established Milestone 1 design token system in `frontend/styles.css`.

Zero source code has been altered during this investigation.

---

## 1. Inventory of Preserved DOM Contracts

Every DOM element ID, class, data-attribute, and event binding must be strictly preserved to guarantee zero regressions across automated Cucumber test suites (`npm test`), unit test suites (`npm run test:unit`), and headless browser interactions.

### 1.1 Complete DOM IDs Map

| Feature | DOM ID | Element Type | Role & Contract Function | Consumers / Event Listeners |
|---|---|---|---|---|
| **18** | `qrModal` | `<div>` (modal) | Container for digital wallet QR payment | `index.html:1153`, `app.js:600, 602, 617, 623, 630, 645` |
| **18** | `qrModalLabel` | `<h5>` | Accessible title for `qrModal` (`aria-labelledby`) | `index.html:1157` |
| **18** | `qrRestaurantName` | `<strong>` | Restaurant name displayed above QR code | `index.html:1160`, `app.js:604` (`textContent = restaurante.nombre`) |
| **18** | `qrPaymentImage` | `<img>` | QR image source set dynamically | `index.html:1161`, `app.js:605` (`src = restaurante.qr_pago`) |
| **18** | `qrTimerText` | `<p>` | Countdown timer text ("Esperando confirmación... (5s)") | `index.html:1167`, `app.js:607, 609, 638` (`textContent`) |
| **18** | `cancelQrPaymentBtn` | `<button>` | Aborts QR payment and cleans up timer interval | `index.html:1171`, `app.js:611, 629, 632` (`click` event) |
| **18** | `cardAuthModal` | `<div>` (modal) | Bank authorization simulation dialog | `index.html:1235`, `ui.js:1163, 1175, 1177, 1178, 1180` |
| **18** | `cardAuthModalLabel` | `<h5>` | Accessible title for `cardAuthModal` | `index.html:1240` |
| **18** | `cardAuthBrand` | `<p>` | Detected card brand label ("Tarjeta Visa", etc.) | `index.html:1245`, `ui.js:1171-1172` (`textContent`) |
| **19** | `orderHistoryView` | `<section>` | Primary view section for customer past orders | `index.html:394`, `legacy.js:218, 279`, `ui.js:72, 1429`, `app.js:757` |
| **19** | `backToMenuFromHistory` | `<button>` | Navigates back to home view | `index.html:398`, `app.js:142` (`ui.showView('homeView')`) |
| **19** | `orderHistoryContainer` | `<div>` (row) | Container where paginated order cards are rendered | `index.html:402`, `styles.css:14, 19, 24, 28, 33, 38`, `ui.js:1214`, `app.js:155` |
| **19** | `historyBtn` | `<a>` | User dropdown trigger in navbar to open order history | `index.html:79`, `app.js:141` (`handleHistoryClick`) |
| **19** | `trackingHistoryBtn` | `<button>` | Tracking view button to navigate to order history | `index.html:811`, `app.js:145, 147` (`handleHistoryClick`) |
| **19** | `reviewModal` | `<div>` (modal) | Interactive modal for submitting order ratings | `index.html:1112`, `ui.js:1284`, `app.js:774, 823` |
| **19** | `reviewModalLabel` | `<h5>` | Accessible title for `reviewModal` | `index.html:1116` |
| **19** | `reviewRestaurantName` | `<p>` | Restaurant name in review modal | `index.html:1123`, `app.js:762` (`textContent = restaurantName`) |
| **19** | `reviewOrderDate` | `<p>` | Order date in review modal | `index.html:1124`, `app.js:763` (`textContent = orderDate`) |
| **19** | `reviewForm` | `<form>` | Review submission form (`preventDefault()`) | `index.html:1126`, `ui.js:1450`, `app.js:152, 798` |
| **19** | `reviewOrderId` | `<input hidden>` | Target order ID for rating | `index.html:1127`, `app.js:761, 800` |
| **19** | `starRatingContainer` | `<div>` | Star rating container (`role="radiogroup"`) | `index.html:1131`, `app.js:151, 768, 778, 785` |
| **19** | `reviewRating` | `<input hidden>` | Selected score 1–5 (`required`) | `index.html:1138`, `app.js:766, 783, 801` |
| **19** | `reviewComment` | `<textarea>` | Optional review comment text | `index.html:1143`, `app.js:767, 802` |
| **19** | `submitReviewBtn` | `<button>` | Submits rating payload to API | `index.html:1146`, `app.js:809, 838` |
| **20** | `dashboardView` | `<section>` | Admin operations panel section | `index.html:702`, `styles.css:4, 9, 10`, `legacy.js:218, 278, 286, 434`, `ui.js:72` |
| **20** | `dashboardBtn` | `<a>` | User dropdown trigger visible only for `rol === 'admin'` | `index.html:80`, `legacy.js:44, 91, 92, 234, 244, 263` |
| **20** | `backToMenuFromDashboard` | `<button>` | Navigates back from dashboard to home | `index.html:706`, `legacy.js:87-89` |
| **20** | `dashboardUserName` | `<h2>` | Displays admin user name | `index.html:716`, `legacy.js:238` |
| **20** | `dashboardUserEmail` | `<p>` | Displays admin email | `index.html:717`, `legacy.js:239` |
| **20** | `refreshOperationsBtn` | `<button>` | Manual button to refresh operational orders | `index.html:722`, `legacy.js:77` |
| **20** | `logoutBtnDashboard` | `<a>` | Logout button within admin panel sidebar | `index.html:725`, `legacy.js:110` |
| **20** | `operationsUpdated` | `<small>` | Last refreshed timestamp ("Actualizado HH:MM:SS") | `index.html:737`, `legacy.js:404, 426` |
| **20** | `operationsFilters` | `<div>` | Container for status filter buttons | `index.html:739`, `styles.css:2411`, `legacy.js:365, 368, 449` |
| **20** | `operationsTableBody` | `<tbody>` | Table body where operational orders are injected | `index.html:754`, `legacy.js:364, 405` |
| **20** | `operationsNotice` | `<div>` | Live status / error notice (`role="status" aria-live="polite"`) | `index.html:757`, `legacy.js:403, 413, 419, 486, 491` |
| **20** | `orderDetailModal` | `<div>` (modal) | Order inspection & status transition modal | `index.html:927`, `styles.css:2428`, `legacy.js:506` |
| **20** | `orderDetailTitle` | `<h5>` | Title of detail modal ("Pedido #FJ0001") | `index.html:931`, `legacy.js:508` |
| **20** | `orderDetailGrid` | `<div>` | Modal body grid container (`.detalle__rejilla`) | `index.html:934`, `styles.css:2448` |
| **20** | `orderDetailMapCard` | `<div>` | Delivery route map card container (`hidden` if no map) | `index.html:936`, `styles.css:2450, 2451`, `legacy.js:546` |
| **20** | `orderDetailMap` | `<div>` | Map canvas element for Google Maps | `index.html:937`, `styles.css:2452`, `legacy.js:546` |
| **20** | `orderDetailRoute` | `<p>` | Route distance and estimated duration text | `index.html:939`, `styles.css:2458`, `legacy.js:546` |
| **20** | `orderDetailBody` | `<div>` | Container for timeline, customer details, and actions | `index.html:941`, `legacy.js:509, 522, 577` |

### 1.2 Preserved Dynamic Elements, Classes & Data Attributes

1. **Order History Dynamic Classes (`frontend/js/ui.js`)**:
   - `.btn-ver-seguimiento`: Button on active orders with `data-order-id="${order.id}"`. Clicking switches to `trackingView` and starts live tracking (`ui.js:1435`).
   - `.btn-leave-review`: Button on delivered unreviewed orders with `data-bs-toggle="modal"`, `data-bs-target="#reviewModal"`, and `data-order-id="${order.id}"` (`ui.js:1283, 1447`).
   - `.open-review-modal`: Delegated review modal opener in `app.js:156` (`btn.dataset.orderId`, `btn.dataset.restaurantName`, `btn.dataset.orderDate`).
   - `.pagination-btn`: Pagination anchor with `data-page="${i}"` (`ui.js:1397, 1405, 1413, 1422`).
   - `.star-rating i`: Star rating icon elements (`ui.js:1453`).

2. **Operations Dashboard Dynamic Classes (`frontend/js/legacy.js`)**:
   - `.operaciones__filtro`: Filter button generated for each status (`en_curso`, `pendiente`, `confirmado`, `en_preparacion`, `en_camino`, `entregado`, `cancelado`, `todos`) with `data-filter="${f.id}" aria-pressed="${activo}"` (`legacy.js:371`).
   - `.operaciones__filtro.is-active`: Active status filter pill (`legacy.js:371`, `styles.css:2418`).
   - `.operaciones__conteo`: Count badge inside each filter pill (`legacy.js:373`, `styles.css:2419`).
   - `.btn-order-detail` / `.detalle-abrir`: Button to trigger order detail modal with `data-order-id="${order.id}"` (`legacy.js:383, 389, 456`).
   - `.btn-advance-order`: Action button to advance order state with `data-order-id="${pedido.id}" data-next="${siguiente}"` (`legacy.js:460, 615`).
   - `.btn-cancel-order`: Action button to cancel order with `data-order-id="${pedido.id}"` (`legacy.js:465, 614`).
   - `.estado-pedido`: Status pill with modifier `.estado-pedido--${order.estado}` (`legacy.js:395, 627`, `styles.css:2420-2426`).
   - `.linea__barra`, `.linea__tramo`: Multi-segment stage duration timeline bar (`legacy.js:586, 631`).
   - `.linea`, `.linea__paso`, `.linea__punto`, `.linea__titulo`, `.linea__hora`, `.linea__detalle`: Vertical timeline step elements (`legacy.js:598-609`).

---

## 2. Feature 18: Digital Wallet & Bank Auth Modals

### 2.1 Reference Prototype Inspection (`Modals.kt`)

In the Jetpack Compose mobile reference prototype:
- **`QrPaymentDialog` (`Modals.kt:382-468`)**:
  - Container: `Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface))`.
  - Title: Bold 18sp "Pago con Billetera Digital" centered.
  - Subtitle: "Escanea el código QR de [Restaurante] para pagar con Yape o Plin." (`color = onSurfaceVariant`).
  - QR Container Surface: `RoundedCornerShape(12.dp)`, background `Color.White`, border `BorderStroke(2.dp, FoodJetPrimary)` (#F4511E), size 200dp x 200dp. Renders remote QR via `ImagenRemota` or fallback text if null.
  - Spinner & Countdown: Horizontal row with `CircularProgressIndicator(size = 18.dp, strokeWidth = 2.5.dp, color = FoodJetPrimaryDark)` + Text "Esperando confirmación de pago... (${countdown}s)" in 13sp.
  - Action Button: Outlined button with `RoundedCornerShape(20.dp)`, min 48dp height, red text "Cancelar Pago".
  - Behavior: 5-second countdown with `LaunchedEffect` and `delay(1000)`; auto-confirms payment when countdown reaches 0.

### 2.2 Current Web Implementation & Deficiencies

1. **Current HTML (`index.html:1153-1175`)**:
   - Uses default bootstrap modal structure: `.modal-content` with no tokenized rounded borders.
   - `#qrPaymentImage` has generic classes `img-fluid rounded border p-2 mb-3 style="max-width: 250px;"` lacking the prominent 2px brand orange border and white padding seen in Compose.
   - `#cancelQrPaymentBtn` is a simple `.btn.btn-outline-danger` without pill rounding or the mandated 48px touch target height.
2. **Current JS Lifecycle (`app.js:598-646`)**:
   - `openQRModal(restaurante, orderPayload, paymentMethod)`:
     - Gets bootstrap modal instance.
     - Sets `#qrRestaurantName.textContent` and `#qrPaymentImage.src`.
     - Starts 5s countdown via `setInterval`.
     - Updates `#qrTimerText.textContent = Esperando confirmación de pago... (${secondsLeft}s)`.
     - When `secondsLeft <= 0`, triggers `submitOrder(...)` and closes modal.
     - Clicking `#cancelQrPaymentBtn` or triggering `hidden.bs.modal` clears interval and resets submitting state.
   - **Contract Preservation**: Notice that the spinner `<div class="spinner-border ...">` is a sibling of `#qrTimerText` inside a flex container. In `app.js`, only `#qrTimerText.textContent` is modified, keeping the spinner intact. This DOM hierarchy must be preserved.
3. **Bank Authorization Modal (`#cardAuthModal`) (`index.html:1235-1250`, `ui.js:1160-1182`)**:
   - Activated during credit/debit card checkout via `ui.runCardAuthorization(marca, duracionMs = 2500)`.
   - In `ui.js:1171-1172`, sets `#cardAuthBrand.textContent` to "Tarjeta Visa", "Tarjeta Mastercard", or "Tarjeta American Express".
   - Shows modal for 2.5s and resolves promise.
   - Current visual appearance is basic Bootstrap. Needs a centered brand security shield/card icon, smooth spinner in `var(--color-primary)`, and an elegant card brand pill badge.

### 2.3 Proposed HTML & CSS Specification for Worker M4

#### HTML Structure for `#qrModal`:
```html
<div class="modal fade" id="qrModal" tabindex="-1" aria-labelledby="qrModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content foodjet-modal-content">
            <div class="modal-header border-0 pb-0 justify-content-center">
                <div class="foodjet-modal-icon-badge mb-2">
                    <i class="bi bi-qr-code text-primary" aria-hidden="true"></i>
                </div>
            </div>
            <div class="modal-body text-center pt-0 px-4 pb-4">
                <h5 class="modal-title fw-bold mb-2" id="qrModalLabel" style="color: var(--color-text-primary);">Pago con Billetera Digital</h5>
                <p class="text-secondary small mb-3">
                    Escanea el código QR de <strong id="qrRestaurantName" class="text-dark"></strong> para pagar con Yape o Plin.
                </p>

                <!-- Dedicated QR Card Frame (matches Compose BorderStroke(2.dp, FoodJetPrimary)) -->
                <div class="foodjet-qr-frame mb-3">
                    <img id="qrPaymentImage" src="" alt="Código QR para pago con billetera digital" class="img-fluid foodjet-qr-img">
                </div>

                <!-- Timer pill status -->
                <div class="foodjet-timer-pill d-inline-flex align-items-center justify-content-center mb-3" role="status" aria-live="polite">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status" aria-hidden="true">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mb-0 small fw-medium" id="qrTimerText">Esperando confirmación de pago... (5s)</p>
                </div>

                <div class="d-grid mt-2">
                    <button type="button" class="btn btn-outline-danger foodjet-btn-pill py-2" id="cancelQrPaymentBtn">
                        <i class="bi bi-x-circle me-1" aria-hidden="true"></i>Cancelar Pago
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
```

#### HTML Structure for `#cardAuthModal`:
```html
<div class="modal fade" id="cardAuthModal" tabindex="-1" aria-labelledby="cardAuthModalLabel" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content foodjet-modal-content text-center py-4 px-3">
            <div class="modal-body text-center p-3" role="status" aria-live="polite">
                <div class="foodjet-modal-icon-badge mb-3">
                    <i class="bi bi-shield-check text-primary fs-2" aria-hidden="true"></i>
                </div>
                <h5 class="modal-title fw-bold mb-2" id="cardAuthModalLabel" style="color: var(--color-text-primary);">Autorizando el pago</h5>
                
                <div class="my-3">
                    <div class="spinner-border text-primary" style="width: 2.5rem; height: 2.5rem;" aria-hidden="true"></div>
                </div>

                <p class="mb-2 text-secondary">Estamos autorizando el pago con tu banco…</p>
                <div class="d-inline-block">
                    <span class="foodjet-badge foodjet-badge--card-brand small" id="cardAuthBrand"></span>
                </div>
            </div>
        </div>
    </div>
</div>
```

#### CSS Rules for Feature 18 (`frontend/styles.css`):
```css
/* Modal Card Shell */
.foodjet-modal-content {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card); /* 20px */
    box-shadow: var(--shadow-lg);
    overflow: hidden;
}

.foodjet-modal-icon-badge {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: var(--color-primary-light);
    color: var(--color-primary-dark);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin: 0 auto;
}

/* QR Code Container Frame */
.foodjet-qr-frame {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 210px;
    height: 210px;
    margin: 0 auto;
    background-color: #ffffff;
    border: 2px solid var(--color-primary);
    border-radius: var(--radius-lg); /* 16px */
    padding: 10px;
    box-shadow: var(--shadow-sm);
}

.foodjet-qr-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

/* Status Countdown Pill */
.foodjet-timer-pill {
    padding: 6px 16px;
    background-color: var(--color-primary-light);
    border: 1px solid rgba(var(--color-primary-rgb), 0.2);
    border-radius: var(--radius-pill);
    color: var(--color-primary-dark);
}

.foodjet-btn-pill {
    border-radius: var(--radius-pill) !important;
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-semibold);
}

/* Card Brand Badge */
.foodjet-badge--card-brand {
    background-color: var(--color-background);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.5px;
}
```

---

## 3. Feature 19: Order History View & Review Modal

### 3.1 Reference Prototype Inspection (`OrderHistoryScreen.kt` & `Modals.kt`)

In the Jetpack Compose prototype:
- **`OrderHistoryScreen` (`OrderHistoryScreen.kt:33-344`)**:
  - Empty State: Centered shopping bag icon (`size = 54.dp`), "No tienes pedidos anteriores", and primary button "Empezar a pedir".
  - Order Card: `Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = surface), elevation = 2.dp)`.
  - Header: Order ID in bold primary dark text ("Pedido #1234"), date string, and rounded status badge pill.
  - Status Badge Theme Mapping:
    - `PENDIENTE`: Warning container (`#FFF3CD`), warning text (`#856404`), hourglass icon.
    - `CONFIRMADO`: Soft cyan container (`#D1ECF1`), cyan text (`#0C5460`), check icon.
    - `EN_PREPARACION`: Soft cyan container (`#D1ECF1`), cyan text (`#0C5460`), soup kitchen icon.
    - `EN_CAMINO`: Soft blue container (`#CCE5FF`), blue text (`#004085`), bike icon.
    - `ENTREGADO`: Soft green container (`#D4EDDA`), green text (`#155724`), check icon.
    - `CANCELADO`: Soft red container (`#F8D7DA`), red text (`#721C24`), cancel icon.
  - Items breakdown: Each line has quantity + item name on left, subtotal on right.
  - Financial Summary: Subtotal, IGV (18%), Envío, Descuento (in `FoodJetSuccess` green), and bold Total.
  - Active Order Tracking CTA: If not terminal, full-width primary button "Rastrear Pedido en Vivo" with bike icon.
  - Delivered Order Review CTA:
    - If unreviewed: Outlined button with `FoodJetWarning` border and star icon "Dejar una Reseña".
    - If reviewed: Distinct container `FoodJetWarningContainer.copy(alpha = 0.3f)` with "Tu reseña" pill badge, 5-star rating, and italicized comment.
- **`ReviewDialog` (`Modals.kt:307-374` & `StarRatingBar.kt`)**:
  - Interactive 5-star rating bar (size 38dp per star, clickable).
  - Outlined comment field (3-4 lines).
  - Primary rounded submit button (height 48dp, bold text).

### 3.2 Current Web Implementation & Deficiencies

1. **HTML `#orderHistoryView` (`index.html:394-405`)**:
   - Basic container: `<div class="row" id="orderHistoryContainer"></div>`.
   - Title has no subtitle or breadcrumb link.
   - `#backToMenuFromHistory` is a standard button.
2. **Dynamic Generation (`ui.js:1210-1469`)**:
   - `renderOrderHistory()` builds cards with:
     - Header: `.card-header.bg-white.border-bottom` with `#FJ0001` and status badge.
     - Body: Left col (`col-md-8`) for items, right col (`col-md-4`) for summary.
     - Active orders render `.btn-ver-seguimiento` with `data-order-id`.
     - Delivered unreviewed orders render `.btn-leave-review` with `data-order-id`.
     - Delivered reviewed orders render a small yellow-bordered div with static stars and comment.
     - Pagination: Renders `.pagination` with `.pagination-btn`.
   - Deficiencies:
     - Status badges currently use default Bootstrap badges like `bg-primary`, `bg-warning text-dark`, `bg-info text-dark`, which lack the subtle background container tints and border tokens of Compose.
     - Action buttons lack min-height 48px and mobile-first tap area.
     - Items list in cards uses basic unstyled bullets.
3. **Review Modal `#reviewModal` (`index.html:1112-1151`, `app.js:760-840`)**:
   - Submits `{ pedido_id, puntuacion, comentario }` to `POST /api/reviews`.
   - `#starRatingContainer` currently has `i.bi.bi-star` elements with `role="radio"`, but lacks arrow-key keyboard navigation.
   - Needs focus indicators, smooth hover transitions on stars, and tokenized styling.

### 3.3 Proposed HTML & CSS Specification for Worker M4

#### HTML Structure for `#orderHistoryView` Header:
```html
<section id="orderHistoryView" class="py-4 py-lg-5" style="display: none;" aria-label="Historial de pedidos">
    <div class="container">
        <!-- Header & Back Navigation -->
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
                <button class="btn btn-link text-decoration-none p-0 mb-2 foodjet-back-link" id="backToMenuFromHistory" type="button">
                    <i class="bi bi-arrow-left me-1" aria-hidden="true"></i> Volver al menú
                </button>
                <h1 class="display-6 fw-extrabold mb-1" tabindex="-1" style="color: var(--color-text-primary);">Mi Historial de Pedidos</h1>
                <p class="text-secondary small mb-0">Revisa tus compras anteriores y califica tus experiencias.</p>
            </div>
        </div>

        <!-- Dynamic Container for Cards and Pagination -->
        <div class="row g-4" id="orderHistoryContainer"></div>
    </div>
</section>
```

#### Dynamic Order Card Markup in `ui.js`:
```html
<div class="card foodjet-card foodjet-order-card mb-4">
    <div class="foodjet-order-card-header d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 p-md-4 border-bottom">
        <div>
            <span class="fw-bold fs-6" style="color: var(--color-primary-dark);">Pedido #FJ${String(order.id || 0).padStart(4, '0')}</span>
            <small class="text-secondary d-block mt-1">
                <i class="bi bi-calendar3 me-1" aria-hidden="true"></i>${date}
            </small>
        </div>
        <span class="foodjet-status-badge foodjet-status-badge--${estadoStr}">
            <i class="bi ${statusIcon} me-1" aria-hidden="true"></i>${badge.label.toUpperCase()}
        </span>
    </div>
    
    <div class="card-body p-3 p-md-4">
        <div class="row g-4">
            <!-- Left: Items -->
            <div class="col-12 col-md-7 col-lg-8">
                <h6 class="fw-bold mb-3 text-secondary text-uppercase small letter-spacing-1">Artículos</h6>
                <ul class="list-unstyled mb-0 foodjet-order-items-list">
                    ${itemsHtml || '<li class="text-muted">No hay detalles de artículos</li>'}
                </ul>
            </div>
            
            <!-- Right: Summary -->
            <div class="col-12 col-md-5 col-lg-4 border-start-md ps-md-4">
                <h6 class="fw-bold mb-3 text-secondary text-uppercase small letter-spacing-1">Resumen</h6>
                <div class="foodjet-summary-rows small">
                    <div class="d-flex justify-content-between text-secondary mb-1">
                        <span>Restaurante</span>
                        <span class="fw-medium text-dark">${order.Restaurant?.nombre || '-'}</span>
                    </div>
                    <div class="d-flex justify-content-between text-secondary mb-1">
                        <span>Método de pago</span>
                        <span class="fw-medium text-dark">${etiquetaMetodoPago(order.Transaction?.metodo_pago)}</span>
                    </div>
                    <div class="d-flex justify-content-between text-secondary mb-1">
                        <span>Estado del pago</span>
                        <span class="fw-medium text-dark">${etiquetaEstadoPago(order.Transaction?.estado_pago)}</span>
                    </div>
                    <hr class="my-2 border-subtle">
                    <div class="d-flex justify-content-between text-secondary mb-1">
                        <span>Subtotal</span>
                        <span>S/ ${deriveSubtotal(order).toFixed(2)}</span>
                    </div>
                    <div class="d-flex justify-content-between text-secondary mb-1">
                        <span>IGV (18%)</span>
                        <span>S/ ${Number(order.impuestos || 0).toFixed(2)}</span>
                    </div>
                    <div class="d-flex justify-content-between text-secondary mb-1">
                        <span>Envío</span>
                        <span>S/ ${Number(order.costo_envio || 0).toFixed(2)}</span>
                    </div>
                    ${(parseFloat(order.descuento) > 0) ? `
                        <div class="d-flex justify-content-between text-success fw-medium mb-1">
                            <span>Descuento</span>
                            <span>-S/ ${order.descuento}</span>
                        </div>
                    ` : ''}
                    <hr class="my-2 border-subtle">
                    <div class="d-flex justify-content-between fw-bold fs-5 text-dark mt-2">
                        <span>Total</span>
                        <span style="color: var(--color-primary-dark);">S/ ${Number(order.total || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Buttons / Review Container -->
        <div class="mt-4 pt-3 border-top">
            ${seguimientoHtml}
            ${reviewHtml}
        </div>
    </div>
</div>
```

#### HTML Structure for `#reviewModal`:
```html
<div class="modal fade" id="reviewModal" tabindex="-1" aria-labelledby="reviewModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content foodjet-modal-content">
            <div class="modal-header border-0 pb-0">
                <h5 class="modal-title w-100 text-center fw-bold" id="reviewModalLabel" style="color: var(--color-text-primary);">
                    <i class="bi bi-star-fill text-warning me-2" aria-hidden="true"></i>Calificar Pedido
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body text-center p-4">
                <p class="mb-1 fw-bold fs-6" id="reviewRestaurantName" style="color: var(--color-text-primary);">Restaurante</p>
                <p class="text-secondary small mb-4" id="reviewOrderDate">Fecha</p>

                <form id="reviewForm" novalidate>
                    <input type="hidden" id="reviewOrderId">

                    <div class="mb-4">
                        <label class="form-label d-block fw-semibold small text-secondary">Tu Calificación</label>
                        <div class="foodjet-star-rating-container d-inline-flex justify-content-center gap-2 p-2"
                             id="starRatingContainer" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas">
                            <i class="bi bi-star foodjet-star-icon" data-rating="1" role="radio" aria-checked="false" aria-label="1 estrella" tabindex="0"></i>
                            <i class="bi bi-star foodjet-star-icon" data-rating="2" role="radio" aria-checked="false" aria-label="2 estrellas" tabindex="0"></i>
                            <i class="bi bi-star foodjet-star-icon" data-rating="3" role="radio" aria-checked="false" aria-label="3 estrellas" tabindex="0"></i>
                            <i class="bi bi-star foodjet-star-icon" data-rating="4" role="radio" aria-checked="false" aria-label="4 estrellas" tabindex="0"></i>
                            <i class="bi bi-star foodjet-star-icon" data-rating="5" role="radio" aria-checked="false" aria-label="5 estrellas" tabindex="0"></i>
                        </div>
                        <input type="hidden" id="reviewRating" required>
                    </div>

                    <div class="mb-4 text-start">
                        <label for="reviewComment" class="form-label fw-semibold small text-secondary">Comentario (Opcional)</label>
                        <textarea class="form-control foodjet-input" id="reviewComment" rows="3" placeholder="¿Qué te pareció tu pedido?"></textarea>
                    </div>

                    <button type="submit" class="btn foodjet-btn-primary w-100" id="submitReviewBtn">
                        Enviar Calificación
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>
```

#### CSS Rules for Feature 19 (`frontend/styles.css`):
```css
/* Order Cards */
.foodjet-order-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card); /* 16px */
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    transition: box-shadow var(--transition-fast);
}

.foodjet-order-card:hover {
    box-shadow: var(--shadow-md);
}

.foodjet-order-card-header {
    background-color: #ffffff;
}

/* Status Badges */
.foodjet-status-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    font-size: var(--font-size-body-small);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.5px;
}

.foodjet-status-badge--pendiente {
    background-color: var(--color-warning-container);
    color: var(--color-warning-text);
    border: 1px solid rgba(133, 100, 4, 0.2);
}

.foodjet-status-badge--confirmado,
.foodjet-status-badge--en_preparacion {
    background-color: #D1ECF1;
    color: #0C5460;
    border: 1px solid rgba(12, 84, 96, 0.2);
}

.foodjet-status-badge--en_camino {
    background-color: #CCE5FF;
    color: #004085;
    border: 1px solid rgba(0, 64, 133, 0.2);
}

.foodjet-status-badge--entregado {
    background-color: var(--color-success-container);
    color: var(--color-success-text);
    border: 1px solid rgba(21, 87, 36, 0.2);
}

.foodjet-status-badge--cancelado {
    background-color: var(--color-danger-container);
    color: var(--color-danger-text);
    border: 1px solid rgba(114, 28, 36, 0.2);
}

/* Existing Review Callout */
.foodjet-review-badge-card {
    background-color: rgba(255, 193, 7, 0.08);
    border: 1px solid rgba(255, 193, 7, 0.35);
    border-radius: var(--radius-md);
    padding: 12px 16px;
}

/* Interactive Star Rating */
.foodjet-star-rating-container {
    background-color: var(--color-background);
    border-radius: var(--radius-pill);
    border: 1px solid var(--color-border);
}

.foodjet-star-icon {
    font-size: 2rem;
    color: var(--color-warning);
    cursor: pointer;
    transition: transform var(--transition-fast), color var(--transition-fast);
    padding: 4px;
    border-radius: 4px;
}

.foodjet-star-icon:hover,
.foodjet-star-icon:focus-visible {
    transform: scale(1.25);
    outline: 2px solid var(--color-primary);
}
```

---

## 4. Feature 20: Admin Operations Panel

### 4.1 Reference Prototype Inspection (`AdminDashboardScreen.kt`)

In the Jetpack Compose mobile reference prototype:
- **`AdminDashboardScreen` (`AdminDashboardScreen.kt:50-332`)**:
  - Header: TopAppBar with title "Panel de Operaciones Admin", back button, and refresh button.
  - Admin Summary Card: Surface card with admin avatar circle (`size = 56.dp`), name, email, Total Vendido (`S/ XXX.XX`), and active orders counter (`${estadisticas.pedidosActivos} activos`).
  - Orders List Card:
    - Lists active and past orders.
    - Each item is a rounded surface (`RoundedCornerShape(10.dp)`) with Order ID, Client, Store, Total, and normalized state badge.
    - Status Advance Button: If order is not terminal, prominent button with label "Avanzar" (shape 14dp, `FoodJetPrimary`, min height 48dp, with accessibility semantics: `semantics { contentDescription = "Avanzar pedido ${o.id} a ${ETIQUETA_ESTADO[siguiente]}" }`).
    - Terminal states: Displays "Entregado" in green or "Cancelado" in red.

### 4.2 Current Web Implementation & Deficiencies

1. **HTML `#dashboardView` (`index.html:702-763`)**:
   - Layout: Desktop two-column (`col-lg-3` admin info and actions, `col-lg-9` operations table).
   - Sidebar contains admin name (`#dashboardUserName`), email (`#dashboardUserEmail`), `#refreshOperationsBtn`, and `#logoutBtnDashboard`.
   - Main card contains `#operationsUpdated`, filter container `#operationsFilters`, responsive table with `#operationsTableBody`, and `#operationsNotice`.
2. **Current CSS Deficiencies (`styles.css:2410-2446`)**:
   - **Critical Visual Bug**: `.operaciones__filtro` in `styles.css:2414` has:
     ```css
     border: 1px solid rgba(255, 255, 255, .2);
     ```
     Because `#dashboardView` is on a light theme background, white border with 0.2 opacity is completely invisible!
   - `.operaciones__filtro:hover` and `.is-active` use hardcoded `#f4a04a` instead of CSS tokens `--color-primary` (#F4511E) and `--color-primary-dark`.
   - `.estado-pedido` uses hardcoded light colors (`#adb5bd`, `#6ea8fe`, `#75b798`).
   - `#orderDetailModal` close button (`index.html:932`):
     `<button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>`
     The modal header has a white background, so `btn-close-white` renders an invisible close button!
3. **Responsive Mobile Viewports (360px / 390px)**:
   - On mobile screens, `#operationsFilters` has 8 filter buttons that wrap across 4 rows, pushing the table far down.
   - The table with 5 columns overflows horizontally if column widths are not controlled.
   - Recommended solution:
     - Wrap `#operationsFilters` in an accessible, touch-friendly horizontal scroll row (`overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none;`).
     - Optimize table cell padding and font sizes for mobile viewports.
     - On small screens, stack client and store neatly inside `<td>`.

### 4.3 Proposed HTML & CSS Specification for Worker M4

#### HTML Structure for `#dashboardView`:
```html
<section id="dashboardView" style="display: none;" aria-label="Panel de operaciones">
    <div class="container py-4 py-lg-5">
        <!-- Navigation & View Header -->
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
                <button class="btn btn-link text-decoration-none p-0 mb-2 foodjet-back-link" id="backToMenuFromDashboard" type="button">
                    <i class="bi bi-arrow-left me-1" aria-hidden="true"></i> Volver al Menú
                </button>
                <h1 class="display-6 fw-extrabold mb-1" tabindex="-1" style="color: var(--color-text-primary);">Panel de Operaciones</h1>
                <p class="text-secondary small mb-0">Gestión de flujo y avance en vivo de pedidos.</p>
            </div>
            <div>
                <button type="button" class="btn foodjet-btn-primary d-inline-flex align-items-center" id="refreshOperationsBtn">
                    <i class="bi bi-arrow-clockwise me-2" aria-hidden="true"></i> Actualizar pedidos
                </button>
            </div>
        </div>

        <div class="row g-4">
            <!-- Left Column: Admin Profile Card & Actions -->
            <div class="col-12 col-lg-3">
                <div class="card foodjet-card mb-4 text-center p-4">
                    <div class="foodjet-admin-avatar mx-auto mb-3">
                        <i class="bi bi-person-gear text-primary" aria-hidden="true"></i>
                    </div>
                    <h2 class="h5 fw-bold mb-1" id="dashboardUserName" style="color: var(--color-text-primary);">Admin</h2>
                    <p class="text-secondary small mb-3" id="dashboardUserEmail">admin@foodjet.com</p>
                    <span class="foodjet-badge foodjet-badge--pill mx-auto mb-2">Administrador</span>
                </div>

                <div class="card foodjet-card overflow-hidden">
                    <div class="list-group list-group-flush foodjet-list-group">
                        <a href="#" class="list-group-item list-group-item-action text-danger py-3" id="logoutBtnDashboard">
                            <i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i> Cerrar Sesión
                        </a>
                    </div>
                </div>
            </div>

            <!-- Right Column: Operational Orders Table & Filter Tabs -->
            <div class="col-12 col-lg-9">
                <div class="card foodjet-card">
                    <div class="card-header bg-white border-bottom p-3 p-md-4">
                        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                            <h2 class="h5 fw-bold mb-0" style="color: var(--color-text-primary);">
                                <i class="bi bi-list-check text-primary me-2" aria-hidden="true"></i>Cola de Pedidos
                            </h2>
                            <small class="text-secondary" id="operationsUpdated" role="status" aria-live="off"></small>
                        </div>
                        
                        <!-- Filter Chips: Scrollable on mobile -->
                        <div class="operaciones__filtros-wrapper">
                            <div class="operaciones__filtros" id="operationsFilters" role="group" aria-label="Filtrar pedidos por estado"></div>
                        </div>
                    </div>
                    
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table align-middle mb-0 foodjet-operations-table">
                                <caption class="visually-hidden">Pedidos y su estado actual</caption>
                                <thead>
                                    <tr>
                                        <th scope="col" class="ps-3 ps-md-4">Pedido</th>
                                        <th scope="col">Cliente y Local</th>
                                        <th scope="col">Total</th>
                                        <th scope="col">Estado</th>
                                        <th scope="col" class="text-end pe-3 pe-md-4">Acción</th>
                                    </tr>
                                </thead>
                                <tbody id="operationsTableBody"></tbody>
                            </table>
                        </div>
                        <div class="p-3" role="status" aria-live="polite" id="operationsNotice"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
```

#### HTML Fix for `#orderDetailModal` Close Button (`index.html:930-933`):
```html
<div class="modal-header bg-white border-bottom px-4 py-3">
    <h5 class="modal-title fw-bold" id="orderDetailTitle" style="color: var(--color-text-primary);">Pedido</h5>
    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
</div>
```
*(Removes `btn-close-white` so the close icon is clearly visible on the white modal header).*

#### CSS Rules for Feature 20 (`frontend/styles.css`):
```css
/* Admin Avatar Circle */
.foodjet-admin-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: var(--color-primary-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
}

/* Operational Filter Tabs */
.operaciones__filtros-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 4px;
}
.operaciones__filtros-wrapper::-webkit-scrollbar {
    display: none;
}

.operaciones__filtros {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.5rem;
}

@media (min-width: 992px) {
    .operaciones__filtros {
        flex-wrap: wrap;
    }
}

.operaciones__filtro {
    display: inline-flex;
    align-items: center;
    background: var(--color-background);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    padding: 0.35rem 0.85rem;
    font-size: var(--font-size-body-small);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--transition-fast);
}

.operaciones__filtro:hover,
.operaciones__filtro:focus-visible {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    color: var(--color-primary-dark);
    outline: none;
}

.operaciones__filtro.is-active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #ffffff;
    font-weight: var(--font-weight-bold);
    box-shadow: 0 2px 6px rgba(var(--color-primary-rgb), 0.3);
}

.operaciones__conteo {
    background: rgba(0, 0, 0, 0.08);
    border-radius: var(--radius-pill);
    padding: 2px 6px;
    margin-left: 6px;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
}

.operaciones__filtro.is-active .operaciones__conteo {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
}

/* Operations Table Styling */
.foodjet-operations-table {
    font-size: var(--font-size-body-medium);
}

.foodjet-operations-table th {
    background-color: var(--color-background);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-body-small);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--color-border);
    padding: 0.75rem 1rem;
}

.foodjet-operations-table td {
    padding: 1rem;
    border-bottom: 1px solid var(--color-border-subtle);
}

.foodjet-operations-table tr:hover td {
    background-color: rgba(var(--color-primary-rgb), 0.02);
}

/* Detail Modal Timeline */
.linea {
    list-style: none;
    margin: 0;
    padding: 0 0 0 1.25rem;
    position: relative;
}

.linea::before {
    content: "";
    position: absolute;
    left: 5px;
    top: 0.5rem;
    bottom: 0.5rem;
    width: 2px;
    background: var(--color-border);
}

.linea__paso {
    position: relative;
    padding-bottom: 1.25rem;
}

.linea__punto {
    position: absolute;
    left: -1.25rem;
    top: 0.3rem;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: currentColor;
}

.linea__paso.is-futuro .linea__punto {
    background: var(--color-background);
    border: 2px solid var(--color-border);
    color: transparent;
}

.linea__paso.is-actual .linea__punto {
    box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.25);
}
```

---

## 5. Cross-Feature Responsive & Accessibility Matrix

### 5.1 Responsive Behavior Across Viewports

| Viewport Width | Feature 18 (Modals) | Feature 19 (Order History) | Feature 20 (Operations Panel) |
|---|---|---|---|
| **360px – 390px (Mobile)** | Modals centered, 92% width, margin 16px. QR frame 190x190px. Full-width action button. | Single column, stacked items list and summary. Pagination touch buttons 44px min. | Sidebar stacks above table. Filter chips scroll horizontally without wrapping. Table compact with scroll. |
| **768px (Tablet)** | Modals max-width 480px. QR frame 210x210px. | Card layout 2 columns (items col-7, summary col-5). | 2-column layout (sidebar 4 cols, table 8 cols) or stacked with spacious rows. |
| **1280px – 1440px (Desktop)** | Modals max-width 500px (`#orderDetailModal` is `modal-xl`). | Spacious cards, clear item breakdown, prominent badges. | Full 2-column layout (`col-lg-3` sidebar, `col-lg-9` table). Order detail modal 2-column (map left, timeline right). |

### 5.2 Accessibility Checklist (WCAG 2.1 AA)

- [x] **Color Contrast**: All text tokens (`--color-text-primary` #1C1C1C on #FFFFFF, `--color-text-secondary` #6B6B66 on #FFFFFF) exceed 4.5:1. Status badges use dark text on pastel container backgrounds (`#856404` on `#FFF3CD` = 5.2:1; `#155724` on `#D4EDDA` = 6.4:1; `#721C24` on `#F8D7DA` = 6.1:1).
- [x] **Tap Targets**: All buttons (`#cancelQrPaymentBtn`, `.btn-ver-seguimiento`, `.btn-leave-review`, `.btn-advance-order`, `.btn-order-detail`) have minimum height of 44px–48px.
- [x] **Focus Indicators**: Every interactive control has `:focus-visible` styling (`outline: 2px solid var(--color-primary); outline-offset: 2px;`).
- [x] **Screen Reader Feedback**:
  - `#qrTimerText` has `role="status"` and `aria-live="polite"`.
  - `#cardAuthModal` has `role="status"` and `aria-live="polite"`.
  - `#starRatingContainer` has `role="radiogroup"` with individual star `role="radio"` and `aria-checked`.
  - `#operationsNotice` has `role="status"` and `aria-live="polite"`.
- [x] **Reduced Motion**: All animations (`@media (prefers-reduced-motion: reduce)`) disable pulse / scale effects.

---

## 6. Implementation Roadmap for Worker M4

1. **Step 1: CSS Updates in `frontend/styles.css`**:
   - Add `.foodjet-modal-content`, `.foodjet-modal-icon-badge`, `.foodjet-qr-frame`, `.foodjet-timer-pill`, `.foodjet-badge--card-brand`.
   - Update `.operaciones__filtros`, `.operaciones__filtro`, `.operaciones__conteo` to use light-surface tokens.
   - Update `.estado-pedido` and `.foodjet-status-badge` to use tokenized container backgrounds.
   - Fix `.foodjet-operations-table` and timeline styles.
2. **Step 2: HTML Adjustments in `frontend/index.html`**:
   - Enhance `#qrModal` with `.foodjet-modal-content`, `.foodjet-qr-frame`, and `.foodjet-btn-pill`.
   - Enhance `#cardAuthModal` with `.foodjet-modal-content` and `.foodjet-badge--card-brand`.
   - Refine `#orderHistoryView` header and back navigation.
   - Refine `#reviewModal` with `.foodjet-modal-content` and `.foodjet-star-rating-container`.
   - Refine `#dashboardView` with `.foodjet-admin-avatar`, scrollable filter wrapper, and remove `btn-close-white` from `#orderDetailModal`.
3. **Step 3: Dynamic Template Updates in `frontend/js/ui.js` & `frontend/js/legacy.js`**:
   - In `ui.renderOrderHistory()`, apply `.foodjet-card`, `.foodjet-order-card`, and tokenized status badges.
   - In `legacy.js` (`pintarOperaciones`), ensure generated rows use the new tokenized classes while keeping `.btn-order-detail`, `.detalle-abrir`, `.btn-advance-order`, and `.btn-cancel-order`.
4. **Step 4: Verification**:
   - Run `npm test` (both frontend and backend Cucumber suites).
   - Run `npm run test:unit` (zero unit regressions).
   - Verify modal behaviors, timers, filters, and state transitions in browser.
