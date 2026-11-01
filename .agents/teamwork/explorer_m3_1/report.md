# Technical Report: Checkout Layout, Delivery Address & Map Fallback (Milestone 3 / Feature 9 & 10)

**Agent**: Explorer M3-1 (`teamwork_explorer`)  
**Working Directory**: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m3_1\`  
**Target Milestone**: Milestone 3 — Checkout & Order Tracking Critical Flow  
**Date**: 2026-10-30  

---

## 1. Executive Summary

This report delivers the comprehensive technical blueprint and architectural specification for modernizing the **Checkout View (`#checkoutView`)**, **Delivery Information handling**, and **Interactive Delivery Map with Cascading & Fallback** in the FoodJet web application.

Our investigation covered:
1. **Existing Web Codebase**: `frontend/index.html` (lines 407–587), `frontend/styles.css`, `frontend/js/ui.js`, `frontend/js/app.js`, `frontend/js/mapaEntrega.js`, `frontend/js/googleMaps.js`, `frontend/js/domain/ubicacion.js`, `frontend/js/domain/validation.js`, and `frontend/js/domain/payment.js`.
2. **Local Kotlin/Compose Prototype**: `CheckoutScreen.kt` and `MapaFoodJet.kt` in `C:\Users\ORLANDO\Desktop\ciclo 9\frontend para actualizar foodjet para app moviles y adm de proyec de software\proyecto-app-movil-UPN-2026-2-main`.
3. **Automated Test Contracts**: 131 Cucumber scenarios (`npm test`) and 93 Unit/Tier tests (`npm run test:unit` and `e2e_acceptance_tiers.test.mjs`), identifying 33 strictly preserved DOM IDs and event listeners.
4. **Regulatory & User Constraints**: Strict adherence to **User Rule R7** (SDK cleanup, 100–150ms observation window, graceful degradation, backward-compatible API config) and **User Rule R1** (no Mermaid, no ASCII art).

---

## 2. Existing Baseline & Gap Analysis

| Aspect | Current Web Implementation | Prototype Reference (`CheckoutScreen.kt`) | Target Production Blueprint (Worker Task) |
|---|---|---|---|
| **Page Title & Subtitle** | `Finalizar Pedido` (plain h1) | `A un paso del antojo.` + `Confirma tus datos y elige cómo pagar.` | Modernized headline with display typography and secondary helper text matching prototype tone. |
| **Desktop Layout** | Standard Bootstrap `col-lg-7` / `col-lg-5` with `sticky-top` at `top: 100px`. | Mobile-first LazyColumn with modular Card sections. | Responsive 2-column grid on desktop (>= 1280px, 992px breakpoint) with sticky summary at `top: 96px`, and single-column on mobile (< 992px) with `position: static`. |
| **Mobile Layout** | Single column, but sticky-top can obstruct scrolling and form inputs if not constrained. | Single column with 16dp padding and 16dp spacing. | Strict single column on mobile (< 576px / 360px / 390px) with `position: static` on summary card, zero horizontal overflow, and inputs with >= 16px font to prevent zoom. |
| **Card Styling** | Default Bootstrap `.card` with 1px border and grey shadows. | Rounded 20dp cards, 1dp subtle border (`FoodJetBorder`), surface background. | Modernized `.foodjet-card` using CSS tokens: `--radius-lg` (16px/20px), `--color-surface`, `--color-border`, `--shadow-sm`. |
| **Section Headers** | Plain `h2 class="h4 mb-4"` text. | `FoodJetSectionHeader` with themed icon pill and bold label. | Styled headers with `.foodjet-icon-pill` (`--color-primary-light` background, `--color-primary` icon). |
| **Customer Name** | Simple input `#customerName`. | OutlinedTextField with 3-char minimum validation. | Preserved `#customerName`, prefilled from session, validated with inline feedback. |
| **Phone Input** | Numeric input `#customerPhone` with pattern `\d{9}`. | OutlinedTextField filtering digits, max 9. | Real-time digit filtering via `sanitizePhone()`, exact 9-digit validation via `validatePhone()`, inline feedback in `#customerPhoneError`. |
| **Saved Addresses** | Handled in JS via `fetchMyAddressesAPI`, but no chip UI. | Horizontal scroll of `FilterChip` items showing saved addresses with home icon. | Horizontal chip list `#savedAddressesList` allowing 1-click address selection. |
| **Address Input & Geocoding** | `#customerAddress` + search button `#deliveryAddressSearch`. | OutlinedTextField with search trailing icon and enter-to-search. | Accessible input group with enter-to-search and trailing search button, connected to Google Maps Geocoder. |
| **Delivery Map Canvas** | `#deliveryMapWrapper` with `#deliveryMap`, center pin, GPS button. | `MapaFoodJet` with fixed center pin, GPS locate button, and schematic fallback. | Preserved DOM IDs, styled canvas with 240px height on mobile and 280px on desktop, jump pin animation, and accessible GPS button. |
| **Map Cascading & Fallback** | Implemented in `googleMaps.js` & `mapaEntrega.js` with primary/secondary keys and Nominatim/GPS fallback. | `ConfigMapa` requesting keys from `/api/config` and switching on rejection. | Verified compliant with Rule R7: clean `limpiarResiduosGoogleMaps()`, 100ms observation window, fallback to manual + browser GPS on auth failure (`gm_authFailure`). |
| **Payment Options** | 3 radio buttons in vertical list. | 3 horizontal payment tiles (`Yape / Plin`, `Tarjeta`, `Efectivo`). | Grid of 3 interactive cards (stacked on mobile, 3-column on tablet/desktop) with active state highlighting. |
| **Card Details** | `#cardDetails` drawer with number, expiry, cvc inputs. | AnimatedVisibility with formatted inputs. | Formatted card inputs (`formatCardNumber`, `formatExpiry`), real-time error clearing, brand detection icon preview. |
| **Order Summary** | Rendered via `renderCheckoutCart()` in `ui.js`. | Item list with thumbnails, quantity badges, student discount tag, finance rows. | Modernized item rows with image, quantity badge, student discount badge, coupon container, and bold total. |
| **Coupon Input** | `#couponCode` + `#applyCouponBtn` + `#couponMessage` in HTML, but NOT wired in JS. | Client translation `CUPONES_BACKEND` (`PruebaCupon` 10%, `FOODJET20` 20%). | Wire `#applyCouponBtn` and Enter key to `state.setActiveCoupon()`, recalculate summary, and show green/red message in `#couponMessage`. |

