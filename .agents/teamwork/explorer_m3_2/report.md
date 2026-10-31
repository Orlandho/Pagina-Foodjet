# Technical Investigation Report: Checkout Payment Methods, Card Validation, Coupons & Order Confirmation UX (Milestone 3 - Part 2)

**Author**: Explorer M3-2 (`teamwork_explorer`)  
**Working Directory**: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m3_2\`  
**Date**: 2026-10-30  
**Target Milestone**: Milestone 3 — Checkout & Order Tracking Critical Flow  

---

## 1. Executive Summary

This report establishes the technical and architectural blueprint for the second half of Milestone 3 in the FoodJet Web Frontend UI modernization:
1. **Payment Methods (`#paymentMethodCard`)**: Modernization from generic Bootstrap outline buttons into an interactive 3-tile grid (Cash, Card, Digital Wallet) replicating Jetpack Compose `PaymentTile` aesthetics (`.foodjet-card--selected` with peach `#FCF0E4` container and `#F4511E` border).
2. **Client-Side Card Validation**: Full integration of Luhn algorithm verification (`domain/payment.js`), brand detection (Visa, Mastercard, Amex), format masking (4-digit spacing for number, MM/AA for expiration), inline error clearing, and accessible focus management (WCAG 3.3.1 / 3.3.3).
3. **Coupon Validation & Student Discount**: Resolution of the critical wiring gap where `#applyCouponBtn` was never connected to event listeners in `app.js`. Integration of backend-seeded coupons (`PruebaCupon` 10%, `FOODJET20` 20%), case-insensitive normalization, error feedback, coupon removal, and addition of `#studentDiscountRow` and `#studentDiscountAmount` to properly display student savings separately from promotional coupons.
4. **Order Confirmation & Modal UX**: Hardening of `#confirmOrderBtn` with loading spinner and double-click / duplicate-submission prevention; modernization of `#qrModal` with a 5-second countdown timer and cancellation option; and styling of `#cardAuthModal` bank simulation.
5. **Contract Preservation**: 100% preservation of all existing DOM IDs, data attributes, global bridges, and backend payload contracts (`orderController.js`).

---

## 2. Local Android Prototype Analysis (`CheckoutScreen.kt`)

Inspecting `C:\Users\ORLANDO\Desktop\ciclo 9\frontend para actualizar foodjet para app moviles y adm de proyec de software\proyecto-app-movil-UPN-2026-2-main\app-movil\app\src\main\java\com\example\foodjeetapp\ui\screens\CheckoutScreen.kt` reveals the authoritative visual and behavioral design:

### 2.1. Payment Tile Design (`PaymentTile`, lines 801–824)
- **Grid Layout**: 3 horizontal tiles arranged in a row with `Arrangement.spacedBy(8.dp)`:
  - **Yape / Plin** (Wallet): Icon `QrCode`, Title "Yape / Plin", Subtitle "Escanea el QR".
  - **Tarjeta** (Card): Icon `CreditCard`, Title "Tarjeta", Subtitle "Crédito o débito".
  - **Efectivo** (Cash): Icon `AttachMoney`, Title "Efectivo", Subtitle "Paga al recibir".
- **Visual States**:
  - Unselected: Surface white, border `1.dp` (`FoodJetBorder` `#E6E4DC`), dark text.
  - Selected: Background `FoodJetPrimaryLight` (`#FCF0E4`), border `1.5.dp` (`FoodJetPrimary` `#F4511E`), icon & title highlighted in primary orange.
- **Dynamic Content per Method**:
  - Cash: Subtitle info text: "Paga contraentrega cuando recibas tu pedido."
  - Card: Input fields for Card Number (16 digits), Expiry (MM/AA), CVC (4 digits).
  - Wallet: High-contrast callout container (`#FCF0E4` background, rounded 16dp) displaying total order amount ("S/ XX.XX") and instructions: "Paga escaneando el código QR del local".
- **Security Footer**: Lock icon (`Icons.Default.Lock`) + "Tus pagos y datos están protegidos."

### 2.2. Coupon & Financial Breakdown (`CheckoutScreen.kt`, lines 671–750)
- **Seeded Backend Coupons**:
  ```kotlin
  private val CUPONES_BACKEND = mapOf(
      "pruebacupon" to Triple(1, 0.10, "PruebaCupon"),
      "foodjet20" to Triple(2, 0.20, "FOODJET20")
  )
  ```
- **Coupon Application**:
  - Input field: "Código de cupón" + Primary "Aplicar" button (`FoodJetPrimary`, white text, rounded 12dp).
  - Success message: Background `FoodJetSuccessSoft` (`#ECF4EC`), text `FoodJetSuccessDeep` (`#1E7B4F`), bold, rounded 10dp: `"Cupón 'PruebaCupon' (10%) aplicado"`.
  - Error message: Text error: `"Código de cupón no válido"`.
- **Financial Rows (`FinanceRow`)**:
  - Subtotal: `S/ XX.XX`
  - Descuento (X%): `-S/ XX.XX` (highlighted in deep green `#1E7B4F`)
  - Impuestos (18% IGV): `S/ XX.XX`
  - Costo de Delivery: `S/ 5.00`
  - Total a Pagar: 18sp / 22sp primary bold: `S/ XX.XX`
  - Subtitle Note: `"El servidor confirma el importe final al registrar el pedido."`

### 2.3. Confirmation Button (`CheckoutScreen.kt`, lines 751–794)
- Full width, height `56.dp`, corner radius `18.dp`, primary color.
- Displays spinner `CircularProgressIndicator` when `isSubmitting`.
- Text states:
  - Submitting: `"Registrando..."`
  - Wallet: `"Ya pagué · S/ XX.XX"` (or confirm order)
  - Card/Cash: `"Confirmar pedido · S/ XX.XX"`
- Arrow icon on right side when idle.

---

