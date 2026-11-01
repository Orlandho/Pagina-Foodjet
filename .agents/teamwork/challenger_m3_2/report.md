# Milestone 3 Empirical Challenge Report (Challenger M3-2)

**Author**: Challenger M3-2 (Adversarial Critic & Specialist)  
**Target Milestone**: Milestone 3 — Checkout & Order Tracking Critical Flow  
**Target Worker**: Worker M3 (`.agents/teamwork/worker_m3/`)  
**Parent Orchestrator**: `20c340e3-fa46-461e-a7ae-9dd6bbd67479`  
**Execution Timestamp**: 2026-10-30T23:59:00Z  
**Verdict**: **APPROVE**

---

## 1. Challenge Summary

- **Overall Risk Assessment**: **LOW**
- **Empirical Test Script Written & Executed**: `tests/unit/challenger_m3_2_empirical.test.mjs`
- **Empirical Test Results**: **26/26 passed (6 suites, 0 failures, 112ms)**
- **Regression Suite Verification**:
  - `npm run test:unit`: 25/25 passed
  - `node tests/unit/e2e_acceptance_tiers.test.mjs`: 68/68 passed
  - `node tests/unit/challenger_m3_1_empirical.test.mjs`: 30/30 passed
  - `node tests/unit/challenger_m2_2_empirical.test.mjs`: 20/20 passed
  - `node tests/empirical_m2_1_audit.mjs`: 100% passed
  - `npm run test:frontend`: 86/86 scenarios passed (327 steps)
  - `npm test`: 131/131 scenarios passed (477 steps)
- **Backend Purity**: `git status backend/ prisma/ docker-compose.yml Caddyfile` shows zero modifications.

---

## 2. Adversarial Challenges & Empirical Verifications

### Challenge 1: Double-Click Race Condition on Order Confirmation (`#confirmOrderBtn`)
- **Assumption Challenged**: An impatient user double-clicking or rapid-clicking `#confirmOrderBtn` during checkout could dispatch multiple duplicate order payloads to the backend before the first network request completes.
- **Attack Scenario**: Simulated a rapid burst of 10 concurrent clicks within 5ms during an asynchronous 20ms simulated backend delay.
- **Empirical Findings**:
  - The in-flight concurrency lock `isSubmittingOrder` in `frontend/js/app.js:246–290` is set to `true` synchronously before the first `await`.
  - Concurrently, `confirmBtn.disabled = true`, `confirmBtn.classList.add('is-loading')`, `spinner.classList.remove('d-none')`, and text switches to `'Registrando pedido...'`.
  - All 9 subsequent clicks in the burst immediately evaluate `if (isSubmittingOrder) return;` and are aborted with zero payload emission.
  - **Empirical Call Count**: Exactly 1 call to `createOrderAPI` (`apiCallCount === 1`).
  - Tested validation failures (missing address, invalid card) and backend 500 exceptions: `finally { setOrderSubmittingState(false); }` cleanly re-enables the button without permanent UI lockup.
- **Status**: **PASS (Robust)**

### Challenge 2: Tracking Live Indicator State Escalation & Recovery
- **Assumption Challenged**: Network interruptions or transient API polling drops could either fail silently, freeze the UI, or fail to recover when connectivity returns.
- **Attack Scenario**: Simulated the 4-phase polling lifecycle in `frontend/js/ui.js:1572–1740`:
  1. Connected: `resultado.ok === true`
  2. Transient glitch: 1 failure (`trackingFallos = 1`)
  3. Intermediate retries: 2–4 failures (`trackingFallos = 2..4`)
  4. Exhaustion: 5 failures (`trackingFallos >= MAX_FALLOS = 5`)
  5. Recovery: subsequent successful poll
- **Empirical Findings**:
  - Phase 1 (Live): Element `#liveIndicator` carries `.foodjet-badge--live`, green dot `#28A745`, keyframe `foodjet-pulse-live`, and text `"Actualizando en vivo"`.
  - Phase 2 (Reconnecting): Transitions to `.foodjet-badge--reconnecting`, amber dot `#D97706`, `#FFFBEB` background, keyframe `foodjet-pulse-amber`, and text `"Reconectando…"`. Notice `#trackingConnection` displays `"Sin conexión con el servidor, reintentando…"`.
  - Phase 4 (Disconnected): Transitions to `.foodjet-badge--disconnected`, red dot `#DC2626`, `#FEF2F2` background, keyframe `none`, and text `"Sin conexión"`. Notice shows `"No se pudo actualizar el estado del pedido."` and polling is halted (`stopOrderTracking()`).
  - Phase 5 (Recovery): Upon successful response, `trackingFallos` resets to 0, indicator returns to `.foodjet-badge--live`, and diagnostic notice clears.
