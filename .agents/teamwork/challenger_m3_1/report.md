# Empirical Challenge Report — Milestone 3: Checkout & Order Tracking Verification

**Agent**: Challenger M3-1 (`teamwork_challenger`)  
**Role**: critic, specialist  
**Date**: 2026-10-30  
**Target Milestone**: Milestone 3 — Checkout & Order Tracking Critical Flow  
**Target Recipient**: Parent Orchestrator (`20c340e3-fa46-461e-a7ae-9dd6bbd67479`)  
**Verdict**: **APPROVE**

---

## 1. Challenge Summary

**Overall Risk Assessment**: **LOW**

The empirical audit executed by Challenger M3-1 independently tested the deliverables of Worker M3. Through the creation and execution of an empirical test suite (`tests/unit/challenger_m3_1_empirical.test.mjs`) containing 30 targeted test cases across 6 suites, plus the end-to-end execution of all project test runners (Unit, Tiered Acceptance, Frontend Cucumber, and Full Regression), all contracts, DOM IDs, financial calculation algorithms, and card/coupon validation engines were strictly validated with 100% pass rates and zero regressions.

---

## 2. Empirical Test Harness Execution (`tests/unit/challenger_m3_1_empirical.test.mjs`)

The empirical test suite was executed via Node.js native test runner:

```text
▶ Milestone 3 Empirical Verification — Challenger M3-1
  ▶ Suite 1: DOM ID Presence and Syntax in frontend/index.html
    ✔ debe contener los 33 IDs esenciales del Checkout sin omisiones (2.3384ms)
    ✔ debe contener los IDs modernos de Checkout requeridos por Hito 3 (1.5535ms)
    ✔ debe contener los 23 IDs esenciales de Tracking sin omisiones (1.1124ms)
    ✔ debe contener los IDs modernos de Tracking requeridos por Hito 3 (0.6108ms)
    ✔ todos los IDs verificados deben ser únicos en el DOM (cero duplicados) (3.8599ms)
    ✔ debe verificar atributos de accesibilidad en elementos interactivos de Checkout y Tracking (0.332ms)
  ✔ Suite 1: DOM ID Presence and Syntax in frontend/index.html (10.9906ms)
  ▶ Suite 2: Financial Calculation Oracle (Backend vs Frontend Parity)
    ✔ Escenario A: Usuario regular, sin cupón, producto único (0.5314ms)
    ✔ Escenario B: Usuario estudiante, sin cupón, con descuento de producto 15% (0.2348ms)
    ✔ Escenario C: Usuario regular con cupón PruebaCupon (10%) (0.3001ms)
    ✔ Escenario D: Usuario estudiante con descuento de producto 20% Y cupón FOODJET20 (20%) (0.362ms)
    ✔ Escenario E: Cesta multi-producto con precios con decimales y redondeo monetario (0.4338ms)
    ✔ Escenario F: Validación de precisión con 100 cestas aleatorias (Stress Monte Carlo) (0.7236ms)
  ✔ Suite 2: Financial Calculation Oracle (Backend vs Frontend Parity) (3.0486ms)
  ▶ Suite 3: Card Validation Oracle & Brand Detection
    ✔ luhnCheck debe aceptar tarjetas válidas y rechazar alteradas (0.4349ms)
    ✔ luhnCheck debe rechazar entradas vacías, cortas o no numéricas (0.1513ms)
    ✔ detectBrand debe clasificar correctamente Visa, Mastercard, Amex y desconocida (0.243ms)
    ✔ debe mapear detectedBrand a las clases de icono #detectedBrandIcon exactamente como en app.js (0.1367ms)
    ✔ validateNumber debe validar longitud y Luhn según la marca (0.1753ms)
    ✔ validateExpiry debe validar formato MM/AA y fechas pasadas/futuras (1.7372ms)
    ✔ validateCvc debe exigir 3 dígitos para Visa/MC y 4 dígitos para Amex (0.2052ms)
    ✔ validateCard debe validar el conjunto completo de la tarjeta (0.3019ms)
    ✔ formatCardNumber y formatExpiry deben aplicar máscaras adecuadas mientras se escribe (0.2189ms)
  ✔ Suite 3: Card Validation Oracle & Brand Detection (4.0209ms)
  ▶ Suite 4: Coupon Validation Oracle & Payload Contract
    ✔ debe contener los cupones soportados en seed del backend (0.1511ms)
    ✔ validateCoupon debe validar cupones exactos, en mayúsculas, minúsculas y mixto (0.1748ms)
    ✔ validateCoupon debe recortar espacios en blanco al inicio y final (0.1161ms)
    ✔ validateCoupon debe rechazar códigos inválidos o vacíos (0.1415ms)
    ✔ buildOrderPayload debe ser retrocompatible con 3, 4 y 5 argumentos (0.2581ms)
  ✔ Suite 4: Coupon Validation Oracle & Payload Contract (1.0864ms)
  ▶ Suite 5: Adversarial Stress Scenarios & Edge Cases
    ✔ debe comprobar reglas de cancelación de pedido en backend (0.2653ms)
    ✔ debe comprobar transiciones de estado permitidas (0.2003ms)
    ✔ debe detectar estados terminales (0.1162ms)
    ✔ debe simular comportamiento ante cambio dinámico de cupón (PruebaCupon -> FOODJET20 -> invalido -> remover) (0.1198ms)
  ✔ Suite 5: Adversarial Stress Scenarios & Edge Cases (0.8755ms)
✔ Milestone 3 Empirical Verification — Challenger M3-1 (20.6904ms)
ℹ tests 30
ℹ suites 6
ℹ pass 30
ℹ fail 0
```