## 3. Existing Codebase Audit & Gaps Identified

### 3.1. DOM Structure in `frontend/index.html`
- **Payment Card (lines 470–542)**:
  - Wrapped in `<div class="card">` without an explicit ID. Adding `id="paymentMethodCard"` satisfies all testing requirements.
  - Payment options use radio inputs (`id="payCash"`, `id="payCard"`, `id="payWallet"`) wrapped in `.payment-option` divs. To preserve both existing JS selectors and dispatch requirements, we provide both `#payCash` / `#payCard` / `#payWallet` on the inputs and `#paymentCash` / `#paymentCard` / `#paymentWallet` on the wrapper containers.
  - `#cardDetails` (line 507) contains `#cardNumber`, `#cardExpiry`, and `#cardCvc` with corresponding error feedback elements (`#cardNumberError`, `#cardExpiryError`, `#cardCvcError`).
- **Order Summary Card (lines 544–583)**:
  - Sticky container `<div class="card sticky-top" style="top: 100px;">` lacks explicit `id="orderSummaryCard"`.
  - `#checkoutItems` (line 548) receives item rows from `ui.js`.
  - `#couponCode` (line 553), `#applyCouponBtn` (line 554), and `#couponMessage` (line 556) exist in markup.
  - Financial rows exist for `#checkoutSubtotal`, `#checkoutDiscountRow` / `#checkoutDiscount`, `#checkoutTaxes`, `#checkoutDelivery`, and `#checkoutTotal`.
  - **Gap 1**: `#studentDiscountRow` and `#studentDiscountAmount` are completely missing from the HTML markup!
  - **Gap 2**: `#checkoutDiscountRow` has `style="display: none !important;"`. The `!important` flag creates conflicts with JavaScript DOM toggling.
  - **Gap 3**: Confirmation button (line 580) is `<button type="submit" class="btn btn-primary w-100 py-3">Confirmar Pedido</button>` without `id="confirmOrderBtn"`, without a spinner, and without double-click guards.

### 3.2. JavaScript Audit
- **`frontend/js/domain/payment.js`**:
  - Implements `luhnCheck(numero)`, `detectBrand(numero)`, `validateNumber(numero)`, `validateExpiry(valor, ahora)`, `validateCvc(cvc, marca)`, and `validateCard()`.
  - Also implements `formatCardNumber(valor)` and `formatExpiry(valor)`.
  - 100% test coverage exists in `tests/unit/domain.test.mjs` and `tests/unit/e2e_acceptance_tiers.test.mjs`.
- **`frontend/js/domain/checkout.js`**:
  - Implements `buildOrderPayload(cart, getProductById, metodoPago, direccionEntregaId = 1)`.
  - **Gap 4**: Does not currently accept or forward `cupon_id`. `cupon_id` must be accepted as an optional 5th parameter (`cuponId = null`) and assigned as `payload.cupon_id = Number(cuponId)` when present.
- **`frontend/js/state.js`**:
  - Defines `activeCoupon` with `setActiveCoupon(coupon)` and `getActiveCoupon()`.
- **`frontend/js/app.js`**:
  - **Gap 5**: `#applyCouponBtn` has NO event listener attached! The user could type a coupon code in the checkout view, but clicking "Aplicar" or pressing Enter did nothing.
  - In `handleCheckoutSubmit`, double submission was possible if a user clicked multiple times while `resolveDeliveryAddressId()` was awaiting network response.
- **`frontend/js/ui.js`**:
  - `renderCheckoutCart()` calculates totals and derives discounts.
  - Currently computes student discount per item, but does not render a dedicated `#studentDiscountRow` with `#studentDiscountAmount`.
  - Handles card errors (`showCardErrors`, `clearFieldError`) and card auth modal (`runCardAuthorization`).
- **Backend Contract (`backend/src/controllers/orderController.js` lines 21, 76–95)**:
  - Expects payload: `{ restaurante_id, direccion_entrega_id, cupon_id, metodo_pago, items }`.
  - Re-calculates and verifies:
    1. Student price per item: `price - (price * (descuento_estudiante / 100))`.
    2. Subtotal of items.
    3. Coupon discount applied to subtotal: `subtotal * (cupon.porcentaje_descuento / 100)`.
    4. 18% IGV tax on subtotal with discount: `(subtotal - descuento) * 0.18`.
    5. Delivery fee: `5.00`.
    6. Total: `(subtotal - descuento) + tax + deliveryFee`.
  - **Crucial finding**: Our frontend calculations in `renderCheckoutCart()` must match this exact formula to prevent discrepancy between checkout preview and backend recorded order!

---

## 4. Architectural Blueprint

### 4.1. Payment Methods Section (`#paymentMethodCard`)

