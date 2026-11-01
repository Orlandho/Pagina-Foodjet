# Project: FoodJet Web Frontend UI Redesign & Modernization

## Architecture
- **Tech Stack**: HTML5, CSS3, Bootstrap 5.3.0, Vanilla JavaScript with native ES Modules (`type="module"`).
- **Backend & Contracts**: PostgreSQL + Express + Prisma on same-origin relative `/api/*` endpoints. Zero backend modifications.
- **Client State & Domain**: Pure headless domain logic in `frontend/js/domain/` (`catalog.js`, `checkout.js`, `orderStatus.js`, `payment.js`, `seguimiento.js`, `session.js`, `ubicacion.js`, `validation.js`).
- **Global Bridges**: `window.FoodJetSession`, `window.FoodJetMapas`, `window.FoodJetValidation`, `window.app`, `window.state`, `window.ui`.
- **Styling Architecture**: Central CSS token system (`frontend/styles.css`) utilizing CSS variables for theme colors, typography scales, border radii, shadows, and spacing.
- **Layout Model**: Responsive hybrid grid — Multi-column layout on desktop (>= 1280px) and single-column layout on mobile (360px / 390px) with strict zero horizontal scroll.

## Code Layout
- `frontend/index.html` — Single Page Application containing all view sections and modals (165 preserved DOM IDs).
- `frontend/styles.css` — CSS design tokens, global resets, view containers, cards, and responsive media queries.
- `frontend/js/config.js` — Global configuration (`window.FOODJET_API_URL = '/api'`).
- `frontend/js/legacy.js` — Auth handling, admin panel polling, toast alerts.
- `frontend/js/app.js` — Main ESM entry point and global bridge bindings.
- `frontend/js/api.js` — HTTP client wrappers for backend REST endpoints.
- `frontend/js/state.js` — Reactive UI state store.
- `frontend/js/ui.js` — DOM rendering engine for products, cart, checkout, tracking, and modals.
- `frontend/js/domain/` — Headless business rules and calculations (100% test coverage).
- `tests/` — Cucumber feature suites and unit test runner (`reports/cucumber.html`).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | CSS Design Tokens System | Comprehensive CSS custom properties for palette, typography, radii, elevation, spacing, WCAG AA compliance | M1 | Survey / R3 [DONE] |
| 2 | Accessible Base Components | Reusable styling for pills, badges, buttons, inputs, cards, focus indicators, and reduced-motion rules | M1 | Survey / R3 [DONE] |
| 3 | Responsive Navigation & Header | FOODJET brand logo, real/neutral address display, favorites badge, reactive cart badge counter, user menu | M2 | Survey / R1, R4 [DONE] |
| 4 | Home Hero Banner Carousel | "Poco presupuesto. Mucho sabor." banner with student promo CTA, indicators, and Compose styling | M2 | Survey / R1 [DONE] |
| 5 | Integrated Catalog Search & Filters | Search bar combined with category pill chips, price range, zero results, loading, error, and retry states | M2 | Survey / R1, R4 [DONE] |
| 6 | Product Card Grid | Cards with student discount badge, image, availability tag, favorite toggle, and functional "+" add button | M2 | Survey / R1, R4 [DONE] |
| 7 | Cart Offcanvas Experience | Restyled cart drawer with restaurant badge, single-restaurant rule alert, quantity controls, totals breakdown | M2 | Survey / R1, R4 [DONE] |
| 8 | Favorites Offcanvas | Restyled favorites drawer with quick add-to-cart, remove favorite, and empty state | M2 | Survey / R1, R4 [DONE] |
| 9 | Checkout Two-Column Desktop Layout | Multi-column desktop layout (left: delivery/payment, right: sticky order summary) and single-column mobile | M3 | Survey / R1 [DONE] |
| 10 | Delivery Information & Map Fallback | Customer name, phone validation, address with GPS dataset, interactive delivery map with manual/GPS fallback | M3 | Survey / R1, R4 [DONE] |
| 11 | Payment Method Selection | Cash, Card (with client validation for number, expiry, cvc), and Digital Wallet options | M3 | Survey / R1, R4 [DONE] |
| 12 | Coupon Validation & Student Discount | Valid coupons (`PruebaCupon`, `FOODJET20`), invalid rejection, student discount line item, financial summary | M3 | Survey / R4 [DONE] |
| 13 | Order Tracking Live Map & ETA | Interactive route map, prominent ETA counter ("12 min"), route summary text | M3 | Survey / R1, R4 [DONE] |
| 14 | "Actualizando en vivo" Live Connection | Live status pill with pulsing green indicator, network error detection, and reconnecting feedback | M3 | Survey / R4 [DONE] |
| 15 | Tracking Timeline & Stages | 4-step timeline distinguishing completed events from future estimations, cancel order when permitted | M3 | Survey / R1, R4 [DONE] |
| 16 | Authentication & Registration Modals | Redesigned `loginModal` and `registerModal` with inline validation and role-aware navigation | M4 | Survey / R1 |
| 17 | My Account & Student Verification | Redesigned `miCuentaModal` with student ID upload, status banner, and discount eligibility | M4 | Survey / R1 |
| 18 | Digital Wallet & Bank Auth Modals | `qrModal` with cancellation support and timer; `cardAuthModal` bank simulation | M4 | Survey / R1, R4 |
| 19 | Order History View & Review Modal | `orderHistoryView` card list, order details, and interactive star rating `reviewModal` | M4 | Survey / R1 |
| 20 | Admin Operations Panel | `dashboardView` restyled table, status filter tabs, refresh button, order advance and cancellation | M4 | Survey / R1 |
| 21 | Responsive Viewports & A11y Audit | Verification across 360px, 390px, 768px, 1280px, 1440px; 200% zoom; no horizontal overflow | M-Final | Survey / R1, R5 |
| 22 | 100% E2E Acceptance Pass | Full execution of existing Cucumber features (131 scenarios) + unit tests (93 tests) with zero regressions | M-Final | Survey / R5 |
| 23 | Adversarial Coverage Hardening | White-box stress testing of edge cases (invalid coupons, session expiry, missing maps, QR cancellation) | M-Final | Survey / R5 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M-Survey | Visual Survey & Spec Mining | Inspect Figma desktop frames vs current code across R1, R2, R3, R4, R5 | None | DONE |
| M-Home | R1. Home & Header Figma Recomposition | 2-line address selector, central search, textual cart button "Mi carrito · N", title before banner, compact 2-halves promo banner, remove/relocate 4-benefits strip, compact 2-row filters + popover, full-width catalog (no clipped student badges) | M-Survey | DONE |
| M-Cart-Checkout | R2. Cart & R3. Checkout Figma Recomposition | Cart offcanvas density/subtotal vs total; 2-column checkout (~65/35), compact saved address card with "Editar" button, in-place QR digital wallet, exact financial reconciliation | M-Survey | IN_PROGRESS |
| M-Tracking | R4. Tracking & R5. Themes/A11y Recomposition | Asymmetric 2-column tracking (contained map + order summary underneath on left; status card + ETA + 4-stage timeline + callout on right), dark mode contrast fix, timeline wrapping fix | M-Survey | PLANNED |
| M-Final | Visual Verification, Viewports & 100% E2E Pass | 1440px/1280px/390px screenshots, discrepancy matrix resolution, 131/131 acceptance scenarios, 100% unit tests | M-Home, M-Cart-Checkout, M-Tracking | PLANNED |
| E2E-Track | E2E Testing Suite Track | Requirement-driven test infrastructure & scenario suite (Tiers 1-4) publishing TEST_READY.md | None | DONE |