---

## 3. Responsive Layout Specification

### 3.1 Breakpoint Strategy
- **Desktop (>= 1280px / >= 992px)**:
  - Container width capped at standard container (`max-width: 1200px`).
  - Two-column grid:
    - **Left Column** (`col-lg-7` / `flex: 0 0 58%`): Contains Delivery Info Card and Payment Methods Card.
    - **Right Column** (`col-lg-5` / `flex: 0 0 42%`): Contains Sticky Order Summary Card.
  - Sticky positioning:
    ```css
    @media (min-width: 992px) {
        .checkout-summary-sticky {
            position: sticky;
            top: 96px; /* 70px header + 26px breathing room */
            z-index: 10;
        }
    }
    ```
- **Tablet (768px – 991px)**:
  - May collapse gracefully to single column or stacked layout.
- **Mobile (< 576px / 360px / 390px)**:
  - Single column (`col-12`, width 100%).
  - Sticky-top MUST be disabled:
    ```css
    @media (max-width: 991.98px) {
        .checkout-summary-sticky {
            position: static !important;
            top: auto !important;
        }
    }
    ```
  - Padding: `padding: 16px` on container, card margins `16px`.
  - Zero horizontal scroll: All containers have `overflow-x: hidden`, cards have `min-width: 0`, and word-wrapping is enabled.
  - Touch targets: All buttons, chips, and inputs have `min-height: 48px`.
  - Input font size: `font-size: 16px` (1rem) on all inputs to prevent mobile Safari/Chrome auto-zooming.

---

## 4. Delivery Information & Address Handling Blueprint

### 4.1 Address Selection Hierarchy & Truthfulness
To satisfy Requirement R1 ("Distinguir la dirección del local de la dirección de entrega del usuario, usando en cabecera y checkout la dirección real disponible o un estado neutral. NUNCA inventar o fijar direcciones fijas del prototipo"):
1. **Logged-in user with saved addresses**:
   - `fetchMyAddressesAPI(window.authToken)` loads user addresses.
   - Render horizontal chip list `#savedAddressesList`:
     ```html
     <div class="saved-address-chip" data-id="1">
         <i class="bi bi-house-door-fill me-1"></i>
         <span class="text-truncate">Av. Alfredo Mendiola 6062</span>
     </div>
     ```
   - Selecting a chip fills `#customerAddress`, `#customerReference`, sets map coordinates, and moves the map with `moverMapa(coords)`.
2. **Logged-in user without saved addresses / Guest**:
   - Start with empty input `#customerAddress`.
   - Placeholder: `"Calle, número y distrito"`.
   - Neutral status message: `"Escribe tu dirección y pulsa Enter, o mueve el mapa hasta que el pin quede en tu puerta."`.
   - If browser GPS permission is granted, query geolocation once to locate the user; if denied or off, keep neutral text without hardcoding fictitious addresses.

### 4.2 Interactive Map Integration & Center Pin Architecture
The map implementation follows the proven mobile/web pattern:
- **Canvas (`#deliveryMap`)**: Hosted inside `#deliveryMapWrapper`.
- **Fixed Center Pin (`.mapa-entrega__pin`)**:
  - Located at `left: 50%; top: 50%; transform: translate(-50%, -100%); pointer-events: none;`.
  - Color: `--color-primary` (`#F4511E`).
  - Drop shadow on the ground (`::after` pseudo-element).
  - Jump animation during drag (`.mapa-entrega--moviendo` lifts the pin by 8px).
