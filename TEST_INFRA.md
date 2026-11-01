# FoodJet — E2E Test Infrastructure & Acceptance Suite Specification

**Version**: 1.0.0  
**Date**: 2026-10-29  
**Author**: E2E Test Writer (`test_writer_e2e_1`)  
**Target Repository**: `Pagina-Foodjet`  
**Active Branch**: `feat/UI-frontend-update`  

---

## 1. Executive Summary & Architecture Overview

The FoodJet testing infrastructure provides a robust, multi-layered quality assurance harness designed to validate all 23 features defined in `PROJECT.md` across four systematic tiers of acceptance testing:
- **Tier 1**: Isolated Feature Coverage (>= 5 cases per feature)
- **Tier 2**: Boundary, Negative & Corner Cases (>= 5 cases per feature)
- **Tier 3**: Cross-Feature Combinations & Pairwise State Interactions
- **Tier 4**: Real-World Application Workflows (End-to-End User Journeys)

### Test Runner Architecture

The project employs two complementary execution engines without introducing heavy external bundlers or breaking existing architectural boundaries:

1. **Cucumber.js BDD Runner (v12.9.0)**:
   - Configured via `cucumber.js` with dual profiles:
     - `frontend`: Native ES Modules (`import`), running `frontend/features/**/*.feature` with step definitions in `frontend/features/step_definitions/**/*.mjs` and lifecycle hooks in `frontend/features/support/hooks.mjs`.
     - `backend`: CommonJS (`require`), running `backend/features/**/*.feature` with step definitions in `backend/features/step_definitions/**/*.js`.
   - Generates the authoritative HTML report at `reports/cucumber.html` using Cucumber's standalone message-based application reporter.

2. **Node.js Native Test Runner (`node:test` & `node:assert/strict`)**:
   - Executes white-box domain unit tests and requirement-driven acceptance suites with zero external runtime overhead.
   - Built-in code coverage profiling (`--experimental-test-coverage`) monitoring line, branch, and function metrics across all headless domain modules (`frontend/js/domain/` and `backend/src/domain/`).

3. **Chrome DevTools MCP Browser Automation**:
   - Integrated browser automation protocol enabling responsive viewport validation (360px, 390px, 768px, 1280px, 1440px), visual audits, zoom 200% checks, and zero horizontal scroll assertions directly on the live web server (`http://localhost:8081`).

---

## 2. Test Execution Commands & Profiles

| Command | Harness / Runner | Scope | Output / Report |
|---|---|---|---|
| `npm test` | Cucumber.js (Frontend + Backend) | Master Acceptance Suite: All BDD scenarios | Console progress + `reports/cucumber.html` |
| `npm run test:frontend` | Cucumber.js (`frontend` profile) | Frontend client state, cart, payment, maps, tracking, validation | `reports/cucumber.html` (Frontend focus) |
| `npm run test:backend` | Cucumber.js (`backend` profile) | Backend API business rules, simulation, order status, coordinates | `reports/cucumber.html` (Backend focus) |
| `npm run test:unit` | Node Test Runner (`node --test`) | Domain logic, 4-tier acceptance suites, white-box coverage | Terminal TAP/Spec + Coverage Matrix |

> **Report Overwrite Nuance**: Running `npm test` sequentially executes frontend followed by backend profiles, overwriting `reports/cucumber.html` with the second profile. To preserve the frontend acceptance report as an artifact, run `npm run test:frontend`.

---

## 3. Systematic 4-Tier Testing Methodology

### Tier 1 — Feature Coverage (Isolated Equivalence Partitions)
- Minimum: **>= 5 test cases per feature**.
- Validates the primary positive contract and core functional capabilities of each component, module, and view in complete isolation.
- Verifies input/output equivalence classes, standard operational workflows, and UI state mutations.

### Tier 2 — Boundary, Negative & Corner Cases
- Minimum: **>= 5 test cases per feature**.
- Stress-tests inputs at, below, and above boundaries:
  - Empty strings, whitespace-only inputs, null/undefined payloads.
  - Zero, negative, and extreme numeric thresholds (e.g., coordinates outside [-90, 90] / [-180, 180], distances of 0m to 300+ km).
  - Validation constraints: exact 9-digit Peruvian telephone format, Luhn algorithm card check, card formatting masks (`formatCardNumber`, `formatExpiry`), invalid coupon codes (`INV-CODE`, expired, inactive).
  - Network and service contingencies: Google Maps API key rejection (`gm_authFailure`), offline network fallback, session token expiration (401/403).