---

## Interface Contracts

### M1 (Design Tokens) ↔ Consumers (M2, M3, M4)
- **Token Namespace**: `--color-*`, `--font-*`, `--radius-*`, `--shadow-*`, `--spacing-*`.
- **CSS Selectors Available**:
  - `.foodjet-pill`, `.foodjet-pill--active`
  - `.foodjet-badge`, `.foodjet-badge--student`, `.foodjet-badge--yellow`, `.foodjet-badge--live`
  - `.foodjet-card`, `.foodjet-card--interactive`, `.foodjet-card--selected`
  - `.foodjet-btn-primary`, `.foodjet-btn-secondary`, `.foodjet-btn-cta`, `.foodjet-btn-circle`
  - `.foodjet-section-header`
  - `.foodjet-input`, `.foodjet-input-group`

### M2 (Home & Catalog) ↔ M3 (Checkout)
- **State Interface**: `state.cart` array of items `{ id, nombre, precio, imagen, cantidad, restauranteId, esEstudiante }`.
- **DOM Container**: `#cartOffcanvas`, `#cartBtn`, `#cartCount`, `#checkoutBtn`.
- **Navigation Hook**: `ui.handleCheckoutNavigation()` updates `#checkoutView` and triggers address/cart summary population.

### M3 (Checkout) ↔ M3 (Tracking)
- **Payload Contract**: `domain.buildOrderPayload()` creates order with `{ cliente, telefono, direccion, latitud, longitud, metodoPago, cupon, items }`.
- **Transition Hook**: Successful checkout calls `ui.navigateToTracking(orderId)`.
- **Tracking State**: Polling `/api/orders/:id` every 2s, updating `#step1` through `#step4`, `#etaValue`, `#statusTitle`.

### M4 (Modals/Admin) ↔ All Modules
- **Session Bridge**: `window.FoodJetSession` exposes `isTokenExpired`, `isAuthFailure`, updating navbar and modal visibility.
- **Operations Panel**: Accessible only for `rol === 'admin'` via `#dashboardBtn`, invoking `displayDashboard()`.