- **GPS Locate Button (`#deliveryMapLocate`)**:
  - Positioned at top-right inside map container.
  - Minimum 44px x 44px accessible touch target with crosshair icon.
- **Geocoding Flow**:
  - Moving the map fires Google Maps `idle` event -> reads center coordinates -> calls Geocoder reverse geocode -> fills `#customerAddress` automatically ONLY if the user hasn't typed a custom address manually (`estado.textoAutomatico === true`).
  - Typing in `#customerAddress` and pressing Enter or clicking `#deliveryAddressSearch` calls forward geocoding -> moves the map to the location and updates coordinates.

---

## 5. Google Maps Resilience & Rule R7 Conformance

### 5.1 Multi-Tier Key Cascading
In `frontend/js/googleMaps.js` and `frontend/js/mapaEntrega.js`:
- The backend `/api/config` delivers:
  - `googleMapsApiKey`: scalar string (primary key).
  - `googleMapsApiKeys`: array of strings `[primaryKey, secondaryKey]`.
- Frontend maps loader merges and deduplicates keys.
- **Key 1 (Primary)**: Attempted first.
- **Key 2 (Secondary / Backup)**: If Key 1 triggers `window.gm_authFailure` or `onerror`, Key 1 residues are purged and Key 2 is attempted.
- **Mode 3 (Graceful Fallback without Maps)**: If both keys fail or are empty:
  1. `notificarRechazoGlobal()` is executed.
  2. `retirarMapa('El mapa no está disponible ahora. Escribe tu dirección con el mayor detalle posible.')` is called.
  3. `#deliveryMapWrapper` is hidden (`hidden = true`).
  4. `#deliveryAddressSearch` is hidden (`hidden = true`).
  5. `faltaMarcarUbicacion({ mapaDisponible: false, coords: null })` evaluates to `false`, allowing the customer to confirm the order using standard text input + browser GPS without being blocked.
  6. Callback `alFallar: () => ui.requestUserLocation()` queries browser geolocation and Nominatim OpenStreetMap fallback.

### 5.2 Rule R7 Compliance Checklist
- [x] **Aislamiento e Idempotencia**: Function `limpiarResiduosGoogleMaps()` removes all `<script data-foodjet-maps="true">` elements, deletes `window.__foodjetMapsListo`, and resets `window.google = undefined`.
- [x] **Ventana de Gracia de Autenticación**: A 100ms timer (`setTimeout(..., 100)`) is observed after `__foodjetMapsListo` before resolving the promise, allowing asynchronous `window.gm_authFailure` to trigger and switch to the backup key cleanly.
- [x] **Degradación Elegante**: Uninterrupted checkout flow even if Google Maps API is completely down, rejected, or missing billing.
- [x] **Contratos de Configuración Retrocompatibles**: Endpoints accept scalar `googleMapsApiKey` and array `googleMapsApiKeys`.

---

## 6. Payment Methods & Dynamic Details

### 6.1 Payment Option Cards
Three canonical methods matching the backend enum:
1. `wallet` -> Billetera Digital (Yape / Plin) (`#payWallet`)
2. `card` -> Tarjeta de Crédito/Débito (`#payCard`)
3. `cash` -> Pago en Efectivo (`#payCash`)

In HTML/CSS, style these as 3 interactive option cards:
```html
<div class="row g-2 mb-3" id="paymentOptionsGrid">
    <div class="col-12 col-md-4 payment-option" data-payment="wallet">
        <input type="radio" class="btn-check" name="paymentMethod" id="payWallet" value="wallet">
        <label class="foodjet-payment-card" for="payWallet">
            <i class="bi bi-qr-code-scan foodjet-payment-card__icon"></i>
            <div class="foodjet-payment-card__title">Yape / Plin</div>
            <div class="foodjet-payment-card__subtitle">Escanea el QR</div>
        </label>
    </div>
    <div class="col-12 col-md-4 payment-option" data-payment="card">
        <input type="radio" class="btn-check" name="paymentMethod" id="payCard" value="card">
        <label class="foodjet-payment-card" for="payCard">
            <i class="bi bi-credit-card-2-front-fill foodjet-payment-card__icon"></i>
            <div class="foodjet-payment-card__title">Tarjeta</div>
            <div class="foodjet-payment-card__subtitle">Crédito o débito</div>
        </label>
    </div>
    <div class="col-12 col-md-4 payment-option" data-payment="cash">
        <input type="radio" class="btn-check" name="paymentMethod" id="payCash" value="cash" checked>
        <label class="foodjet-payment-card" for="payCash">
            <i class="bi bi-cash-stack foodjet-payment-card__icon"></i>
            <div class="foodjet-payment-card__title">Efectivo</div>
            <div class="foodjet-payment-card__subtitle">Paga al recibir</div>
        </label>
    </div>
</div>
```