### Tier 3 — Cross-Feature Combinations (Pairwise State Interactions)
- Validates combinatorial interactions between discrete features:
  - Student verification state + Coupon discounts on order totals.
  - Cart single-restaurant lock + Catalog restaurant switching + Favorites quick-add.
  - Delivery location geocoding + Map fallback + Card vs. Cash vs. Digital Wallet payment options.
  - Live tracking polling + Simulation step transitions + Order cancellation window.

### Tier 4 — Real-World Application Scenarios (End-to-End User Journeys)
- Multi-step, stateful user stories simulating realistic customer and administrator lifecycles:
  1. **Standard Customer Journey**: Unauthenticated browse -> Search & filter -> Add to cart -> Login -> Validated address & pin -> Card payment -> Live route tracking -> Delivery confirmation.
  2. **Student Promo Journey**: Student login -> Verify student badge -> Browse discounted items -> Apply coupon `FOODJET20` -> Complete order via QR Wallet -> Real-time status progression.
  3. **Contingency / Offline Journey**: Map unavailable / Invalid key -> Fallback to manual text address + GPS native -> Cash payment -> Order creation -> Terminal state tracking.
  4. **Order Cancellation & Recovery**: Add items -> Checkout -> Order placed ('pendiente') -> Immediate customer cancellation -> Cancellation reflected in timeline without estimates -> Cart re-fill and re-order.
  5. **Admin Operations Workflow**: Customer places order -> Admin logs in -> Views order in operations panel -> Filters by status -> Manually advances or cancels order -> Client tracking UI reacts live.

---

## 4. Master Feature Inventory & Acceptance Test Matrix (Features 1 – 23)

The following matrix maps all 23 features from `PROJECT.md § Feature Inventory` across the 4-tier acceptance model:

| # | Feature Name | Milestone | Tier 1: Feature Coverage (>=5 cases) | Tier 2: Boundary & Corner Cases (>=5 cases) | Tier 3: Combinations | Tier 4: Real-World E2E Scenarios | Primary Verification File & Runner |
|---|---|---|---|---|---|---|---|
| **1** | CSS Design Tokens System | M1 | Palette vars (--color-*), Font scale (--font-*), Radii tokens (--radius-*), Elevation shadows (--shadow-*), Spacing scale (--spacing-*) | Undefined token fallback, High contrast ratios (WCAG AA >= 4.5:1), Dark mode reset, Rem unit scaling, Reduced motion overrides | Token inheritance in cards + pills + buttons | Global theme switching across Home, Checkout, Tracking | `frontend/styles.css`<br>`tests/unit/e2e_acceptance_tiers.test.mjs`<br>`npm run test:unit` |
| **2** | Accessible Base Components | M1 | .foodjet-pill render, .foodjet-badge styling, .foodjet-card border, .foodjet-btn-primary focus state, .foodjet-input-group active state | Focus-visible keyboard ring, Disabled button states, Text truncation / word wrap, Screen reader aria-label, Zoom 200% layout integrity | Pill filter toggle + Badge status update | Tab-navigation through full catalog without mouse | `frontend/index.html`<br>`tests/unit/e2e_acceptance_tiers.test.mjs`<br>`npm run test:unit` |
| **3** | Responsive Navigation & Header | M2 | Brand logo display, Real address rendering, Neutral address fallback, Favorites counter badge, Reactive cart item badge | Empty address string, Truncated long address (>50 chars), Badge hidden when count=0, Max badge count 99+, Sticky header on scroll | Cart badge updates immediately upon addToCart | Header navigation across Home -> Checkout -> Orders | `frontend/features/carrito.feature`<br>`tests/unit/e2e_acceptance_tiers.test.mjs`<br>`npm test` |
| **4** | Home Hero Banner Carousel | M2 | Hero slide render, Banner headline "Poco presupuesto. Mucho sabor.", Slide indicators, Student CTA click action, Auto-advance interval | Pause on hover, Touch swipe on mobile, Single slide fallback, Missing promo image, Rapid navigation clicking | Banner CTA click filters catalog to student promo items | Landing on Home -> Clicking hero banner -> Adding promo item | `frontend/index.html`<br>`tests/unit/e2e_acceptance_tiers.test.mjs`<br>`npm run test:unit` |
| **5** | Integrated Catalog Search & Filters | M2 | Category filter match, Delivery time <= 30 min, Delivery time <= 60 min, Price range min-max, Clear all filters reset | Zero search results message, Inverted price range (min > max), Search with accents/diacritics, Special characters in query, Delivery time > 1h boundary | Category chip + Price filter + Search query combined | Search "Pizza" -> Filter <= 30 min -> Add first result | `frontend/features/filtros_productos.feature`<br>`tests/unit/e2e_acceptance_tiers.test.mjs`<br>`npm test` |
| **6** | Product Card Grid | M2 | Card price rendering, Image lazy loading, Available status tag, Favorite toggle icon, Functional "+" add button | Unavailable item disabled "+", Zero price boundary, Extreme long product name, Missing image placeholder, Consecutive rapid clicks | Favorite toggle state saved across catalog re-renders | Browsing category -> Toggling favorite -> Adding 2 units to cart | `frontend/features/descuentos.feature`<br>`frontend/features/carrito.feature`<br>`npm test` |
| **7** | Cart Offcanvas Experience | M2 | Drawer open/close, Single restaurant name display, Quantity increment, Quantity decrement, Total breakdown sum | Quantity reduced to 0 removes item, Empty cart state illustration, Mixed restaurant conflict rejection ("DIFFERENT_RESTAURANT"), Max quantity limit, Decimal rounding | Cart item count reflects accurately in header badge | Add 3 items -> Modify quantities in drawer -> Proceed to checkout | `frontend/features/carrito.feature`<br>`tests/unit/e2e_acceptance_tiers.test.mjs`<br>`npm test` |
| **8** | Favorites Offcanvas | M2 | Favorites drawer open, Display saved items list, Quick add-to-cart button, Remove item from favorites, Counter update | Empty favorites state, API failure handling (500), Unauthenticated user prompt, Duplicate favorite prevention, Out-of-stock favorite item | Adding favorite item to cart updates cart drawer | Save 2 items as favorite -> Open favorites -> Add to cart | `frontend/features/favoritos.feature`<br>`tests/unit/e2e_acceptance_tiers.test.mjs`<br>`npm test` |
| **9** | Checkout Two-Column Desktop Layout | M3 | Desktop 2-column grid (>=1280px), Sticky order summary, Single-column mobile (<768px), Delivery form position, Payment form position | Viewport resize from 1440px to 360px without scroll, Zero horizontal scrollbar, Sticky summary unstick at bottom, Long cart items scrolling | Layout adapts dynamically with open dropdowns/maps | Desktop checkout inspection -> Resize to mobile 390px | `frontend/index.html`<br>`tests/unit/e2e_acceptance_tiers.test.mjs`<br>`npm run test:unit` |
| **10** | Delivery Information & Map Fallback | M3 | Customer name entry, 9-digit phone validation, Saved address reuse, Map pin marking, Coordinate validation (lat/lng) | Map unavailable GPS/manual fallback, Missing pin rejection when map active, Phone with letters rejection, Phone < 9 or > 9 digits rejection, Coords outside valid range | Address text match with identical vs different pin coords | Select saved address -> Move pin to new door -> New address stored | `frontend/features/ubicacion_entrega.feature`<br>`frontend/features/validacion_telefono.feature`<br>`npm test` |
| **11** | Payment Method Selection | M3 | Cash method select, Card method select, Digital Wallet select, Radio toggle feedback, Dynamic form display | Switching methods clears validation errors, Unsupported payment method rejection, Card fields hidden on cash select, Wallet QR hidden on card select | Cash order initial state 'pendiente' vs Card 'confirmado' | Select card -> Switch to cash -> Confirm checkout | `frontend/features/pago_tarjeta.feature`<br>`backend/features/pago.feature`<br>`npm test` |
| **12** | Coupon Validation & Student Discount | M3 | Valid coupon `PruebaCupon` (10%), Valid coupon `FOODJET20` (20%), Student discount 20% applied, Discount line item display, Net subtotal calculation | Invalid coupon code rejection, Expired coupon rejection, Empty coupon input, Coupon with 0 discount, Cumulative discount capping | Student discount + Coupon percentage applied to subtotal | Student enters `PruebaCupon` -> Sees dual discount breakdown | `frontend/features/descuentos.feature`<br>`tests/unit/e2e_acceptance_tiers.test.mjs`<br>`npm test` |
| **13** | Order Tracking Live Map & ETA | M3 | Route line display, Real-time ETA minutes calculation, Distance formatting (meters/km), Destination pin, Store origin pin | Zero remaining distance ("Llegando"), Extreme route length, Missing route fallback to straight line, Route interpolation at 0% and 100%, OSRM timeout handling | Repartidor marker position updates as elapsed time grows | Order leaves store -> Follow route progress to house | `frontend/features/seguimiento_mapa.feature`<br>`backend/features/simulacion.feature`<br>`npm test` |
| **14** | "Actualizando en vivo" Live Connection | M3 | Live status pill display, Pulsing green connection dot, Polling interval execution (2s), Reconnection feedback on network drop, Terminal state polling stop | Network disconnection (offline), API 500 error during polling, Server timeout, Polling ceased on 'entregado', Polling ceased on 'cancelado' | Status change during polling triggers timeline animation | Connection lost simulation -> Reconnected -> Status advances | `frontend/features/seguimiento.feature`<br>`tests/unit/e2e_acceptance_tiers.test.mjs`<br>`npm test` |
| **15** | Tracking Timeline & Stages | M3 | Stage 1 (Confirmación), Stage 2 (Preparación), Stage 3 (En camino), Stage 4 (Entregado), Real timestamps for past stages | Future stages show estimated time, Simulation delay recalculates future steps, Pre-simulation legacy orders show no invented times, Cancelled order halts all steps | Order transition from 'confirmado' to 'en_preparacion' | Order lifecycle from checkout to completion | `frontend/features/seguimiento.feature`<br>`backend/features/estado_pedido.feature`<br>`npm test` |
| **16** | Authentication & Registration Modals | M4 | Modal display & dismiss, Email/password login, 9-digit phone registration, Password visibility toggle, Role navigation redirect | Invalid credentials error alert, Missing fields validation, Duplicate email registration error, Malformed email format rejection, Expired token logout | Login state immediately updates navbar user menu | Guest registers with valid phone -> Session token stored | `frontend/features/sesion.feature`<br>`backend/features/registro_backend.feature`<br>`npm test` |
| **17** | My Account & Student Verification | M4 | Profile data view, Student verification form, Student ID card upload trigger, Verification pending status, Verified badge display | Non-image file upload rejection, Expired student ID rejection, Token expired during upload, Re-submitting while verification pending, Unverified user status | Verified student gains immediate 20% catalog discount | User uploads ID card -> Status updates -> Discount active | `frontend/features/sesion.feature`<br>`frontend/features/descuentos.feature`<br>`npm test` |
| **18** | Digital Wallet & Bank Auth Modals | M4 | Wallet QR code render, QR countdown timer, Restaurant name on QR, Bank card authentication modal, Cancel QR button | Restaurant without QR aborts payment, QR timer expiration, User cancels QR payment returning to checkout, Bank card auth failure simulation, Bank card 3DS challenge | Digital wallet payment creates order with status 'pendiente' | Select wallet -> Scan QR -> Confirm payment -> Order tracked | `frontend/features/billetera.feature`<br>`tests/unit/e2e_acceptance_tiers.test.mjs`<br>`npm test` |
| **19** | Order History View & Review Modal | M4 | Order history cards list, Order detail modal view, Re-order button, Star rating selector (1-5), Review comment submission | Empty history illustration, Review without star rating rejection, Review already submitted disabled, Very long review text (>500 chars), History pagination | Completing order enables review button in history | Order delivered -> Customer opens history -> Leaves 5 stars | `frontend/index.html`<br>`tests/unit/e2e_acceptance_tiers.test.mjs`<br>`npm run test:unit` |
| **20** | Admin Operations Panel | M4 | Operations table view, Status filter tabs, Refresh button polling, Order advance button, Order cancel button | Non-admin user access denied (403), Empty operations table state, Advance order in terminal state disabled, Simultaneous status updates, Cancellation reason required | Admin advances order -> Customer tracking view updates | Admin logs in -> Advances order from cocina to reparto | `frontend/js/legacy.js`<br>`backend/features/estado_pedido.feature`<br>`npm test` |
| **21** | Responsive Viewports & A11y Audit | M-Final | Viewport 360px audit, 390px audit, 768px audit, 1280px audit, 1440px audit | Zoom 200% without horizontal scroll, Color contrast ratio >= 4.5:1 on text, Tap target >= 44x44px on mobile, Focus outline visible on Tab key, Reduced motion honors prefers-reduced-motion | Screen resizing maintains intact sticky checkout summary | Full site inspection across mobile, tablet, and desktop | Chrome DevTools MCP<br>`tests/unit/e2e_acceptance_tiers.test.mjs`<br>`npm run test:unit` |
| **22** | 100% E2E Acceptance Pass | M-Final | Full frontend Cucumber suite execution, Full backend Cucumber suite execution, Full unit test execution, Zero regressions baseline | Flaky test elimination, Independent test isolation (hooks clearCart/state), Cross-browser environment consistency, Rapid sequential execution | All suites green concurrently in CI pipeline | `npm test && npm run test:unit` |
| **23** | Adversarial Coverage Hardening | M-Final | Special characters in names/addresses, Luhn-valid fake cards, Expired session recovery, Map service timeout, Concurrent tabs state sync | SQL injection escaping in inputs, XSS prevention in comments/addresses, Rapid duplicate checkout submissions, Zero-price product exploits, Corrupted JWT payload parsing | Malformed JWT does not crash app; prompts clean login | `tests/unit/e2e_acceptance_tiers.test.mjs`<br>`frontend/features/sesion.feature`<br>`npm test` |