#### Visual Structure (Responsive 3-Tile Grid)
```html
<div class="card foodjet-card mb-4" id="paymentMethodCard">
    <div class="card-body">
        <h2 class="foodjet-section-header mb-3">
            <i class="bi bi-credit-card-2-front-fill me-2 text-primary" aria-hidden="true"></i>¿Cómo quieres pagar?
        </h2>
        
        <!-- 3-Tile Interactive Grid -->
        <div class="payment-options-grid mb-3" role="radiogroup" aria-label="Métodos de pago disponibles">
            <!-- 1. Yape / Plin (Wallet) -->
            <div class="payment-option" data-payment="wallet" id="paymentWallet">
                <input type="radio" class="btn-check" name="paymentMethod" id="payWallet" value="wallet">
                <label class="foodjet-payment-tile w-100 p-3 text-start" for="payWallet">
                    <div class="payment-tile__icon mb-2">
                        <i class="bi bi-qr-code-scan fs-4" aria-hidden="true"></i>
                    </div>
                    <div class="payment-tile__title fw-bold">Yape / Plin</div>
                    <small class="payment-tile__subtitle text-muted">Escanea el QR</small>
                </label>
            </div>

            <!-- 2. Tarjeta (Card) -->
            <div class="payment-option" data-payment="card" id="paymentCard">
                <input type="radio" class="btn-check" name="paymentMethod" id="payCard" value="card">
                <label class="foodjet-payment-tile w-100 p-3 text-start" for="payCard">
                    <div class="payment-tile__icon mb-2">
                        <i class="bi bi-credit-card-fill fs-4" aria-hidden="true"></i>
                    </div>
                    <div class="payment-tile__title fw-bold">Tarjeta</div>
                    <small class="payment-tile__subtitle text-muted">Crédito o débito</small>
                </label>
            </div>

            <!-- 3. Efectivo (Cash) -->
            <div class="payment-option" data-payment="cash" id="paymentCash">
                <input type="radio" class="btn-check" name="paymentMethod" id="payCash" value="cash" checked>
                <label class="foodjet-payment-tile w-100 p-3 text-start" for="payCash">
                    <div class="payment-tile__icon mb-2">
                        <i class="bi bi-cash-coin fs-4" aria-hidden="true"></i>
                    </div>
                    <div class="payment-tile__title fw-bold">Efectivo</div>
                    <small class="payment-tile__subtitle text-muted">Paga al recibir</small>
                </label>
            </div>
        </div>

        <!-- Conditional Method Details -->
        <!-- Cash Info Callout -->
        <div id="paymentCashInfo" class="payment-info-box p-3 rounded-3 mb-3">
            <div class="d-flex align-items-center">
                <i class="bi bi-info-circle-fill text-primary me-2 fs-5" aria-hidden="true"></i>
                <span class="small text-muted">Paga contraentrega en efectivo cuando el repartidor llegue a tu puerta.</span>
            </div>
        </div>

        <!-- Wallet Info Callout -->
        <div id="paymentWalletInfo" class="payment-info-box payment-info-box--wallet p-3 rounded-4 text-center mb-3" style="display: none;">
            <div class="badge foodjet-badge--student mb-2">
                <i class="bi bi-lightning-charge-fill me-1"></i>Pago Rápido
            </div>
            <h6 class="fw-bold mb-1 text-primary-dark">Paga con Yape o Plin</h6>
            <div class="fs-3 fw-bolder mb-1 text-primary" id="walletAmountDisplay">S/ 0.00</div>
            <p class="small text-muted mb-0">Al confirmar tu pedido, se abrirá el código QR del restaurante para escanear y pagar desde tu app.</p>
        </div>

        <!-- Card Details Form -->
        <div id="cardDetails" class="mt-3 pt-3 border-top" style="display: none;">
            <div class="mb-3">
                <label for="cardNumber" class="form-label fw-semibold">Número de tarjeta</label>
                <div class="position-relative">
                    <input type="text" class="form-control foodjet-input" id="cardNumber"
                           placeholder="1234 5678 9012 3456" maxlength="19"
                           inputmode="numeric" autocomplete="cc-number"
                           aria-describedby="cardNumberError cardBrandBadge">
                    <span id="cardBrandBadge" class="position-absolute end-0 top-50 translate-middle-y me-3 badge bg-light text-dark fw-bold border" aria-live="polite"></span>
                </div>
                <div class="invalid-feedback" id="cardNumberError"></div>
            </div>
            <div class="row g-3">
                <div class="col-6 mb-3">
                    <label for="cardExpiry" class="form-label fw-semibold">Fecha de expiración</label>
                    <input type="text" class="form-control foodjet-input" id="cardExpiry"
                           placeholder="MM/AA" maxlength="5"
                           inputmode="numeric" autocomplete="cc-exp"
                           aria-describedby="cardExpiryError">
                    <div class="invalid-feedback" id="cardExpiryError"></div>
                </div>
                <div class="col-6 mb-3">
                    <label for="cardCvc" class="form-label fw-semibold">CVC / CVV</label>
                    <input type="text" class="form-control foodjet-input" id="cardCvc"
                           placeholder="123" maxlength="4"
                           inputmode="numeric" autocomplete="cc-csc"
                           aria-describedby="cardCvcError">
                    <div class="invalid-feedback" id="cardCvcError"></div>
                </div>
            </div>
            <p class="small text-muted mb-0">
                <i class="bi bi-shield-lock-fill me-1 text-secondary" aria-hidden="true"></i>
                Los datos de tu tarjeta no se almacenan ni se envían a nuestros servidores.
            </p>
        </div>

        <!-- Protected Guarantee Footer -->
        <div class="d-flex align-items-center mt-3 pt-2 text-muted small border-top">
            <i class="bi bi-lock-fill me-2 text-secondary" aria-hidden="true"></i>
            <span>Tus pagos y datos personales están protegidos con cifrado seguro.</span>
        </div>
    </div>
</div>
```

---

### 4.2. Order Summary & Coupons Section (`#orderSummaryCard`)