- **Status**: **PASS (Robust)**

### Challenge 3: 4-Step Timeline Timestamp Discrimination & "Ahora" Badge
- **Assumption Challenged**: Future stages might falsely present precise arrival times as if they were real historical events, or completed events might carry "aprox." prefixes, deceiving the customer.
- **Attack Scenario**: Tested timeline generation across realistic orders with explicit history entries and time plan configurations (`plan_tiempos`).
- **Empirical Findings**:
  - **Stage Order**: Strict canonical sequence verified: Confirmación (`confirmado`), Preparación (`en_preparacion`), En camino (`en_camino`), Entregado (`entregado`).
  - **Completed Stages (`hecha`)**: Rendered with green checkmark `bi-check-lg`, real timestamps from `pedido.historial`, semantic `<time datetime="...">` tags, and strictly NO `"aprox."` prefix.
  - **Active Stage (`en_curso`)**: Designated with `aria-current="step"`. CSS selector `.linea-tiempo__etapa[data-situacion="en_curso"] .linea-tiempo__ahora-badge` enforces `display: inline-flex` for the peach/dark-orange "Ahora" badge.
  - **Future Stages (`pendiente`)**: Timestamps projected from `plan_tiempos` are strictly prefixed with `"aprox. "`.
  - **Delivered State (`entregado`)**: All 4 stages are `hecha`, all display checkmarks, all carry real timestamps, and zero "aprox." or "Ahora" badges are shown.
  - **Cancelled State (`cancelado`)**: Terminal cancellation properly disables future projections and switches headline to `'Pedido cancelado'`.
- **Status**: **PASS (Robust)**

### Challenge 4: Customer Order Cancellation Scope & Action Protocol
- **Assumption Challenged**: `#cancelOrderBtn` could be mistakenly visible in uncancelable stages (e.g. while food is being cooked or delivered), or could fire unconfirmed cancellations.
- **Attack Scenario**: Tested visibility across all 6 canonical states (`pendiente`, `confirmado`, `en_preparacion`, `en_camino`, `entregado`, `cancelado`), and simulated click handling with user confirmation prompt.
- **Empirical Findings**:
  - `pendiente`: `cancelBtn.style.display === 'inline-flex'` (VISIBLE)
  - `confirmado`: `cancelBtn.style.display === 'inline-flex'` (VISIBLE)
  - `en_preparacion`: `cancelBtn.style.display === 'none'` (HIDDEN)
  - `en_camino`: `cancelBtn.style.display === 'none'` (HIDDEN)
  - `entregado`: `cancelBtn.style.display === 'none'` (HIDDEN)
  - `cancelado`: `cancelBtn.style.display === 'none'` (HIDDEN)
  - `dataset.orderId` accurately carries the order ID.
  - Clicking `#cancelOrderBtn` triggers `window.confirm`. If cancelled by user, zero network requests occur. If confirmed, button is disabled during in-flight dispatch of `PUT /api/orders/:id/cancel` and tracking polls reactively upon response.
- **Status**: **PASS (Robust)**

### Challenge 5: Mobile Viewport Containment & Zero Horizontal Overflow
- **Assumption Challenged**: Two-column desktop checkout or sticky summary elements could cause horizontal scrollbars or obstruct fields/keyboards on narrow mobile viewports (360px and 390px).
- **Attack Scenario**: Audited media queries, element styling, and grid rules in `frontend/styles.css` and `frontend/index.html`.
- **Empirical Findings**:
  - **Sticky to Static Switch**:
    - Desktop (`@media (min-width: 992px)`): `.checkout-summary-sticky` has `position: sticky !important; top: 96px !important;`.
    - Mobile (`@media (max-width: 991.98px)`): `.checkout-summary-sticky` has `position: static !important; top: auto !important;`, preventing floating overlays that obscure inputs on mobile.
  - **Payment Options Grid**:
    - Desktop: `grid-template-columns: repeat(3, 1fr)`.
    - Mobile (`@media (max-width: 575.98px)`): Collapses to `grid-template-columns: 1fr`, avoiding horizontal squishing on 360px devices.
  - **Delivery Map**:
    - Base: `height: 280px; overflow: hidden`.
    - Mobile (`@media (max-width: 575.98px)`): Height constrained to `240px`.
  - **Static Width Audit**: Zero property declarations with fixed `width` or `min-width` > 360px exist in `#checkoutView` or `#trackingView`.
  - **Touch Accessibility**: `#confirmOrderBtn` (`py-3`) and `#cancelOrderBtn` satisfy the >= 44px tap target recommendation.
- **Status**: **PASS (Robust)**

---

## 3. Stress Test Results Matrix

