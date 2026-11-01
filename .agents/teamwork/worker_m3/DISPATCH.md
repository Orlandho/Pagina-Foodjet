# Task Assignment: Worker M3 (Checkout & Order Tracking Critical Flow Implementation)

**Role**: teamwork_worker
**Working Directory**: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m3\`
**Parent Conversation ID**: `20c340e3-fa46-461e-a7ae-9dd6bbd67479`
**Authoritative Request**: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md`
**Project Plan**: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md`
**Exclusive File Ownership**: `frontend/index.html`, `frontend/styles.css`, `frontend/js/ui.js`, `frontend/js/app.js`, `frontend/js/domain/checkout.js`.
(DO NOT touch any backend files, prisma schemas, seeds, Docker Compose, or Caddy configuration).

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Input Exploratory Handoffs (Read Carefully Before Modifying):
1. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m3_1\handoff.md` and `report.md` (Checkout 2-column layout, saved address chips, Google Maps cascading & R7 fallback)
2. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m3_2\handoff.md` and `report.md` (Payment 3-tile grid, Luhn card validation, coupons `PruebaCupon`/`FOODJET20`, student discount line, double-click prevention)
3. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m3_3\handoff.md` and `report.md` (Tracking live route map, ETA counter, live indicator pill, 4-step timeline, customer order cancellation)

## Deliverables & Implementation Scope

### 1. Checkout Responsive Layout & Delivery Information (`frontend/index.html`, `frontend/styles.css`, `frontend/js/ui.js`)
- Multi-column layout on desktop (>= 1280px / 992px): delivery and payment on left (`col-lg-7`), sticky order summary on right (`col-lg-5`, `.checkout-summary-sticky` with `position: sticky; top: 96px`).
- Single-column on mobile (< 992px / 360px / 390px): `.checkout-summary-sticky` transitions to `position: static` without horizontal overflow or keyboard obstruction.
- Delivery fields: `#customerName`, `#customerPhone` (sanitized to 9 digits), saved addresses chips `#savedAddressesList`, neutral fallback "Ingresar dirección de entrega", never store addresses.
- Interactive delivery map `#mapaEntrega` / `mapaEntrega.js`: preserve Google Maps key cascading (`GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_API_KEY_SECUNDARIA`), script cleanup (`limpiarResiduosGoogleMaps`), 100ms observation window for `gm_authFailure`, and smooth fallback to manual input + browser GPS without blocking orders (`faltaMarcarUbicacion = false`).

### 2. Payment Methods, Card Validation & Coupons (`frontend/index.html`, `frontend/styles.css`, `frontend/js/ui.js`, `frontend/js/app.js`, `frontend/js/domain/checkout.js`)
- Payment tile grid (`.payment-options-grid`): 3 interactive tiles for Cash (`#payCash`), Card (`#payCard`), Digital Wallet (`#payWallet`) with Compose styling (`.foodjet-card--selected` with peach `#FCF0E4` container and `#F4511E` border).
- Card validation: client-side Luhn verification (`domain/payment.js`), brand detection, expiration (MM/YY) and CVC formatting, inline error clearing.
- Coupons: Wire `#applyCouponBtn`, `#couponCode`, `#couponMessage`, `#removeCouponBtn` in `app.js` using `state.setActiveCoupon()`. Accept case-insensitive `PruebaCupon` (10%) and `FOODJET20` (20%), reject invalid with error message.
- Student discount line: Add `#studentDiscountRow` and `#studentDiscountAmount` to `#orderSummaryCard`. Calculate total student savings when customer is student and display line item.
- Order confirmation button: `#confirmOrderBtn` with loading spinner, disabled state on submit, and double-click / duplicate-submission prevention.
- Modals: `#qrModal` with 5-second countdown timer and `#cancelQrPaymentBtn`; `#cardAuthModal` bank simulation.

### 3. Order Tracking Live Map, Connection Indicator & Timeline (`frontend/index.html`, `frontend/styles.css`, `frontend/js/ui.js`)
- Headline: Compose `#trackingHeadline` ("¡Tu antojo va volando!" when `en_camino`, else "Sigue tu pedido") and `#trackingSubtitle` with order number.
- Route Map: Preserve `#trackingMapCard`, `#trackingMap`, `#trackingRoute`, and driver interpolation architecture from `mapaSeguimiento.js`.
- ETA Counter: Formatted `#etaValue` with 2.25rem bold digits and `#etaText` arrival estimates.
- Live Connection Indicator: Place `#liveIndicator` in tracking header with pulsing dot (`.foodjet-badge--live` green when polling, `.foodjet-badge--reconnecting` amber on transient error, `.foodjet-badge--disconnected` red on 5 failures).
- 4-Step Timeline: Style `#step1`–`#step4` with circular 32px nodes, completed checkmarks in green, active stage in primary orange with an "Ahora" badge, distinguishing real timestamps from estimated timestamps ("aprox.").
- Order Cancellation: `#cancelOrderBtn` visible strictly when `order.estado` is `pendiente` or `confirmado`, calling `PUT /api/orders/:id/cancel` with confirmation and toast feedback.