#### Visual Structure
```html
<div class="card foodjet-card sticky-top" id="orderSummaryCard" style="top: 100px;">
    <div class="card-body">
        <h2 class="foodjet-section-header mb-3">
            <i class="bi bi-bag-check-fill me-2 text-primary" aria-hidden="true"></i>Tu pedido
        </h2>
        
        <!-- Cart Items Container -->
        <div id="checkoutItems" class="mb-3"></div>
        <hr class="my-3">

        <!-- Coupon Input Group -->
        <div class="mb-3">
            <label for="couponCode" class="form-label text-muted small fw-semibold">¿Tienes un código de cupón?</label>
            <div class="input-group">
                <input type="text" class="form-control foodjet-input" id="couponCode"
                       placeholder="Ejem: PruebaCupon" autocomplete="off" autocorrect="off" autocapitalize="characters"
                       aria-describedby="couponMessage">
                <button class="btn btn-primary foodjet-btn-primary" type="button" id="applyCouponBtn">Aplicar</button>
                <button class="btn btn-outline-secondary" type="button" id="removeCouponBtn" style="display: none;" title="Quitar cupón">
                    <i class="bi bi-x-lg" aria-hidden="true"></i>
                </button>
            </div>
            <div id="couponMessage" class="small mt-2" aria-live="polite"></div>
        </div>

        <!-- Financial Breakdown Rows -->
        <div class="checkout-finances mb-3">
            <!-- 1. Gross Subtotal -->
            <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Subtotal</span>
                <span id="checkoutSubtotal" class="fw-semibold">S/ 0.00</span>
            </div>

            <!-- 2. Student Discount Line Item (Conditional) -->
            <div class="d-flex justify-content-between mb-2" id="studentDiscountRow" style="display: none;">
                <span class="text-success d-flex align-items-center">
                    <i class="bi bi-mortarboard-fill me-1" aria-hidden="true"></i> Descuento Estudiante
                </span>
                <span class="text-success fw-bold" id="studentDiscountAmount">-S/ 0.00</span>
            </div>

            <!-- 3. Promo Coupon Discount Line Item (Conditional) -->
            <div class="d-flex justify-content-between mb-2" id="checkoutDiscountRow" style="display: none;">
                <span class="text-success d-flex align-items-center">
                    <i class="bi bi-tag-fill me-1" aria-hidden="true"></i> Descuento Cupón (<span id="couponDiscountRate">0%</span>)
                </span>
                <span class="text-success fw-bold" id="checkoutDiscount">-S/ 0.00</span>
            </div>

            <!-- 4. Taxes (18% IGV) -->
            <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Impuestos (18% IGV)</span>
                <span id="checkoutTaxes" class="fw-semibold">S/ 0.00</span>
            </div>

            <!-- 5. Delivery Fee -->
            <div class="d-flex justify-content-between mb-3">
                <span class="text-muted">Costo de Delivery</span>
                <span id="checkoutDelivery" class="fw-semibold">S/ 5.00</span>
            </div>
        </div>

        <hr class="my-3">

        <!-- Total Row -->
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-bold fs-5">Total a Pagar</span>
            <span class="fs-3 fw-bolder text-primary" id="checkoutTotal">S/ 0.00</span>
        </div>
        <p class="small text-muted mb-3" style="font-size: 0.75rem;">
            El servidor confirma el importe final al registrar el pedido.
        </p>

        <!-- Order Confirmation CTA Button with Double-Click Prevention -->
        <button type="submit" class="btn btn-primary foodjet-btn-primary foodjet-btn-cta w-100 py-3" id="confirmOrderBtn">
            <span class="spinner-border spinner-border-sm me-2 d-none" id="confirmOrderSpinner" role="status" aria-hidden="true"></span>
            <span id="confirmOrderText">Confirmar Pedido</span>
            <i class="bi bi-arrow-right ms-2" id="confirmOrderArrow" aria-hidden="true"></i>
        </button>
    </div>
</div>
```

---

### 4.3. Pure Coupon Validation & Order Payload in `frontend/js/domain/checkout.js`

Add headless, testable coupon definitions and validation logic to `frontend/js/domain/checkout.js`:
```javascript
/**
 * Cupones soportados en la base del backend (`backend/prisma/seed.js`).
 */
export const CUPONES_SOPORTADOS = {
    'pruebacupon': { id: 1, codigo: 'PruebaCupon', porcentaje: 10.0, tipo: 'porcentaje', valor: 10.0 },
    'foodjet20': { id: 2, codigo: 'FOODJET20', porcentaje: 20.0, tipo: 'porcentaje', valor: 20.0 }
};

/**
 * Valida un código de cupón de forma pura e insensible a mayúsculas/minúsculas.
 * @param {string} codigo
 * @returns {{valid: boolean, error?: string, coupon?: Object}}
 */
export function validateCoupon(codigo) {
    const limpio = String(codigo || '').trim().toLowerCase();
    if (!limpio) {
        return { valid: false, error: 'Ingresa un código de cupón.' };
    }
    const cupon = CUPONES_SOPORTADOS[limpio];
    if (!cupon) {
        return { valid: false, error: 'Código de cupón no válido.' };
    }
    return { valid: true, coupon: cupon };
}

/**
 * @param {Object} cart Carrito en formato { productId: cantidad }
 * @param {Function} getProductById Resolutor de productos
 * @param {string} metodoPago 'cash' | 'card' | 'wallet'
 * @param {number} direccionEntregaId Dirección de entrega elegida
 * @param {number|null} cuponId ID de cupón opcional
 */
export function buildOrderPayload(cart, getProductById, metodoPago, direccionEntregaId = 1, cuponId = null) {
    const items = Object.entries(cart).map(([productId, cantidad]) => ({
        productId: parseInt(productId, 10),
        cantidad
    }));

    const primerProducto = getProductById(Object.keys(cart)[0]);
    const restauranteId = primerProducto ? primerProducto.restaurante_id : 1;

    const payload = {
        items,
        metodo_pago: metodoPago,
        restaurante_id: restauranteId,
        direccion_entrega_id: direccionEntregaId
    };

    if (cuponId) {
        payload.cupon_id = Number(cuponId);
    }

    return payload;
}
```

---

### 4.4. Financial Calculation Engine in `frontend/js/ui.js` (`renderCheckoutCart`)