---

## 5. Authoritative Expected Output Derivation & Oracles

Every expected value within the acceptance suites is derived from authoritative specifications:
1. **Peruvian Phone Validation**: `authController.js` and `userValidation.js` require `^\d{9}$`. All inputs with non-digits or length != 9 must be rejected.
2. **Card Validation & Luhn Algorithm**: Mathematical Luhn mod 10 check for 16-digit Visa/Mastercard and 15-digit Amex. Expiration format `MM/YY` with calendar-month grace period ending at the first millisecond of the following month.
3. **Student Discount Calculation**: Exact formula `precio_final = precio - (precio * (descuento / 100))`. Output formatted as Peruvian Soles currency string `S/ XX.XX` with `.text-success`.
4. **Order Status Normalization**: Lowercase canonical representation without accents or spaces (e.g. `'En preparación'` -> `'en_preparacion'`).
5. **Coupons Oracle**: Backend database seed (`backend/prisma/seed.js`):
   - `PruebaCupon`: 10.0% discount, max amount 20.0, expires 2027-12-31, status 'Activo'.
   - `FOODJET20`: 20.0% discount, status 'Activo'.
   - Any other coupon code: Rejected with invalid error message.
6. **Subtotal Derivation**: `Math.max(0, total - impuestos - envio)`.
7. **Distance & ETA Oracles**:
   - `< 1000m`: Formatted as rounded 10s meters (`"850 m"`).
   - `>= 1000m`: Formatted as 1-decimal km (`"6,4 km"`).
   - `segundos <= 30`: `"Llegando"`.
   - `segundos > 30`: Rounded to minutes (`"2 min"`, `"1 h 15 min"`).

---

## 6. Execution & Verification Guide

### Pre-requisites
- Node.js >= 20.x installed.
- NPM dependencies installed (`npm ci`).
- Backend database and API (Docker Compose `docker compose up -d`) when executing end-to-end network flows against `http://localhost:8081`.

### Verification Steps
```bash
# 1. Run Unit Tests & 4-Tier Domain Acceptance Suites
npm run test:unit

# 2. Run Frontend BDD Acceptance Features
npm run test:frontend

# 3. Run Backend BDD Acceptance Features
npm run test:backend

# 4. Run Full Master Acceptance Suite
npm test
```

### Readiness Criteria for `TEST_READY.md`
- Test infrastructure documented and mapped for all 23 features.
- Tier 1 and Tier 2 isolated feature and boundary test suites implemented and verified green.
- Existing 121 baseline Cucumber scenarios + 25 baseline unit tests pass with zero failures and zero regressions.
- HTML report generated at `reports/cucumber.html`.
