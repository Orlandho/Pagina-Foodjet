# Handoff Report: Explorer M3-1 (Checkout Layout, Delivery Address & Map Fallback)

**Agent**: Explorer M3-1 (`teamwork_explorer`)  
**Working Directory**: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m3_1\`  
**Target Milestone**: Milestone 3 — Checkout & Order Tracking Critical Flow  
**Date**: 2026-10-30  
**Handoff Type**: Hard (Investigation complete and verified)

---

## 1. Observation

1. **Existing `#checkoutView` in `frontend/index.html` (lines 407–587)**:
   - Contains a two-column Bootstrap layout: `<div class="col-lg-7">` (lines 416–542) for delivery and payment, and `<div class="col-lg-5">` (lines 544–583) for the order summary.
   - Preserves standard input IDs:
     - Delivery: `#customerName` (line 424), `#customerPhone` (line 430), `#customerPhoneError` (line 434), `#customerAddress` (line 441), `#deliveryAddressSearch` (line 444), `#deliveryMapWrapper` (line 450), `#deliveryMap` (line 451), `#deliveryMapLocate` (line 456), `#deliveryMapStatus` (line 461), `#customerReference` (line 465).
     - Payment: `#payCash` (line 475), `#payCard` (line 486), `#payWallet` (line 497), `#cardDetails` (line 507), `#cardNumber` (line 511), `#cardNumberError` (line 515), `#cardExpiry` (line 520), `#cardExpiryError` (line 524), `#cardCvc` (line 528), `#cardCvcError` (line 532).
     - Summary & Coupon: `#checkoutItems` (line 548), `#couponCode` (line 553), `#applyCouponBtn` (line 554), `#couponMessage` (line 556), `#checkoutSubtotal` (line 561), `#checkoutDiscountRow` (line 563), `#checkoutDiscount` (line 565), `#checkoutTaxes` (line 569), `#checkoutDelivery` (line 573), `#checkoutTotal` (line 578).
2. **Current JavaScript Behavior (`frontend/js/ui.js` lines 895–991, `frontend/js/app.js` lines 240–337)**:
   - `renderCheckoutCart()` in `ui.js` supports both `#checkoutCartItems` and `#checkoutItems`, `#checkoutTax` and `#checkoutTaxes`, `#checkoutDeliveryFee` and `#checkoutDelivery`.
   - `fillCheckoutUserData()` populates `#customerName` and `#customerPhone` from `window.currentUser`.
   - `resolveDeliveryAddressId()` validates address input, checks `faltaMarcarUbicacion()`, queries `api.fetchMyAddressesAPI()`, and reuses or creates the address in PostgreSQL.
3. **Coupon Code Handling**:
   - In `frontend/index.html`, `#couponCode`, `#applyCouponBtn`, and `#couponMessage` exist in the DOM (lines 553–556).
   - In `frontend/js/state.js`, `state.setActiveCoupon()` and `state.getActiveCoupon()` are defined (lines 87–95).
   - In `CheckoutScreen.kt` (lines 70–73, 685–695), cupones are defined as `mapOf("pruebacupon" to Triple(1, 0.10, "PruebaCupon"), "foodjet20" to Triple(2, 0.20, "FOODJET20"))`.
   - Currently, `#applyCouponBtn` is not wired to an event listener in `frontend/js/app.js`.
4. **Google Maps Multi-Tier Cascading & Fallback (`frontend/js/googleMaps.js` & `mapaEntrega.js`)**:
   - `googleMaps.js` implements cascading loader across primary and secondary keys (`GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_API_KEY_SECUNDARIA`).
   - `limpiarResiduosGoogleMaps()` (lines 79–94) purges `<script data-foodjet-maps="true">` tags and `window.google` on failure (Rule R7 compliance).
   - A 100ms observation window (line 142) intercepts `window.gm_authFailure` before resolving.
   - If keys are rejected or missing, `retirarMapa()` hides `#deliveryMapWrapper` and `#deliveryAddressSearch`, and `alFallar: () => ui.requestUserLocation()` falls back to native browser GPS + Nominatim OpenStreetMap.
   - `faltaMarcarUbicacion({ mapaDisponible: false, coords: null })` returns `false`, preventing order submission blockages when maps are unavailable.
5. **Baseline Test Results**:
   - `npm run test:unit`: 25/25 passed across backend and frontend domains.
   - `node --test tests/unit/e2e_acceptance_tiers.test.mjs`: 68/68 passed across all 4 tiers.
   - `npm test`: 131/131 passed (86 frontend scenarios, 45 backend scenarios).