| Scenario ID | Test Case | Target Component | Expected Behavior | Actual Empirical Result | Status |
|---|---|---|---|---|---|
| TC-M3-2-01 | Rapid click burst (10 clicks) | `#confirmOrderBtn` | Exactly 1 API call dispatched, button disabled in-flight | Exactly 1 API call, lock held, 9 clicks swallowed | PASS |
| TC-M3-2-02 | Validation failure recovery | Checkout Form | Re-enable button and clear lock if address unpinned | Button enabled, lock cleared, error toast shown | PASS |
| TC-M3-2-03 | Network 500 error recovery | `#confirmOrderBtn` | Re-enable button in `finally` block | Lock cleared, button interactive | PASS |
| TC-M3-2-04 | Wallet method button label | `#confirmOrderText` | Displays "Pagar con QR" when method is wallet | Text switches to "Pagar con QR" | PASS |
| TC-M3-2-05 | Live indicator active state | `#liveIndicator` | `.foodjet-badge--live`, green dot, pulse animation | Green dot `#28A745`, keyframe `foodjet-pulse-live` | PASS |
| TC-M3-2-06 | Polling failure 1 state | `#liveIndicator` | `.foodjet-badge--reconnecting`, amber dot, "Reconectando…" | Amber dot `#D97706`, text "Reconectando…" | PASS |
| TC-M3-2-07 | Polling failure 5 state | `#liveIndicator` | `.foodjet-badge--disconnected`, red dot, polling stopped | Red dot `#DC2626`, animation none, polling halted | PASS |
| TC-M3-2-08 | Transient failure recovery | `#liveIndicator` | Return to `.foodjet-badge--live` on subsequent success | Restored to `.foodjet-badge--live`, notice cleared | PASS |
| TC-M3-2-09 | 4-step canonical sequence | `ETAPAS_SEGUIMIENTO` | Confirmación, Preparación, En camino, Entregado | 4 stages in exact sequence | PASS |
| TC-M3-2-10 | Historical timestamp accuracy | Timeline Steps | Completed stages have real timestamp, no "aprox." | Checkmark `bi-check-lg`, real timestamp, no aprox | PASS |
| TC-M3-2-11 | Active stage indicator | Timeline Steps | Active stage has `aria-current="step"` and Ahora badge | `aria-current="step"`, `.linea-tiempo__ahora-badge` | PASS |
| TC-M3-2-12 | Estimated stage prefix | Timeline Steps | Future stages have `"aprox. "` timestamp | Formatted with `"aprox. "` and valid ISO datetime | PASS |
| TC-M3-2-13 | Terminal delivered state | Timeline Steps | All 4 steps `hecha`, all checkmarks, zero "aprox." | 4 steps completed, 0 aprox, 0 Ahora | PASS |
| TC-M3-2-14 | Cancellation button visibility | `#cancelOrderBtn` | Visible only on `pendiente` & `confirmado` | `inline-flex` for 2 states, `none` for 4 states | PASS |
| TC-M3-2-15 | Cancellation click flow | `#cancelOrderBtn` | `confirm()` prompt, disabled during PUT, UI refresh | Prompted, disabled in-flight, status refreshed | PASS |
| TC-M3-2-16 | Aborted cancellation | `#cancelOrderBtn` | If `confirm()` rejected, no API call | Zero API calls, button enabled | PASS |
| TC-M3-2-17 | Desktop sticky summary | `.checkout-summary-sticky` | `position: sticky` on >= 992px | `position: sticky !important; top: 96px !important;` | PASS |
| TC-M3-2-18 | Mobile static summary | `.checkout-summary-sticky` | `position: static` on < 992px | `position: static !important; top: auto !important;` | PASS |
| TC-M3-2-19 | Payment grid mobile collapse | `.payment-options-grid` | 1 column on < 576px | `grid-template-columns: 1fr` | PASS |
| TC-M3-2-20 | Delivery map mobile height | `.mapa-entrega` | 240px height on < 576px | Height 240px with `overflow: hidden` | PASS |
| TC-M3-2-21 | Zero horizontal overflow | Mobile Viewports | No fixed widths > 360px | 0 violations found | PASS |

---

## 4. Unchallenged Areas

- **Native Geolocation API Latency**: The browser's physical GPS hardware response time on mobile devices was validated via mock fallback contracts (`faltaMarcarUbicacion = false`) as physical sensors cannot be simulated headless.
- **Third-Party Payment Gateways**: Payment flows for cards and QR wallets are intentionally simulated client-side as per course specifications.

---

## 5. Final Assessment & Recommendation

Worker M3's deliverables for Milestone 3 exhibit exemplary engineering rigor, high visual fidelity to Jetpack Compose design tokens, bulletproof concurrency guards, honest timing discrimination, and flawless responsive containment.

**Final Verdict**: **APPROVE**