### 6.2 Dynamic Card Drawer (`#cardDetails`)
- Only visible when `#payCard` is checked (`display: block;` vs `display: none;`).
- Input fields:
  - `#cardNumber`: Formatted in 4-digit blocks (`formatCardNumber`), max 19 chars.
  - `#cardExpiry`: Formatted as `MM/AA` (`formatExpiry`), max 5 chars.
  - `#cardCvc`: Filtered digits, max 4 chars.
- Real-time card brand detection via `detectBrand(number)`: shows Visa, Mastercard, or Amex icon in input or card header.
- Privacy assurance badge: `<p class="small text-muted"><i class="bi bi-shield-check text-success me-1"></i>Tus datos de tarjeta no se almacenan ni se envían a nuestros servidores.</p>`.

---

## 7. Coupon Validation & Order Summary Integration

### 7.1 Backend Coupon Definitions
As verified in `CheckoutScreen.kt`, `AGENTS.md`, and backend seed:
- `PruebaCupon` -> 10% discount (`id: 1, valor: 10, tipo: 'porcentaje'`)
- `FOODJET20` -> 20% discount (`id: 2, valor: 20, tipo: 'porcentaje'`)

### 7.2 Actionable Wiring Required for the Worker
Currently, `#couponCode`, `#applyCouponBtn`, and `#couponMessage` are in `frontend/index.html` but need event listener wiring in `frontend/js/app.js` and `frontend/js/ui.js`:
```javascript
// Worker Wiring Blueprint:
function setupCouponHandlers() {
    const applyBtn = document.getElementById('applyCouponBtn');
    const input = document.getElementById('couponCode');
    const message = document.getElementById('couponMessage');
    if (!applyBtn || !input) return;

    const CUPONES_VALIDOS = {
        'pruebacupon': { id: 1, codigo: 'PruebaCupon', valor: 10, tipo: 'porcentaje' },
        'foodjet20': { id: 2, codigo: 'FOODJET20', valor: 20, tipo: 'porcentaje' }
    };

    const handleApply = () => {
        const rawCode = input.value.trim().toLowerCase();
        if (!rawCode) {
            state.setActiveCoupon(null);
            if (message) {
                message.textContent = '';
                message.className = 'small mt-1';
            }
            ui.renderCheckoutSummary();
            return;
        }

        const cupon = CUPONES_VALIDOS[rawCode];
        if (cupon) {
            state.setActiveCoupon(cupon);
            if (message) {
                message.textContent = `Cupón '${cupon.codigo}' (${cupon.valor}%) aplicado`;
                message.className = 'small mt-1 text-success fw-bold';
            }
        } else {
            state.setActiveCoupon(null);
            if (message) {
                message.textContent = 'Código de cupón no válido';
                message.className = 'small mt-1 text-danger fw-bold';
            }
        }
        ui.renderCheckoutSummary();
    };

    applyBtn.addEventListener('click', handleApply);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
        }
    });
}
```

---

## 8. Preserved DOM Elements & Event Listeners Matrix

Every item in this matrix MUST be preserved verbatim in `frontend/index.html`, `frontend/js/ui.js`, and `frontend/js/app.js`.