---

## 3. Systematic Challenge Dimensions

### 3.1 Challenge Dimension 1: Contract Preservation & DOM Identifier Integrity
- **Assumption Challenged**: The redesign of `#checkoutView` and `#trackingView` might have dropped legacy DOM IDs required by existing tests or introduced duplicate IDs.
- **Attack Scenario**: We checked all 33 preserved checkout IDs and 23 tracking IDs against `frontend/index.html`. We also searched for duplicate IDs across the entire file.
- **Result**:
  - All 33 checkout IDs (`checkoutView`, `backToMenuBtn`, `checkoutForm`, `customerName`, `customerPhone`, `customerPhoneError`, `customerAddress`, `deliveryAddressSearch`, `deliveryMapWrapper`, `deliveryMap`, `deliveryMapLocate`, `deliveryMapStatus`, `customerReference`, `payCash`, `payCard`, `payWallet`, `cardDetails`, `cardNumber`, `cardNumberError`, `cardExpiry`, `cardExpiryError`, `cardCvc`, `cardCvcError`, `checkoutItems`, `couponCode`, `applyCouponBtn`, `couponMessage`, `checkoutSubtotal`, `checkoutDiscountRow`, `checkoutDiscount`, `checkoutTaxes`, `checkoutDelivery`, `checkoutTotal`) are present and valid.
  - Fallback alias IDs (`checkoutCartItems` vs `checkoutItems`, `checkoutTax` vs `checkoutTaxes`, `checkoutDeliveryFee` vs `checkoutDelivery`) are synchronized, ensuring older and newer test suites pass simultaneously.
  - All 23 tracking IDs (`trackingView`, `trackingLayout`, `trackingMapCard`, `trackingMap`, `trackingRoute`, `statusIcon`, `statusTitle`, `statusDescription`, `estimatedTime`, `etaValue`, `etaText`, `trackingConnection`, `step1`, `step2`, `step3`, `step4`, `orderNumber`, `orderPayment`, `orderDate`, `orderSubtotal`, `orderTaxes`, `orderDelivery`, `orderTotalFinal`) are present.
  - Exactly 0 duplicate IDs detected.
- **Status**: **PASS**

### 3.2 Challenge Dimension 2: Financial Calculation Oracle & Rounding Parity
- **Assumption Challenged**: Frontend financial calculations (`ui.js:renderCheckoutCart`) could apply student discounts, coupon discounts, IGV taxes, or delivery fees in an order different from `backend/src/controllers/orderController.js:76–104`, causing discrepancies in totals or cent rounding errors.
- **Attack Scenario**:
  - We compared backend logic with frontend logic across 6 distinct test matrices:
    1. Regular user, 0% discount, single item.
    2. Student user, 15% discount on product, no coupon.
    3. Regular user with `PruebaCupon` (10%).
    4. Student user with 20% product discount AND `FOODJET20` (20%).
    5. Multi-item basket with fractional prices (`12.99`, `7.50`, `14.80`) and student discounts.
    6. 100-iteration randomized Monte Carlo stress test with varying quantities, prices, student flags, and coupons.
- **Result**:
  - Exact mathematical parity confirmed in all scenarios.
  - Sequence: `Subtotal per item with student discount -> Active coupon percentage discount applied to effective subtotal -> 18% IGV tax applied to discounted subtotal -> Fixed S/ 5.00 delivery fee added -> Grand Total`.
  - Both backend and frontend format outputs via `.toFixed(2)` producing identical currency strings (`S/ XX.XX`).