### 4. Verification & Tests
- Execute `npm run test:unit`
- Execute `node tests/unit/e2e_acceptance_tiers.test.mjs`
- Execute `npm run test:frontend`
- Execute `npm test`
Ensure 100% pass across all test suites (131 acceptance scenarios, 93 unit tests).

Write `report.md` and `handoff.md` in your working directory. Notify parent when done.


## 2026-10-30T23:26:37Z
[Message] timestamp=2026-10-30T23:26:37Z sender=20c340e3-fa46-461e-a7ae-9dd6bbd67479 priority=MESSAGE_PRIORITY_HIGH content=You are assigned as Worker M3 for FoodJet Frontend UI Modernization (Milestone 3: Checkout & Order Tracking Critical Flow).

Your working directory is: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m3\`
Your parent orchestrator is: `20c340e3-fa46-461e-a7ae-9dd6bbd67479`

Authoritative User Request (MUST READ FIRST):
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md`

Project Plan:
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md`

Detailed Task Assignment:
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m3\DISPATCH.md`

Input Exploratory Handoffs:
1. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m3_1\handoff.md` and `report.md` (Checkout 2-column layout, saved address chips, Google Maps cascading & R7 fallback)
2. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m3_2\handoff.md` and `report.md` (Payment 3-tile grid, Luhn card validation, coupons `PruebaCupon`/`FOODJET20`, student discount line, double-click prevention)
3. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m3_3\handoff.md` and `report.md` (Tracking live route map, ETA counter, live indicator pill, 4-step timeline, customer order cancellation)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You own and can modify ONLY:
- `frontend/index.html`
- `frontend/styles.css`
- `frontend/js/ui.js`
- `frontend/js/app.js`
- `frontend/js/domain/checkout.js` (for coupon validation and `cupon_id` in `buildOrderPayload`, maintaining full backwards compatibility with all existing domain tests)
DO NOT touch any backend files (`backend/`), Prisma files, seeds, Docker Compose, or Caddy.

Deliverables:
1. Checkout Layout & Delivery Information: 2-column desktop layout (>= 1280px / 992px) with delivery & payment on left, sticky order summary on right (`.checkout-summary-sticky` with `position: sticky; top: 96px`). Single-column mobile (< 992px) with `position: static` without horizontal overflow or keyboard obstruction. Saved address chips (`#savedAddressesList`), neutral fallback, phone sanitization to 9 digits. Interactive delivery map with Google Maps key cascading and Rule R7 cleanup and graceful fallback to manual input / browser GPS.
2. Payment Methods, Card Validation & Coupons: 3-tile payment grid (Cash, Card, Wallet) with Compose styling. Luhn card validation, brand detection, expiry/CVC formatting. Wire coupon application (`#applyCouponBtn`, `#couponCode`, `#couponMessage`, `#removeCouponBtn`) supporting `PruebaCupon` (10%) and `FOODJET20` (20%), rejecting invalid coupons. Add `#studentDiscountRow` and `#studentDiscountAmount` to order summary. Add `#confirmOrderBtn` with spinner and double-click prevention.
3. Order Tracking Live Map, Live Indicator & Timeline: Tracking headline ("¡Tu antojo va volando!" when `en_camino`), route map preservation, 2.25rem bold digits for `#etaValue`. Add `#liveIndicator` with green pulsing dot (`.foodjet-badge--live` polling, `.foodjet-badge--reconnecting` amber, `.foodjet-badge--disconnected` red). 4-step timeline with 32px circular nodes, green checkmarks, "Ahora" badge, distinguishing real timestamps from estimated timestamps ("aprox."). Customer cancellation button `#cancelOrderBtn` visible strictly when `order.estado` is `pendiente` or `confirmado`, calling `PUT /api/orders/:id/cancel`.
4. Verification: Run `npm run test:unit`, `node tests/unit/e2e_acceptance_tiers.test.mjs`, `npm run test:frontend`, and `npm test`. Ensure 100% pass across all 131 acceptance scenarios and 93 unit tests.

Write `report.md` and `handoff.md` in your working directory. When complete, notify parent via `send_message`.