| DOM ID | Element Tag | Purpose & Behavioral Contract | Consumers & Tests |
|---|---|---|---|
| `checkoutView` | `<section>` | Main checkout view container, toggled with `style.display`. | `ui.showView('checkoutView')`, tests |
| `backToMenuBtn` | `<button>` | Navigates back to home / opens cart. | `app.js` listener |
| `checkoutForm` | `<form>` | Form wrapping all checkout fields; triggers `handleCheckoutSubmit`. | `app.js` submit listener, E2E tests |
| `customerName` | `<input>` | Customer full name. Required, min 3 chars. | `ui.fillCheckoutUserData()`, validation |
| `customerPhone` | `<input>` | Contact telephone. Filtered digits, 9 chars. | `setupPhoneInput()`, `validation.js` |
| `customerPhoneError` | `<div>` | Invalid feedback container for telephone. | `setupPhoneInput()`, `validarTelefono()` |
| `customerAddress` | `<input>` | Delivery street address. | `mapaEntrega.js`, `resolveDeliveryAddressId()` |
| `deliveryAddressSearch` | `<button>` | Triggers forward geocoding on entered address. | `mapaEntrega.js` click listener |
| `deliveryMapWrapper` | `<div>` | Outer container for delivery map, hidden if no key. | `mapaEntrega.js`, `retirarMapa()` |
| `deliveryMap` | `<div>` | Google Maps canvas container (`role="application"`). | `mapaEntrega.js` `crearMapa()` |
| `deliveryMapLocate` | `<button>` | GPS locate button inside map canvas. | `mapaEntrega.js` click listener |
| `deliveryMapStatus` | `<div>` | Live status message container (`aria-live="polite"`). | `mapaEntrega.js` `mostrarEstado()` |
| `customerReference` | `<input>` | Optional reference field. | `resolveDeliveryAddressId()` |
| `payCash` | `<input type="radio">` | Payment method cash (`value="cash"`). | `payment-option`, E2E tests |
| `payCard` | `<input type="radio">` | Payment method card (`value="card"`). | `payment-option`, card drawer toggle |
| `payWallet` | `<input type="radio">` | Payment method digital wallet (`value="wallet"`). | `payment-option`, QR flow |
| `cardDetails` | `<div>` | Collapsible container for card inputs. | `app.js` radio change listener |
| `cardNumber` | `<input>` | Credit card number. Formatted in 4-digit blocks. | `payment.js`, `validateCard()` |
| `cardNumberError` | `<div>` | Card number validation error feedback. | `showCardErrors()`, `clearFieldError()` |
| `cardExpiry` | `<input>` | Expiration date MM/AA. | `payment.js`, `validateExpiry()` |
| `cardExpiryError` | `<div>` | Card expiry validation error feedback. | `showCardErrors()`, `clearFieldError()` |
| `cardCvc` | `<input>` | CVC (3-4 digits). | `payment.js`, `validateCvc()` |
| `cardCvcError` | `<div>` | Card CVC validation error feedback. | `showCardErrors()`, `clearFieldError()` |
| `checkoutItems` / `checkoutCartItems` | `<div>` | Container for rendering checkout cart item rows. | `ui.renderCheckoutCart()` |
| `couponCode` | `<input>` | Input field for coupon codes. | `state.setActiveCoupon()`, Worker task |
| `applyCouponBtn` | `<button>` | Action button to apply coupon. | Worker task |
| `couponMessage` | `<div>` | Status message for coupon result. | Worker task |
| `checkoutSubtotal` | `<span>` | Displays formatted subtotal (`S/ XX.XX`). | `ui.renderCheckoutCart()`, E2E tests |
| `checkoutDiscountRow` | `<div>` | Row for discount, displayed if discount > 0. | `ui.renderCheckoutCart()` |
| `checkoutDiscount` | `<span>` | Displays formatted discount (`-S/ XX.XX`). | `ui.renderCheckoutCart()` |
| `checkoutTaxes` / `checkoutTax` | `<span>` | Displays 18% IGV tax (`S/ XX.XX`). | `ui.renderCheckoutCart()` |
| `checkoutDelivery` / `checkoutDeliveryFee` | `<span>` | Displays delivery fee (`S/ 5.00`). | `ui.renderCheckoutCart()` |
| `checkoutTotal` | `<span>` | Displays grand total (`S/ XX.XX`). | `ui.renderCheckoutCart()` |
| `cardAuthModal` | `<div>` | Bank authentication simulation modal. | `ui.runCardAuthorization()` |
| `cardAuthBrand` | `<span>` | Displays detected card brand inside auth modal. | `ui.runCardAuthorization()` |
| `qrModal` | `<div>` | Digital wallet QR payment modal. | `app.js`, `processWalletPayment()` |
| `qrCodeContainer` | `<div>` | Displays restaurant QR image in modal. | `app.js` |
| `qrTotal` | `<span>` | Displays total inside QR modal. | `app.js` |
| `cancelQrBtn` / `qrCancelBtn` | `<button>` | Cancels pending QR payment. | `app.js` listener |
| `confirmQrPaymentBtn` | `<button>` | Confirms customer completed QR payment. | `app.js` listener |

---

## 9. Modern HTML Specification for `#checkoutView`

Here is the exact HTML structure blueprint recommended for the Worker:

```html
<section id="checkoutView" style="display: none;" aria-label="Finalizar pedido">
    <div class="container py-4 py-lg-5">
        <!-- Back Navigation & Title -->
        <div class="mb-4">
            <button class="btn btn-link text-decoration-none p-0 mb-3 foodjet-back-link" id="backToMenuBtn" type="button">
                <i class="bi bi-arrow-left me-1" aria-hidden="true"></i> Volver al carrito
            </button>
            <h1 class="display-6 fw-extrabold mb-1" id="checkoutPageTitle" style="color: var(--color-text-primary);">A un paso del antojo.</h1>
            <p class="text-secondary small mb-0">Confirma tus datos de entrega y elige cómo pagar.</p>
        </div>
        
        <form id="checkoutForm" novalidate>
            <div class="row g-4 align-items-start">
                <!-- Left Column: Delivery & Payment Details -->
                <div class="col-12 col-lg-7">
                    <!-- Card 1: Delivery Information -->
                    <div class="foodjet-card mb-4 p-4" id="deliveryAddressCard">
                        <div class="foodjet-section-header mb-4">
                            <span class="foodjet-icon-pill" aria-hidden="true">
                                <i class="bi bi-geo-alt-fill text-primary"></i>
                            </span>
                            <h2 class="h5 fw-bold mb-0">¿Dónde lo llevamos?</h2>
                        </div>

                        <!-- Customer Name -->
                        <div class="mb-3">
                            <label for="customerName" class="form-label fw-semibold small">
                                <i class="bi bi-person me-1 text-secondary" aria-hidden="true"></i>Nombre completo
                            </label>
                            <input type="text" class="form-control foodjet-input" id="customerName" 
                                   placeholder="Tu nombre y apellido" autocomplete="name" required>
                        </div>

                        <!-- Customer Phone -->
                        <div class="mb-3">
                            <label for="customerPhone" class="form-label fw-semibold small">
                                <i class="bi bi-telephone me-1 text-secondary" aria-hidden="true"></i>Teléfono de contacto (9 dígitos)
                            </label>
                            <input type="tel" class="form-control foodjet-input" id="customerPhone" placeholder="987654321"
                                   inputmode="numeric" autocomplete="tel" maxlength="9" pattern="\d{9}"
                                   title="Debe contener exactamente 9 dígitos numéricos"
                                   aria-describedby="customerPhoneError" required>
                            <div id="customerPhoneError" class="invalid-feedback"></div>
                        </div>

                        <!-- Saved Addresses Chips (Populated via JS if user has addresses) -->
                        <div id="savedAddressesContainer" class="mb-3" hidden>
                            <label class="form-label small text-secondary fw-semibold">Tus direcciones guardadas</label>
                            <div class="d-flex gap-2 overflow-x-auto pb-1" id="savedAddressesList" role="radiogroup" aria-label="Direcciones guardadas"></div>
                        </div>

                        <!-- Delivery Address -->
                        <div class="mb-3">
                            <label for="customerAddress" class="form-label fw-semibold small">
                                <i class="bi bi-geo-alt me-1 text-secondary" aria-hidden="true"></i>Dirección de entrega
                            </label>
                            <div class="input-group">
                                <input type="text" class="form-control foodjet-input" id="customerAddress"
                                       placeholder="Calle, número y distrito" autocomplete="street-address"
                                       aria-describedby="deliveryMapStatus" required>
                                <button type="button" class="btn btn-outline-secondary foodjet-input-action-btn" id="deliveryAddressSearch"
                                        aria-label="Buscar la dirección en el mapa" title="Buscar dirección en el mapa" hidden>
                                    <i class="bi bi-search" aria-hidden="true"></i>
                                </button>
                            </div>
                            
                            <!-- Interactive Map Canvas Container -->
                            <div class="mapa-entrega mt-3" id="deliveryMapWrapper" hidden>
                                <div id="deliveryMap" class="mapa-entrega__lienzo"
                                     role="application" aria-label="Mapa para marcar el punto de entrega"></div>
                                <div class="mapa-entrega__pin" aria-hidden="true">
                                    <i class="bi bi-geo-alt-fill"></i>
                                </div>
                                <button type="button" class="mapa-entrega__gps" id="deliveryMapLocate"
                                        aria-label="Usar mi ubicación actual" title="Usar mi ubicación actual">
                                    <i class="bi bi-crosshair"></i>
                                </button>
                            </div>
                            <div id="deliveryMapStatus" class="mapa-entrega__estado form-text mt-2" aria-live="polite"></div>
                        </div>

                        <!-- Delivery Reference -->
                        <div class="mb-0">
                            <label for="customerReference" class="form-label fw-semibold small text-secondary">Referencia (opcional)</label>
                            <input type="text" class="form-control foodjet-input" id="customerReference" 
                                   placeholder="Piso, dpto, timbre o color de reja">
                        </div>
                    </div>

                    <!-- Card 2: Payment Method Selection -->
                    <div class="foodjet-card p-4" id="paymentMethodCard">
                        <div class="foodjet-section-header mb-4">
                            <span class="foodjet-icon-pill" aria-hidden="true">
                                <i class="bi bi-credit-card-fill text-primary"></i>
                            </span>
                            <h2 class="h5 fw-bold mb-0">¿Cómo quieres pagar?</h2>
                        </div>
                        
                        <div class="row g-2 mb-3" id="paymentOptionsGrid" role="radiogroup" aria-label="Métodos de pago">
                            <!-- Yape / Plin -->
                            <div class="col-12 col-md-4 payment-option" data-payment="wallet">
                                <input type="radio" class="btn-check" name="paymentMethod" id="payWallet" value="wallet">
                                <label class="foodjet-payment-tile" for="payWallet">
                                    <i class="bi bi-qr-code-scan foodjet-payment-tile__icon" aria-hidden="true"></i>
                                    <span class="foodjet-payment-tile__title">Yape / Plin</span>
                                    <span class="foodjet-payment-tile__subtitle">Escanea el QR</span>
                                </label>
                            </div>

                            <!-- Tarjeta -->
                            <div class="col-12 col-md-4 payment-option" data-payment="card">
                                <input type="radio" class="btn-check" name="paymentMethod" id="payCard" value="card">
                                <label class="foodjet-payment-tile" for="payCard">
                                    <i class="bi bi-credit-card-2-front-fill foodjet-payment-tile__icon" aria-hidden="true"></i>
                                    <span class="foodjet-payment-tile__title">Tarjeta</span>
                                    <span class="foodjet-payment-tile__subtitle">Crédito o débito</span>
                                </label>
                            </div>

                            <!-- Efectivo -->
                            <div class="col-12 col-md-4 payment-option" data-payment="cash">
                                <input type="radio" class="btn-check" name="paymentMethod" id="payCash" value="cash" checked>
                                <label class="foodjet-payment-tile" for="payCash">
                                    <i class="bi bi-cash-stack foodjet-payment-tile__icon" aria-hidden="true"></i>
                                    <span class="foodjet-payment-tile__title">Efectivo</span>
                                    <span class="foodjet-payment-tile__subtitle">Paga al recibir</span>
                                </label>
                            </div>
                        </div>

                        <!-- Card Details Drawer -->
                        <div id="cardDetails" class="mt-3 p-3 rounded-3 bg-light border" style="display: none;">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <span class="fw-bold small text-secondary">Datos de la tarjeta</span>
                                <div class="d-flex gap-1" id="cardBrandIcons">
                                    <i class="bi bi-credit-card fs-5 text-muted" id="detectedBrandIcon"></i>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="cardNumber" class="form-label small fw-semibold">Número de tarjeta</label>
                                <input type="text" class="form-control foodjet-input" id="cardNumber"
                                       placeholder="1234 5678 9012 3456" maxlength="19"
                                       inputmode="numeric" autocomplete="cc-number"
                                       aria-describedby="cardNumberError">
                                <div class="invalid-feedback" id="cardNumberError"></div>
                            </div>

                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <label for="cardExpiry" class="form-label small fw-semibold">Vencimiento</label>
                                    <input type="text" class="form-control foodjet-input" id="cardExpiry"
                                           placeholder="MM/AA" maxlength="5"
                                           inputmode="numeric" autocomplete="cc-exp"
                                           aria-describedby="cardExpiryError">
                                    <div class="invalid-feedback" id="cardExpiryError"></div>
                                </div>
                                <div class="col-6">
                                    <label for="cardCvc" class="form-label small fw-semibold">CVC / CVV</label>
                                    <input type="text" class="form-control foodjet-input" id="cardCvc"
                                           placeholder="123" maxlength="4"
                                           inputmode="numeric" autocomplete="cc-csc"
                                           aria-describedby="cardCvcError">
                                    <div class="invalid-feedback" id="cardCvcError"></div>
                                </div>
                            </div>

                            <p class="small text-muted mb-0 d-flex align-items-center gap-1">
                                <i class="bi bi-shield-lock-fill text-success" aria-hidden="true"></i>
                                Los datos de tu tarjeta no se almacenan ni se envían a nuestros servidores.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Order Summary (Sticky Desktop / Static Mobile) -->
                <div class="col-12 col-lg-5">
                    <div class="foodjet-card p-4 checkout-summary-sticky" id="checkoutSummaryCard">
                        <div class="foodjet-section-header mb-3">
                            <span class="foodjet-icon-pill" aria-hidden="true">
                                <i class="bi bi-bag-check-fill text-primary"></i>
                            </span>
                            <h2 class="h5 fw-bold mb-0">Tu pedido</h2>
                        </div>

                        <!-- Items Container -->
                        <div id="checkoutCartItems" class="checkout-items-list mb-3">
                            <!-- Populated dynamically via ui.renderCheckoutCart() -->
                        </div>

                        <!-- Fallback ID for backward-compatibility -->
                        <div id="checkoutItems" hidden></div>

                        <!-- Coupon Code -->
                        <div class="mb-3 pt-3 border-top">
                            <label for="couponCode" class="form-label small fw-semibold text-secondary">¿Tienes un cupón?</label>
                            <div class="input-group">
                                <input type="text" class="form-control foodjet-input" id="couponCode" 
                                       placeholder="Ejem: PruebaCupon" autocomplete="off">
                                <button class="btn btn-outline-primary fw-semibold px-3" type="button" id="applyCouponBtn">
                                    Aplicar
                                </button>
                            </div>
                            <div id="couponMessage" class="small mt-1" role="status" aria-live="polite"></div>
                        </div>

                        <!-- Financial Breakdown -->
                        <div class="finance-breakdown pt-2 border-top">
                            <div class="d-flex justify-content-between mb-2 small text-secondary">
                                <span>Subtotal</span>
                                <span id="checkoutSubtotal" class="fw-semibold text-dark">S/ 0.00</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2 small text-success" id="checkoutDiscountRow" style="display: none !important;">
                                <span><i class="bi bi-tag-fill me-1" aria-hidden="true"></i>Descuento</span>
                                <span id="checkoutDiscount" class="fw-bold">-S/ 0.00</span>
                            </div>
                            <div class="d-flex justify-content-between mb-2 small text-secondary">
                                <span>Impuestos (18% IGV)</span>
                                <span id="checkoutTaxes" class="fw-semibold text-dark">S/ 0.00</span>
                            </div>
                            <!-- Fallback ID -->
                            <span id="checkoutTax" hidden></span>

                            <div class="d-flex justify-content-between mb-3 small text-secondary">
                                <span>Costo de envío</span>
                                <span id="checkoutDelivery" class="fw-semibold text-dark">S/ 5.00</span>
                            </div>
                            <!-- Fallback ID -->
                            <span id="checkoutDeliveryFee" hidden></span>

                            <hr class="my-3">

                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <span class="h5 fw-bold mb-0">Total a Pagar</span>
                                <span class="h3 fw-extrabold mb-0 text-primary" id="checkoutTotal">S/ 0.00</span>
                            </div>
                            <p class="small text-muted mb-4" style="font-size: 0.75rem;">
                                El servidor confirma el importe final al registrar el pedido.
                            </p>

                            <!-- Confirm Order Submit Button -->
                            <button type="submit" class="btn btn-primary foodjet-btn-primary w-100 py-3 fw-bold fs-5 shadow-sm" id="confirmOrderBtn">
                                Confirmar Pedido
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</section>
```