---

## 2. Logic Chain

1. **Premise 1**: Requirement R1 and Milestone 3 mandate a responsive redesign of `#checkoutView` featuring a two-column desktop layout (>= 1280px / 992px) with sticky order summary and a single-column layout on mobile (< 576px / 360px / 390px) without horizontal overflow or keyboard obstruction.
2. **Premise 2**: Prototype `CheckoutScreen.kt` organizes checkout into 3 clear cards: "¿Dónde lo llevamos?" (delivery info & map), "¿Cómo quieres pagar?" (payment tiles & card drawer), and "Tu pedido" (item summary, coupon, financial totals).
3. **Premise 3**: In existing `frontend/index.html`, all required DOM element IDs already exist, but styling relies on generic Bootstrap `.card` without FoodJet CSS tokens, and the sticky summary does not disable on small screens.
4. **Premise 4**: Automated tests (Cucumber + Tier acceptance tests) expect all 33 preserved DOM IDs and event listeners to continue functioning without regressions.
5. **Premise 5**: Rule R7 requires explicit script cleanup, 100–150ms observation window, and elegant degradation to manual address / browser GPS when Google Maps keys fail.
6. **Inference**: By updating `#checkoutView` in `frontend/index.html` to adopt the modernized semantic HTML structure, styling cards with `.foodjet-card`, `.foodjet-section-header`, and `.foodjet-payment-tile` in `frontend/styles.css`, disabling sticky positioning on screens `< 992px`, wiring `#applyCouponBtn` in `frontend/js/app.js`, and preserving all 33 DOM IDs, the Worker agent can complete Feature 9 & 10 with 100% test compatibility and zero regressions.

---

## 3. Caveats

- **No Backend Modifications**: The backend does not expose a `/api/cupones` lookup endpoint; coupon validation is validated on client submission and enforced by Prisma backend on order registration. The client translation mapping (`PruebaCupon` = 10%, `FOODJET20` = 20%) matches both `CheckoutScreen.kt` and `backend/prisma/seed.js`.
- **Address Storage**: We must never insert mock or hardcoded addresses (such as "Av. Universitaria 1234"). Addresses must either come from `window.currentUser` saved addresses, the browser GPS read, or user input.
- **Google Maps Key Environment**: If neither `GOOGLE_MAPS_API_KEY` nor `GOOGLE_MAPS_API_KEY_SECUNDARIA` is supplied in `.env`, the system must smoothly degrade without errors to text address input and browser GPS.

---

## 4. Conclusion

The technical exploration for Checkout View (`#checkoutView`), Delivery Information, and Map Cascading/Fallback is complete:
1. Complete responsive layout specification prepared: 2-column desktop (>= 1280px / >= 992px) with `position: sticky; top: 96px`, and 1-column mobile (< 992px) with `position: static` and zero horizontal overflow.
2. Real address handling with saved address chips (`#savedAddressesList`) and neutral fallbacks specified.
3. Interactive map cascading and Rule R7 compliance verified and documented.
4. Complete matrix of 33 preserved DOM IDs and event listeners established.
5. Actionable HTML and CSS blueprints written in `report.md`.

The Worker agent has an unambiguous, self-contained guide to execute the implementation.

---

## 5. Verification Method

To independently verify the findings and any future implementation:

1. **Verify Unit Tests & Google Maps Cascading**:
   ```bash
   npm run test:unit
   ```
   *Expected outcome*: 25 tests pass in 6 suites, confirming domain logic and cascading key handling.
2. **Verify E2E Acceptance Tiers**:
   ```bash
   node --test tests/unit/e2e_acceptance_tiers.test.mjs
   ```
   *Expected outcome*: 68 tests pass across Tiers 1–4, covering telephone sanitization, card validation, delivery location, cart, and offline map fallback.
3. **Verify Cucumber E2E Feature Suites**:
   ```bash
   npm test
   ```
   *Expected outcome*: 86 frontend scenarios and 45 backend scenarios pass (131 total).
4. **Inspect Preserved DOM IDs in `frontend/index.html`**:
   Verify that all 33 DOM IDs listed in Section 8 of `report.md` exist and are accessible via `document.getElementById()`.
5. **Inspect Responsive Viewports**:
   Check `#checkoutView` at widths 360px, 390px, 768px, 1280px, and 1440px to verify that `.checkout-summary-sticky` has `position: static` on mobile and `position: sticky` on desktop.