Reconcile `renderCheckoutCart()` with backend `orderController.js`:
```javascript
export function renderCheckoutCart() {
    const cart = state.getCart();
    const checkoutCartItems = document.getElementById('checkoutCartItems') || document.getElementById('checkoutItems');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const checkoutDiscount = document.getElementById('checkoutDiscount');
    const checkoutDiscountRow = document.getElementById('checkoutDiscountRow');
    const couponDiscountRate = document.getElementById('couponDiscountRate');
    const studentDiscountRow = document.getElementById('studentDiscountRow');
    const studentDiscountAmount = document.getElementById('studentDiscountAmount');
    const checkoutTax = document.getElementById('checkoutTax') || document.getElementById('checkoutTaxes');
    const checkoutDeliveryFee = document.getElementById('checkoutDeliveryFee') || document.getElementById('checkoutDelivery');
    const walletAmountDisplay = document.getElementById('walletAmountDisplay');

    if (!checkoutCartItems) return;
    checkoutCartItems.innerHTML = '';

    if (state.isCartEmpty()) {
        checkoutCartItems.innerHTML = '<div class="text-center text-muted py-4">Tu carrito está vacío</div>';
        if (checkoutSubtotal) checkoutSubtotal.textContent = 'S/ 0.00';
        if (checkoutTotal) checkoutTotal.textContent = 'S/ 0.00';
        if (checkoutDiscount) checkoutDiscount.textContent = '-S/ 0.00';
        if (checkoutTax) checkoutTax.textContent = 'S/ 0.00';
        if (checkoutDeliveryFee) checkoutDeliveryFee.textContent = 'S/ 5.00';
        if (checkoutDiscountRow) checkoutDiscountRow.style.display = 'none';
        if (studentDiscountRow) studentDiscountRow.style.display = 'none';
        if (walletAmountDisplay) walletAmountDisplay.textContent = 'S/ 0.00';
        return;
    }

    let subtotalRegular = 0;
    let subtotalEffective = 0;
    let studentSavings = 0;
    const isStudent = Boolean(window.currentUser && window.currentUser.es_estudiante);

    Object.entries(cart).forEach(([productId, quantity]) => {
        const product = state.getProductById(productId);
        if (!product) return;

        const regularPrice = product.precio;
        let effectivePrice = regularPrice;
        let hasStudentDiscount = false;

        if (isStudent && product.descuento_estudiante > 0) {
            effectivePrice = regularPrice - (regularPrice * (product.descuento_estudiante / 100));
            hasStudentDiscount = true;
        }

        const regularItemTotal = regularPrice * quantity;
        const effectiveItemTotal = effectivePrice * quantity;

        subtotalRegular += regularItemTotal;
        subtotalEffective += effectiveItemTotal;
        if (hasStudentDiscount) {
            studentSavings += (regularItemTotal - effectiveItemTotal);
        }

        const itemRow = document.createElement('div');
        itemRow.className = 'd-flex justify-content-between align-items-center py-2 border-bottom';
        itemRow.innerHTML = `
            <div class="d-flex align-items-center flex-grow-1 min-w-0 me-3">
                <img src="${product.imagen_url}" alt="${product.nombre}" class="rounded-3 me-3 object-fit-cover flex-shrink-0" style="width: 50px; height: 50px;">
                <div class="min-w-0">
                    <h6 class="my-0 fw-bold text-truncate" style="font-size: 0.95rem;">${product.nombre}</h6>
                    <small class="text-muted d-block">${getProductRestaurant(product)?.nombre || 'Restaurante'} · <span class="badge bg-secondary-subtle text-dark rounded-pill">x${quantity}</span></small>
                    ${hasStudentDiscount ? '<small class="text-success fw-semibold"><i class="bi bi-mortarboard-fill me-1"></i>Precio estudiante</small>' : ''}
                </div>
            </div>
            <span class="fw-bold flex-shrink-0 text-nowrap">S/ ${effectiveItemTotal.toFixed(2)}</span>
        `;
        checkoutCartItems.appendChild(itemRow);
    });

    // Student Discount Row
    if (studentDiscountRow) {
        if (isStudent && studentSavings > 0) {
            studentDiscountRow.style.display = 'flex';
            if (studentDiscountAmount) studentDiscountAmount.textContent = `-S/ ${studentSavings.toFixed(2)}`;
        } else {
            studentDiscountRow.style.display = 'none';
        }
    }

    // Coupon Discount
    const activeCoupon = state.getActiveCoupon();
    let couponDiscount = 0;

    if (activeCoupon) {
        if (activeCoupon.tipo === 'porcentaje') {
            couponDiscount = subtotalEffective * (activeCoupon.valor / 100);
        } else if (activeCoupon.tipo === 'fijo') {
            couponDiscount = activeCoupon.valor;
        }

        if (checkoutDiscountRow) {
            checkoutDiscountRow.style.display = couponDiscount > 0 ? 'flex' : 'none';
            if (checkoutDiscount) checkoutDiscount.textContent = `-S/ ${couponDiscount.toFixed(2)}`;
            if (couponDiscountRate) couponDiscountRate.textContent = `${activeCoupon.valor}%`;
        }
    } else {
        if (checkoutDiscountRow) checkoutDiscountRow.style.display = 'none';
    }

    // Financial calculations matching backend orderController.js
    const subtotalAfterCoupon = Math.max(0, subtotalEffective - couponDiscount);
    const taxRate = 0.18;
    const tax = subtotalAfterCoupon * taxRate;
    const deliveryFee = 5.00;
    const total = subtotalAfterCoupon + tax + deliveryFee;

    if (checkoutSubtotal) checkoutSubtotal.textContent = `S/ ${subtotalEffective.toFixed(2)}`;
    if (checkoutTax) checkoutTax.textContent = `S/ ${tax.toFixed(2)}`;
    if (checkoutDeliveryFee) checkoutDeliveryFee.textContent = `S/ ${deliveryFee.toFixed(2)}`;
    if (checkoutTotal) checkoutTotal.textContent = `S/ ${total.toFixed(2)}`;
    if (walletAmountDisplay) walletAmountDisplay.textContent = `S/ ${total.toFixed(2)}`;
}
```

---

### 4.5. Event Wiring & Double-Click Prevention in `frontend/js/app.js`