---

## 10. CSS Token & Component Specifications

Add or enhance the following CSS rules in `frontend/styles.css`:

```css
/* ==========================================================================
   Checkout View Responsive Layout & Modern Components
   ========================================================================== */

/* Section header icon pill */
.foodjet-icon-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-circle);
    background-color: var(--color-primary-light);
    flex-shrink: 0;
}

.foodjet-back-link {
    color: var(--color-text-secondary);
    font-weight: 600;
    font-size: 0.95rem;
    transition: color var(--transition-fast);
}

.foodjet-back-link:hover {
    color: var(--color-primary-dark);
}

/* Sticky behavior for desktop */
@media (min-width: 992px) {
    .checkout-summary-sticky {
        position: sticky;
        top: 96px;
        z-index: 10;
    }
}

/* Mobile single column without obstructions */
@media (max-width: 991.98px) {
    .checkout-summary-sticky {
        position: static !important;
        top: auto !important;
    }
}

/* Payment option tiles */
.foodjet-payment-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-surface);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: center;
    min-height: 90px;
    user-select: none;
}

.foodjet-payment-tile:hover {
    background-color: var(--color-background);
    border-color: var(--color-text-muted);
}

.foodjet-payment-tile__icon {
    font-size: 1.5rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.25rem;
    transition: color var(--transition-fast);
}

.foodjet-payment-tile__title {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--color-text-primary);
}

.foodjet-payment-tile__subtitle {
    font-size: 0.72rem;
    color: var(--color-text-secondary);
}

/* Active Payment Tile */
.btn-check:checked + .foodjet-payment-tile {
    background-color: var(--color-primary-light);
    border-color: var(--color-primary);
    border-width: 2px;
}

.btn-check:checked + .foodjet-payment-tile .foodjet-payment-tile__icon {
    color: var(--color-primary);
}

.btn-check:focus-visible + .foodjet-payment-tile {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

/* Saved addresses chip scroll */
.saved-address-chip {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    background-color: var(--color-surface);
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-text-primary);
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--transition-fast);
}

.saved-address-chip:hover,
.saved-address-chip--selected {
    background-color: var(--color-primary-light);
    border-color: var(--color-primary);
    color: var(--color-primary-dark);
}

/* Delivery map container */
.mapa-entrega {
    position: relative;
    height: 280px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    background-color: var(--color-surface-muted, #f0f0f0);
}

@media (max-width: 575.98px) {
    .mapa-entrega {
        height: 240px;
    }
}
```

---

## 11. Concrete Action Steps for Worker M3-1

When implementing, the Worker agent must follow these discrete, verifiable steps:
1. **Preserve All DOM IDs**: Ensure all 33 preserved DOM IDs listed in Section 8 are retained without alterations.
2. **Update HTML in `frontend/index.html`**: Replace `#checkoutView` markup with the modernized structure in Section 9.
3. **Enhance CSS in `frontend/styles.css`**: Append the responsive layout, payment tiles, and design token classes from Section 10.
4. **Wire Coupon Handlers in `frontend/js/app.js`**: Implement `setupCouponHandlers()` with `PruebaCupon` (10%) and `FOODJET20` (20%), updating `#couponMessage` and triggering `ui.renderCheckoutSummary()`.
5. **Populate Saved Addresses**: In `ui.fillCheckoutUserData()`, check if `window.currentUser` addresses exist, populate `#savedAddressesList`, and toggle `#savedAddressesContainer` visibility.
6. **Verify Non-Regression**: Run `npm test` and `node --test tests/unit/e2e_acceptance_tiers.test.mjs` ensuring 100% pass across all 131 Cucumber scenarios and 68 Tier test cases.