- **Status**: **PASS**

### 3.3 Challenge Dimension 3: Card Luhn Verification & Brand Preview
- **Assumption Challenged**: Client-side validation could accept malformed card numbers, reject valid Amex (15 digits / 4-digit CVC), fail to mask inputs, or fail to dynamically update `#detectedBrandIcon`.
- **Attack Scenario**:
  - We passed valid and 1-digit-altered numbers for Visa, Mastercard, and American Express into `luhnCheck`.
  - We tested `detectBrand` against 4-series, 5-series, 2-series BINs, and 3-series Amex.
  - We verified `#detectedBrandIcon` class mapping.
  - We tested `validateExpiry` for current month (valid through end of month), future months, past months, and malformed strings.
  - We tested `validateCvc` enforcing 3 digits for Visa/Mastercard and 4 digits for Amex.
- **Result**:
  - All valid cards passed; all invalid cards failed.
  - `#detectedBrandIcon` properly maps `visa` -> `text-primary`, `mastercard` -> `text-warning`, `amex` -> `text-info`, and unknown -> `text-muted`.
  - Input masks (`formatCardNumber` and `formatExpiry`) format in 4-digit blocks and `MM/AA`.
- **Status**: **PASS**

### 3.4 Challenge Dimension 4: Coupon Validation & Payload Contract
- **Assumption Challenged**: `validateCoupon` could allow unauthorized codes or fail on mixed-case inputs; `buildOrderPayload` could break legacy 3-parameter or 4-parameter calls.
- **Attack Scenario**:
  - We tested `validateCoupon` with `'PruebaCupon'`, `'pruebacupon'`, `'PRUEBACUPON'`, `'FOODJET20'`, `'foodjet20'`, `'  PruebaCupon  '`, and invalid strings (`'CUPON_FALSO'`, `''`, `null`).
  - We tested `buildOrderPayload` with 3 args (`cart, resolver, 'cash'`), 4 args (`cart, resolver, 'card', 5`), and 5 args (`cart, resolver, 'wallet', 5, 2`).
- **Result**:
  - `validateCoupon` correctly accepts valid codes case-insensitively, trims whitespace, and rejects invalid codes with clear Spanish error messages.
  - `buildOrderPayload` maintains complete backward compatibility: when `cuponId` is omitted, `payload.cupon_id` is omitted; when provided, it is coerced to a number.
- **Status**: **PASS**

---

## 4. Full Project Test Suite Verification

All project test suites were executed independently and confirmed green:

| Test Suite | Command | Expected | Actual Result | Status |
|---|---|---|---|---|
| Empirical M3-1 Suite | `node --test tests/unit/challenger_m3_1_empirical.test.mjs` | 30 tests pass | 30/30 passed (6 suites, 0 failures) | **PASS** |
| Project Unit Tests | `npm run test:unit` | 25 tests pass | 25/25 passed (6 suites, 0 failures) | **PASS** |
| Acceptance Tiers Suite | `node tests/unit/e2e_acceptance_tiers.test.mjs` | 68 tests pass | 68/68 passed (16 suites, 0 failures) | **PASS** |
| Frontend Cucumber BDD | `npm run test:frontend` | 86 scenarios pass | 86/86 scenarios passed (327 steps, 0 failures) | **PASS** |
| Full Test Suite (E2E) | `npm test` | 131 scenarios pass | 131/131 scenarios passed (477 steps, 0 failures) | **PASS** |
| M2-1 Empirical Audit | `node tests/empirical_m2_1_audit.mjs` | 100% pass | 100% pass (217 IDs verified) | **PASS** |
| M2-2 Challenger Suite | `node tests/unit/challenger_m2_2_empirical.test.mjs` | 20 tests pass | 20/20 passed (4 suites, 0 failures) | **PASS** |

---

## 5. Backend Purity & Integrity Check

- `git status --porcelain backend/ prisma/ docker-compose.yml Caddyfile`: Executed with clean exit and zero output.
- Zero modifications to backend routes, models, database schemas, seeds, or server configuration.

---

## 6. Verdict

**VERDICT: APPROVE**

Milestone 3 meets all requirements of the Authoritative User Request (`ORIGINAL_REQUEST.md`) and Project Plan (`PROJECT.md`). All contracts are preserved, financial parity with the backend is mathematically verified, card/coupon validation engines are robust against adversarial inputs, and zero regressions were introduced.