Wire up coupon handling, payment tiles, and order confirmation double-click guards:
```javascript
import { validateCoupon } from './domain/checkout.js';

// Setup Coupon Handler in setupEventListeners()
function setupCouponHandlers() {
    const couponInput = document.getElementById('couponCode');
    const applyBtn = document.getElementById('applyCouponBtn');
    const removeBtn = document.getElementById('removeCouponBtn');
    const couponMessage = document.getElementById('couponMessage');

    if (!couponInput || !applyBtn) return;

    const handleApply = () => {
        const rawCode = couponInput.value;
        const { valid, error, coupon } = validateCoupon(rawCode);

        if (!valid) {
            state.setActiveCoupon(null);
            couponInput.classList.add('is-invalid');
            couponInput.classList.remove('is-valid');
            if (couponMessage) {
                couponMessage.innerHTML = `<span class="text-danger fw-semibold"><i class="bi bi-exclamation-circle me-1"></i>${error}</span>`;
            }
            ui.renderCheckoutCart();
            return;
        }

        state.setActiveCoupon(coupon);
        couponInput.classList.remove('is-invalid');
        couponInput.classList.add('is-valid');
        couponInput.disabled = true;
        applyBtn.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'inline-flex';

        if (couponMessage) {
            couponMessage.innerHTML = `
                <div class="alert alert-success py-2 px-3 rounded-3 mb-0 d-flex align-items-center foodjet-badge--success">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <span>Cupón '<strong>${coupon.codigo}</strong>' (${coupon.porcentaje}%) aplicado</span>
                </div>
            `;
        }
        ui.renderCheckoutCart();
    };

    const handleRemove = () => {
        state.setActiveCoupon(null);
        couponInput.value = '';
        couponInput.disabled = false;
        couponInput.classList.remove('is-valid', 'is-invalid');
        applyBtn.style.display = 'inline-flex';
        if (removeBtn) removeBtn.style.display = 'none';
        if (couponMessage) couponMessage.innerHTML = '';
        ui.renderCheckoutCart();
    };

    applyBtn.addEventListener('click', handleApply);
    if (removeBtn) removeBtn.addEventListener('click', handleRemove);
    couponInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
        }
    });
}

// Payment Method Tile Sync & Details Toggling
export function togglePaymentMethodUI() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash';
    
    // Toggle active classes on tiles
    document.querySelectorAll('.payment-option').forEach(option => {
        const input = option.querySelector('input[type="radio"]');
        const tile = option.querySelector('.foodjet-payment-tile');
        if (input && tile) {
            tile.classList.toggle('is-selected', input.checked);
        }
    });

    // Sub-views
    const cashInfo = document.getElementById('paymentCashInfo');
    const walletInfo = document.getElementById('paymentWalletInfo');
    const cardDetails = document.getElementById('cardDetails');
    const confirmBtnText = document.getElementById('confirmOrderText');

    if (cashInfo) cashInfo.style.display = selectedMethod === 'cash' ? 'block' : 'none';
    if (walletInfo) walletInfo.style.display = selectedMethod === 'wallet' ? 'block' : 'none';
    if (cardDetails) cardDetails.style.display = selectedMethod === 'card' ? 'block' : 'none';

    if (confirmBtnText) {
        confirmBtnText.textContent = selectedMethod === 'wallet' ? 'Pagar con QR' : 'Confirmar Pedido';
    }
}

// Double-Click Prevention in handleCheckoutSubmit
let isSubmittingOrder = false;

function setOrderSubmittingState(isSubmitting) {
    isSubmittingOrder = isSubmitting;
    const confirmBtn = document.getElementById('confirmOrderBtn');
    const spinner = document.getElementById('confirmOrderSpinner');
    const text = document.getElementById('confirmOrderText');
    const arrow = document.getElementById('confirmOrderArrow');

    if (!confirmBtn) return;
    confirmBtn.disabled = isSubmitting;
    confirmBtn.classList.toggle('is-loading', isSubmitting);

    if (spinner) spinner.classList.toggle('d-none', !isSubmitting);
    if (arrow) arrow.classList.toggle('d-none', isSubmitting);
    if (text) {
        if (isSubmitting) {
            text.textContent = 'Registrando pedido...';
        } else {
            const method = document.querySelector('input[name="paymentMethod"]:checked')?.value;
            text.textContent = method === 'wallet' ? 'Pagar con QR' : 'Confirmar Pedido';
        }
    }
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();

    if (isSubmittingOrder) return; // Prevent double-click race condition
    if (state.isCartEmpty()) {
        return ui.showToast('El carrito está vacío', 'warning');
    }

    const paymentMethodElement = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = paymentMethodElement ? paymentMethodElement.value : 'cash';

    if (!window.authToken) {
        return ui.showToast('Debes iniciar sesión para completar la compra', 'warning');
    }

    if (!validarTelefono('customerPhone', 'customerPhoneError')) {
        return ui.showToast('Revisa el teléfono de contacto', 'warning');
    }

    setOrderSubmittingState(true);

    try {
        const direccionId = await resolveDeliveryAddressId();
        if (!direccionId) {
            setOrderSubmittingState(false);
            return;
        }

        const activeCoupon = state.getActiveCoupon();
        const cuponId = activeCoupon ? activeCoupon.id : null;
        const orderPayload = buildOrderPayload(state.getCart(), state.getProductById, paymentMethod, direccionId, cuponId);

        if (paymentMethod === 'wallet') {
            await processWalletPayment(orderPayload, paymentMethod);
        } else if (paymentMethod === 'card') {
            await processCardPayment(orderPayload, paymentMethod);
        } else {
            await submitOrder(orderPayload, paymentMethod);
        }
    } catch (err) {
        console.error(err);
        setOrderSubmittingState(false);
        ui.showToast('Ocurrió un error inesperado al procesar el pedido', 'danger');
    }
}
```

---

### 4.6. CSS Specification in `frontend/styles.css`

Add the following styling classes using the FoodJet token system:
```css
/* ==========================================================================
   Checkout Payment Methods & Order Summary Modernization (Milestone 3)
   ========================================================================== */

/* 1. Payment Options Grid */
.payment-options-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

@media (max-width: 480px) {
    .payment-options-grid {
        gap: 8px;
    }
}

/* 2. FoodJet Payment Tile */
.foodjet-payment-tile {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    min-height: 96px;
    background-color: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-card);
    cursor: pointer;
    user-select: none;
    transition: background-color var(--transition-fast),
                border-color var(--transition-fast),
                transform var(--transition-fast),
                box-shadow var(--transition-fast);
}

.foodjet-payment-tile:hover {
    background-color: var(--color-background);
    border-color: rgba(244, 81, 30, 0.4);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
}

.foodjet-payment-tile:active {
    transform: translateY(0);
}

/* Selected state triggered by radio:checked */
.payment-option input:checked + .foodjet-payment-tile,
.foodjet-payment-tile.is-selected {
    background-color: var(--color-primary-light) !important;
    border-color: var(--color-primary) !important;
    border-width: 2px !important;
    box-shadow: 0 4px 12px rgba(244, 81, 30, 0.15) !important;
}

.payment-option input:checked + .foodjet-payment-tile .payment-tile__icon,
.payment-option input:checked + .foodjet-payment-tile .payment-tile__title,
.foodjet-payment-tile.is-selected .payment-tile__icon,
.foodjet-payment-tile.is-selected .payment-tile__title {
    color: var(--color-primary) !important;
}

.payment-tile__icon i {
    color: var(--color-text-secondary);
    transition: color var(--transition-fast);
}

.payment-tile__title {
    font-size: 0.875rem;
    color: var(--color-text-primary);
    line-height: 1.2;
}

.payment-tile__subtitle {
    font-size: 0.75rem;
    line-height: 1.2;
}

/* 3. Payment Info Callouts */
.payment-info-box {
    background-color: var(--color-background);
    border: 1px solid var(--color-border);
}

.payment-info-box--wallet {
    background-color: var(--color-primary-light);
    border: 1.5px solid var(--color-primary);
}

/* 4. Sticky Summary Behavior */
@media (min-width: 992px) {
    #orderSummaryCard {
        position: sticky;
        top: 96px;
        z-index: 10;
    }
}

@media (max-width: 991.98px) {
    #orderSummaryCard {
        position: static !important;
    }
}

/* 5. FoodJet Form Inputs */
.foodjet-input {
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    padding: 10px 14px;
    font-size: var(--font-body-medium);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.foodjet-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(244, 81, 30, 0.18);
    outline: none;
}
```

---

## 5. Complete Preserved DOM IDs & Event Listeners Matrix

The following matrix documents every preserved DOM identifier and listener for this scope:

| # | DOM ID / Selector | Tag / Type | Purpose | Critical Contract / Listener |
|---|-------------------|------------|---------|------------------------------|
| 1 | `#paymentMethodCard` | `<div>` card | Container for payment method selection | Identified for styling & targeting |
| 2 | `#paymentCash` | `<div>` option | Cash tile container | Preserved data attribute `data-payment="cash"` |
| 3 | `#payCash` | `<input radio>` | Cash radio selection | Checked by default, listens to `'change'` |
| 4 | `#paymentCard` | `<div>` option | Card tile container | Preserved data attribute `data-payment="card"` |
| 5 | `#payCard` | `<input radio>` | Card radio selection | Toggles `#cardDetails`, listens to `'change'` |
| 6 | `#paymentWallet` | `<div>` option | Wallet tile container | Preserved data attribute `data-payment="wallet"` |
| 7 | `#payWallet` | `<input radio>` | Digital Wallet radio | Triggers QR modal, listens to `'change'` |
| 8 | `#paymentCashInfo` | `<div>` | Cash helper text banner | Toggled by `togglePaymentMethodUI()` |
| 9 | `#paymentWalletInfo` | `<div>` | Wallet preview callout | Displays total & QR heads-up |
| 10 | `#walletAmountDisplay` | `<div>` | Live amount in wallet callout | Updated by `renderCheckoutCart()` |
| 11 | `#cardDetails` | `<div>` | Credit/debit card inputs drawer | Toggled visible when `#payCard` is checked |
| 12 | `#cardNumber` | `<input text>` | Card number input | Formatted in 4-digit blocks, Luhn validation |
| 13 | `#cardNumberError` | `<div>` feedback | Card number error message | Populated by `showCardErrors()` |
| 14 | `#cardBrandBadge` | `<span>` badge | Detected card brand display | Shows Visa/Mastercard/Amex |
| 15 | `#cardExpiry` | `<input text>` | Expiry date input | Formatted MM/AA, validated against future date |
| 16 | `#cardExpiryError` | `<div>` feedback | Expiry date error message | Populated by `showCardErrors()` |
| 17 | `#cardCvc` | `<input text>` | CVC/CVV security code | Numeric only, 3 digits (Visa/MC) or 4 (Amex) |
| 18 | `#cardCvcError` | `<div>` feedback | CVC error message | Populated by `showCardErrors()` |
| 19 | `#orderSummaryCard` | `<div>` card | Sticky summary card container | Sticky on desktop, static on mobile |
| 20 | `#checkoutItems` | `<div>` container | Checkout cart items render target | Populated by `renderCheckoutCart()` |
| 21 | `#couponCode` | `<input text>` | Promotional coupon input | Accepts `PruebaCupon`, `FOODJET20` |
| 22 | `#applyCouponBtn` | `<button>` | Apply coupon action button | Listens to `'click'`, validates coupon |
| 23 | `#removeCouponBtn` | `<button>` | Remove coupon action button | Clears active coupon, restores input |
| 24 | `#couponMessage` | `<div>` feedback | Coupon feedback message | Green alert on success, red on invalid |
| 25 | `#couponDiscountRate` | `<span>` | Applied coupon rate text | e.g. "10%" or "20%" |
| 26 | `#checkoutSubtotal` | `<span>` | Effective subtotal display | Updated by `renderCheckoutCart()` |
| 27 | `#studentDiscountRow` | `<div>` row | Student discount breakdown row | Displayed if user is verified student |
| 28 | `#studentDiscountAmount`| `<span>` | Student discount monetary amount | Displays `-S/ XX.XX` in success green |
| 29 | `#checkoutDiscountRow` | `<div>` row | Coupon discount breakdown row | Displayed if coupon is active |
| 30 | `#checkoutDiscount` | `<span>` | Coupon discount monetary amount | Displays `-S/ XX.XX` in success green |
| 31 | `#checkoutTaxes` | `<span>` | 18% IGV tax display | Aliased to `#checkoutTax` |
| 32 | `#checkoutDelivery` | `<span>` | Delivery fee display | Aliased to `#checkoutDeliveryFee` (S/ 5.00) |
| 33 | `#checkoutTotal` | `<span>` | Final grand total display | Prominent orange bold text |
| 34 | `#confirmOrderBtn` | `<button submit>` | Main order confirmation CTA | Height 56px, spinner, double-click guard |
| 35 | `#confirmOrderSpinner` | `<span>` spinner | Double-click submit spinner | `.d-none` when idle |
| 36 | `#confirmOrderText` | `<span>` label | Submit button dynamic label | "Confirmar Pedido" / "Registrando..." |
| 37 | `#confirmOrderArrow` | `<i>` icon | Submit button trailing arrow | Hidden while submitting |
| 38 | `#checkoutForm` | `<form>` | Enclosing checkout form | Listens to `'submit'` |
| 39 | `#qrModal` | `<div>` modal | Digital wallet QR simulation modal | Static backdrop, 5s countdown |
| 40 | `#qrModalLabel` | `<h5>` title | QR modal heading | "Pago con Billetera Digital" |
| 41 | `#qrRestaurantName` | `<strong>` | Restaurant name in QR modal | Populated from active restaurant |
| 42 | `#qrPaymentImage` | `<img>` | Restaurant QR code image | Populated from `restaurante.qr_pago` |
| 43 | `#qrTimerText` | `<p>` timer | Timer countdown text | "Esperando confirmación... (5s)" |
| 44 | `#cancelQrPaymentBtn` | `<button>` | Cancel QR payment action | Clears timer, hides modal, restores button |
| 45 | `#cardAuthModal` | `<div>` modal | Simulated bank auth modal | Static backdrop, 2.5s simulated delay |
| 46 | `#cardAuthModalLabel` | `<h5>` title | Bank auth heading | "Autorizando el pago" |
| 47 | `#cardAuthBrand` | `<p>` text | Bank auth brand subtitle | e.g. "Tarjeta Visa" |

---

## 6. Worker Execution Guide & Verification Procedures

### Step 1: Update `frontend/js/domain/checkout.js`
- Export `CUPONES_SOPORTADOS` and `validateCoupon(codigo)`.
- Update `buildOrderPayload` to accept `cuponId = null` and attach `cupon_id` to payload when truthy.

### Step 2: Update `frontend/index.html`
- Assign `id="paymentMethodCard"` to the payment card.
- Modernize the payment options with `.payment-options-grid` and `.foodjet-payment-tile`, preserving `#payCash`, `#payCard`, `#payWallet` on inputs and `#paymentCash`, `#paymentCard`, `#paymentWallet` on containers.
- Add `#paymentCashInfo`, `#paymentWalletInfo`, and `#cardBrandBadge`.
- Assign `id="orderSummaryCard"` to the summary card.
- Insert `#removeCouponBtn` inside the coupon input-group.
- Insert `#studentDiscountRow` and `#studentDiscountAmount` directly above `#checkoutDiscountRow`.
- Remove `!important` from `#checkoutDiscountRow`'s inline style.
- Assign `id="confirmOrderBtn"` with `#confirmOrderSpinner`, `#confirmOrderText`, and `#confirmOrderArrow` to the submit button.

### Step 3: Update `frontend/js/ui.js`
- Enhance `renderCheckoutCart()` to separate student savings into `#studentDiscountRow` and coupon discounts into `#checkoutDiscountRow`, and format all currency figures to 2 decimal places.
- Add dynamic card brand badge updating in `showCardErrors()`.

### Step 4: Update `frontend/js/app.js`
- Add `setupCouponHandlers()` with `'click'` on `#applyCouponBtn`, `'click'` on `#removeCouponBtn`, and `'keydown'` (Enter) on `#couponCode`.
- Implement `togglePaymentMethodUI()` and call it on `'change'` of `input[name="paymentMethod"]`.
- Implement `setOrderSubmittingState(isSubmitting)` and double-click prevention in `handleCheckoutSubmit()`.
- Pass `cuponId` in `buildOrderPayload()`.
- Ensure cancellation of `#qrModal` restores `#confirmOrderBtn` to enabled state.

### Step 5: Update `frontend/styles.css`
- Add the CSS rules documented in Section 4.6 for `.payment-options-grid`, `.foodjet-payment-tile`, `.payment-info-box`, `.foodjet-input`, and `#orderSummaryCard` responsive sticky rules.

### Step 6: Independent Verification Commands
```bash
# 1. Run domain unit tests baseline
npm run test:unit

# 2. Run comprehensive 4-tier acceptance test suite
node --test tests/unit/e2e_acceptance_tiers.test.mjs

# 3. Run Cucumber feature suites (86 frontend + 45 backend scenarios)
npm test
```
All suites must continue to pass with 0 failures and 0 regressions.
