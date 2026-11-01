# Technical Specification & Gap Analysis Report: Shopping Cart (R2) & Checkout (R3)

**Author**: `teamwork_spec_miner` (`explorer_survey_figma_2`)  
**Date**: 2026-10-31  
**Target Project**: FoodJet Web (`c:\Users\ORLANDO\Desktop\Pagina-Foodjet`)  
**Scope**:  
- **R2**: Conservación y afinamiento del carrito de compras (Figma frame: `Shopping cart - Desktop`)  
- **R3**: Checkout fiel al frame web con lógica existente (Figma frame: `Checkout - Desktop`)  

---

## 1. Executive Summary

This specification report defines the authoritative visual, structural, and behavioral contracts required to bring the **Shopping Cart** and **Checkout** views of the FoodJet Web frontend into pixel-accurate alignment with the Figma Desktop designs (`Shopping cart - Desktop` and `Checkout - Desktop`), while strictly preserving:
1. **Single Restaurant Rule** (`state.addToCart` returning `DIFFERENT_RESTAURANT` and prompt modal `#restaurantChangeModal`).
2. **Student Discount System** (`user.es_estudiante`, `product.descuento_estudiante`, visual badge, student savings calculations).
3. **Discount Coupon Engine** (case-insensitive `validateCoupon`, `CUPONES_SOPORTADOS`, coupon state sync, linear breakdown).
4. **Delivery Location Flow** (compact saved address card with "Editar" toggle, fallback geocoding, Google Maps cascading keys, and OSRM integration).
5. **In-Place Digital Wallet (QR)** (in-place QR container inside payment card, timer, confirmation button "Ya pagué", no popup modal, no premature confirmations, and duplicate order prevention).
6. **Backend Financial Reconciliation** (100% mathematical alignment with `backend/src/controllers/orderController.js` where `total = subtotalConDescuento + 18% IGV + S/ 5.00`).
7. **Complete DOM Contract & Test Suite Integrity** (preserving all 50+ existing DOM IDs and ensuring all 86 frontend + 45 backend cucumber scenarios continue to pass).

---

## 2. Authoritative Visual & Implementation Comparison

### 2.1 Shopping Cart: Figma (`03-figma-cart.png`) vs Current Web (`08-web-cart.png`, `index.html`, `ui.js`)

| Component | Figma Frame (`03-figma-cart.png`) | Current Web (`08-web-cart.png` & `index.html`) | Gap / Required Alignment |
|---|---|---|---|
| **Container & Canvas** | Slide-out offcanvas drawer on desktop (~420px width), light background (`#FFFFFF` surface), subtle border (`#E6E4DC`). | Bootstrap offcanvas `#cartOffcanvas`, width 400px, previously styled in dark theme (`#121212`). | Ensure light-theme fidelity on desktop, padding `1.5rem`, border-radius, and consistent shadow. |
| **Header** | Bold title "Tu carrito" (22px), subtitle below title: `"3 productos · 2 antojos"` (or dynamic `${count} productos`), clean '✕' close button. | Title with primary bag icon `<i class="bi bi-bag-check-fill"></i>Tu carrito` + badge `#cartItemCount`. Missing the subtitle. | Add subtitle `<p class="cart-header-subtitle text-muted small mb-0" id="cartHeaderSubtitle">` below title; align close button. |
| **Restaurant Info Card** | Coral/orange square icon with fork/knife; Restaurant Name "FOODJET Kitchen"; subtitle "Miraflores · Preparado al momento"; Mint green pill with clock icon: `"En tu puerta en 25–35 min"`. | `#cartRestaurantBanner` with dark box, restaurant name, red store icon, subtitle "Preparado al momento", "Vaciar" trash button, and bike icon for time. | Update card styling to match Figma: coral icon pill, clean hierarchy, mint pill for delivery time; retain `#clearCartBtn` as accessible action. |
| **Item List & Density** | Rounded square thumbnails (~60x60px), item title bold (15px), subtext/ingredients muted (12-13px), inline quantity controls `- 2 +` directly beneath subtext, bold line total on right (`S/ 37.80`). | Thumbnail on left, title with student badge, subtext price, trash icon next to price, pill quantity controls below price. | Move quantity controls inline/left-aligned beneath item title; place line total right-aligned. Maintain `.minus-btn`, `.plus-btn`, `.remove-item-btn` with `data-id`. |
| **"Agregar más antojos"** | Distinct text link with plus icon: `+ Agregar más antojos` (orange text, clickable) placed below items list to dismiss cart. | Missing when cart has items (only empty cart has "Explorar el menú"). | Add text link `<button type="button" class="btn btn-link foodjet-add-more-link" id="cartAddMoreBtn" data-bs-dismiss="offcanvas">+ Agregar más antojos</button>`. |
| **Coupon in Cart** | Section "¿Tienes un cupón?" with input, badge "Aplicado" / button "Aplicar", and green feedback: `"🎉 ¡Buenazo! Ahorraste S/ 5.00"`. | Coupon input only existed in Checkout view (`#checkoutView`). | Include coupon block in cart offcanvas; synchronize coupon state with checkout via `state.getActiveCoupon()`. |
| **Financial Breakdown** | Subtotal (`S/ 46.70`), Costo de envío (`S/ 4.90`), Descuento cupón (`- S/ 5.00`), divider, Total a pagar (`S/ 46.60`). | Subtotal estimado (`S/ 6.50`), Ahorro estudiante (`-S/ 0.65`), Total (`S/ 5.85`), note "El envío, IGV y cupones se calculan al pagar." | Reconcile breakdown so the CTA does NOT promise an incomplete subtotal. Add shipping (S/ 5.00) & IGV (18%) to cart breakdown OR label cart total clearly as "Subtotal de productos". |
| **Delivery Teaser** | Mini-card with location pin: "Av. Larco 812, Miraflores", subtext "Casa · Dpto. 402", chevron `>`. | Not present in cart offcanvas. | Add compact delivery address preview in cart footer if address is known. |
| **Primary CTA Button** | Full-width orange pill button: `"Ir a pagar · S/ 46.60 →"`. Footer note: `"🔒 Pago seguro. Antojos garantizados."` | Full-width button: `"Proceder al pago →"` without price. | Update label to `"Ir a pagar · S/ [Total] →"` (or `"Ir a pagar →"`), keeping `#checkoutBtn` ID intact. |

---

### 2.2 Checkout: Figma (`04-figma-checkout.png`) vs Current Web (`09-web-checkout.png`, `10-web-wallet.png`, `index.html`, `ui.js`)

| Component | Figma Frame (`04-figma-checkout.png`) | Current Web (`09-web-checkout.png`, `10-web-wallet.png`) | Gap / Required Alignment |
|---|---|---|---|
| **Top Navigation & Steps** | Back button "← Volver al carrito" (`#backToMenuBtn`); Breadcrumb / Steps indicator: `"✓ Carrito — 02 Pago — 03 A disfrutar"`. | Only `#backToMenuBtn` ("Volver al carrito"). Missing steps indicator. | Add accessible steps indicator component on top right of checkout header. |
| **Page Title & Subtitle** | Display title: `"A un paso del antojo."` (bold H1, 28-32px), subtitle: `"Confirma tus datos y elige cómo pagar."` | Has `#checkoutPageTitle` and subtitle. | Ensure typography, color (`var(--color-text-primary)`), and spacing match frame. |
| **Two-Column Proportions** | Left Column (~62-65% width): Delivery Info & Payment Methods. Right Column (~35-38% width): Sticky Summary Card. | Grid has `col-12 col-lg-7` and `col-12 col-lg-5`. | Retain `col-lg-7` / `col-lg-5` with sticky sidebar (`top: 96px`) on desktop. |
| **Card 1: Delivery Info (Saved Data)** | Compact summary card: Header `"¿Dónde lo llevamos?"` with **"Editar"** button in top-right. Body: Bold address `"Casa · Av. Larco 812"`, subtext `"Dpto. 402, Miraflores, Lima"`, recipient `"Valeria Torres · +51 987 654 321"`, reference note `"Tocar el timbre del dpto. 402"`, delivery time `"Entrega estimada: 25–35 min"`. | Always renders all input fields openly: Name, Phone, Address Chips, Address Input, Google Maps, Reference. | Implement the **Compact Summary Card with "Editar" button**. When clicking "Editar", reveal the full editing form (Name, Phone, Chips, Address, Map, GPS button, Reference). If no address saved, default to open form. |
| **Card 2: Payment Methods** | 3 horizontal tiles in a grid: `Yape / Plin` (Escanea el QR), `Tarjeta` (Crédito o débito), `Efectivo` (Paga al recibir). Selected tile has orange border and radio check. | Has `.payment-options-grid` with `#paymentWallet`, `#paymentCard`, `#paymentCash`. | Keep grid; ensure active tile styling matches Figma (`var(--color-primary)` border, light orange container). |
| **Digital Wallet (In-Place QR)** | **INTEGRATED IN-PLACE inside the payment card** (no popup modal!). Container with header `"Paga con Yape o Plin"` & timer `"⏱ 04:59"`; Left: QR code image; Right: Amount (`S/ 46.60`), Merchant (`FOODJET Kitchen · #FJ-2048`), Instructions, Brand pills (`yape`, `plin`); Footnote: `"ℹ️ Después de pagar, toca 'Ya pagué' para verificar tu pedido."` | Previously opened `#qrModal` modal with 5-second auto-submit! In card it only showed a placeholder text box ("Al confirmar tu pedido, se abrirá el código QR..."). | **Eliminate popup modal dependency for checkout.** Embed the QR block directly into `#paymentWalletInfo` in-place. Display countdown timer, restaurant QR (`restaurante.qr_pago`), and instructions. Set CTA button text to `"Ya pagué · S/ [Total] →"`. Ensure submission occurs ONLY when clicking "Ya pagué". |
| **Summary Card (Right Column)** | Card `"Tu pedido"`, subtext `"FOODJET Kitchen · 3 productos"`, compact items list, green coupon pill (`"🏷️ CAMPUS5 aplicado · Ahorras S/ 5.00"`), breakdown, primary CTA button (`"Ya pagué · S/ 46.60 →"` or `"Confirmar pedido · S/ 46.60 →"`), terms footnote, help link. | Items list `#checkoutCartItems`, coupon input `#couponCode`, breakdown rows, submit button `#confirmOrderBtn`. | Format summary card matching Figma: compact items with quantities, green coupon pill when active, exact mathematical breakdown, dynamic button text. |

---

## 3. Mathematical Breakdown Reconciliation with Backend

### 3.1 Authoritative Backend Logic (`backend/src/controllers/orderController.js`)

In the backend controller (`createOrder`), the financial calculation follows these exact equations:

$$P'_i = \begin{cases} P_i \times (1 - \frac{D_{est, i}}{100}) & \text{if } user.es\_estudiante \text{ and } D_{est, i} > 0 \\ P_i & \text{otherwise} \end{cases}$$

$$Subtotal = \sum_{i=1}^n (P'_i \times Q_i)$$

$$Descuento_{cupon} = \begin{cases} Subtotal \times \frac{Porcentaje_{cupon}}{100} & \text{if coupon active} \\ 0 & \text{otherwise} \end{cases}$$

$$SubtotalConDescuento = Subtotal - Descuento_{cupon}$$

$$Impuestos = SubtotalConDescuento \times 0.18 \quad (18\% \text{ IGV})$$

$$CostoEnvio = 5.00 \quad (\text{Tarifa fija})$$

$$Total = SubtotalConDescuento + Impuestos + CostoEnvio$$

### 3.2 Frontend Breakdown Reconciliation

To eliminate user confusion (such as displaying a pre-discounted subtotal and then subtracting the discount a second time), the frontend breakdown must display:

```
Subtotal productos:          S/ [SubtotalRegular]
Descuento estudiante:       -S/ [AhorroEstudiante]       (displayed only if isStudent && Ahorro > 0)
Descuento cupón ([Rate]%):   -S/ [DescuentoCupon]         (displayed only if coupon active)
Costo de envío:              S/ 5.00
Impuestos (18% IGV):         S/ [Impuestos]
─────────────────────────────────────────────────
Total a pagar:               S/ [Total]
```

#### Numerical Verification Example 1 (Regular User, No Coupon):
- 2x Combo Smash @ S/ 18.90 = S/ 37.80
- 1x Papas criminales @ S/ 8.90 = S/ 8.90
- **Subtotal productos**: S/ 46.70
- **Descuento estudiante**: (None)
- **Descuento cupón**: (None)
- **Costo de envío**: S/ 5.00
- **Impuestos (18% IGV)**: $46.70 \times 0.18 =$ **S/ 8.41**
- **Total a pagar**: $46.70 + 8.41 + 5.00 =$ **S/ 60.11**
- *Linear check*: $46.70 + 5.00 + 8.41 = 60.11$. Matches backend to the centavo.

#### Numerical Verification Example 2 (Student User + 10% Coupon 'PruebaCupon'):
- 1x Nuggets de Pollo (Regular S/ 6.50, Student -10% => S/ 5.85)
- **Subtotal productos (precios regulares)**: S/ 6.50
- **Descuento estudiante**: -S/ 0.65
- *(Subtotal efectivo = S/ 5.85)*
- **Descuento cupón (10%)**: -S/ 0.585 -> -S/ 0.59
- *(Subtotal con descuento = S/ 5.265)*
- **Impuestos (18% IGV)**: $5.265 \times 0.18 =$ **S/ 0.95**
- **Costo de envío**: S/ 5.00
- **Total a pagar**: $5.265 + 0.948 + 5.00 =$ **S/ 11.21**
- *Linear check*: $6.50 - 0.65 - 0.59 + 5.00 + 0.95 = 11.21$. Matches backend to the centavo.

---

## 4. Delivery Address: Compact Summary & "Editar" Interaction Flow

### 4.1 State Machine for Delivery Card
1. **Initial State Determination** (`fillCheckoutUserData`):
   - Query user saved addresses via `api.fetchMyAddressesAPI(authToken)`.
   - **Case A: Saved address exists**:
     - Pre-populate `#customerName`, `#customerPhone`, `#customerAddress`, `#customerReference`.
     - Render the **Compact Summary Card** (`#deliverySummaryCard`) visible, hiding the form container (`#deliveryFormContainer`).
     - Display bold address, contact info, reference, and delivery estimate ("Entrega estimada: 25–35 min").
     - Top right shows "Editar" button (`#editDeliveryBtn`).
   - **Case B: No saved address**:
     - Render the **Full Form Container** (`#deliveryFormContainer`) directly visible, hiding `#deliverySummaryCard`.
     - Show search input, address input, and Google Maps canvas with pin.
2. **"Editar" Action**:
   - User clicks `#editDeliveryBtn`.
   - `#deliverySummaryCard` collapses (`display: none` or hidden).
   - `#deliveryFormContainer` expands smoothly (`display: block`).
   - Interactive map is refreshed/resized via `google.maps.event.trigger(map, 'resize')` if available.
   - Shows action button: "Guardar dirección" / "Listo" (`#saveDeliveryEditBtn`) to validate and collapse back to the compact card.
3. **Preservation of Inputs & Validations**:
   - Inputs `#customerName`, `#customerPhone`, `#customerAddress`, `#customerReference` MUST remain in the DOM so that `document.getElementById` calls and form submission validation function without modification.
   - Map elements `#deliveryMapWrapper`, `#deliveryMap`, `#deliveryMapLocate`, `#deliveryMapStatus` are contained within `#deliveryFormContainer`.

---

## 5. In-Place Digital Wallet (QR) Architecture & Semantics

### 5.1 Elimination of Popup Modal & In-Place Presentation
In previous versions, clicking checkout with "wallet" triggered `openQRModal()`, displaying a modal dialog (`#qrModal`) with a 5-second countdown timer that automatically submitted the order.
**Figma Desktop Frame Specifications**:
1. **No Modal Dialog**: The QR code and instructions are displayed **in-place** inside `#paymentWalletInfo` under the payment selection grid.
2. **In-Place QR Frame**:
   - Header: "Paga con Yape o Plin" and timer `"⏱ 04:59"` (`#qrTimerText`).
   - Image: Square image tag `#qrPaymentImage` loaded from `restaurante.qr_pago`.
   - Payment Details: Formatted amount `#walletAmountDisplay`, restaurant name `#qrRestaurantName`, and instructions.
   - Information notice: `"ℹ️ Después de pagar, toca 'Ya pagué' para verificar tu pedido."`
3. **Button Semantics**:
   - When digital wallet is selected, the primary submit button in the summary card (`#confirmOrderBtn`) updates its text to:
     `Ya pagué · S/ [Total] →`
4. **Order Submission Flow**:
   - The user must explicitly click `"Ya pagué"` (`#confirmOrderBtn`).
   - Order submission does NOT occur automatically upon opening the view or switching radio buttons.
   - `handleCheckoutSubmit` executes validation (phone, address, cart empty check).
   - `isSubmittingOrder` lock is activated to prevent duplicate order submissions.
   - If user changes payment method to Card or Cash, any active QR countdown interval is stopped and cleaned up (`clearInterval`).

---

## 6. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Cart (R2) | Offcanvas Desktop Frame | Slide-out right panel (~420px) displaying cart items and summary | `#cartBtn` click | `#cartOffcanvas` shown | Ignores if disabled | Figma `03-figma-cart.png` |
| 2 | Cart (R2) | Dynamic Header Subtitle | Displays product and item count summary | Cart state (`cart`) | `"[N] productos · [M] antojos"` | Shows "0 productos" when empty | Figma `03-figma-cart.png` |
| 3 | Cart (R2) | Active Restaurant Banner | Shows restaurant name, logo, and preparation / delivery time pill | `getCartRestaurant` | Formatted restaurant banner | Hidden when cart is empty | `03-figma-cart.png`, `ui.js:743` |
| 4 | Cart (R2) | Inline Quantity Controls | Plus and minus controls to adjust quantity per item | `.plus-btn`, `.minus-btn` | Updated cart item count and totals | Removes item if qty drops to 0 | `ui.js:819`, `state.js:60` |
| 5 | Cart (R2) | Single Restaurant Enforcement | Restricts cart to products from a single restaurant | `state.addToCart(id)` | `{ success: false, error: 'DIFFERENT_RESTAURANT' }` | Triggers `#restaurantChangeModal` | `state.js:50`, `carrito.feature:17` |
| 6 | Cart (R2) | Restaurant Change Modal | Prompts user before clearing cart to switch restaurant | `#restaurantChangeConfirmBtn` | Clears cart and adds new product | Reverts on cancel | `ui.js:214`, `index.html:1022` |
| 7 | Cart (R2) | "+ Agregar más antojos" | Link below items to dismiss cart and return to catalog | `#cartAddMoreBtn` click | Offcanvas hides, catalog in view | None | Figma `03-figma-cart.png` |
| 8 | Cart (R2) | Coupon Input in Cart | Allows entering and applying coupon directly in cart | `#couponCode` input, `#applyCouponBtn` | Active coupon set, discount calculated | Shows inline error message | Figma `03-figma-cart.png` |
| 9 | Cart (R2) | Subtotal vs Total Labeling | Unambiguous labeling preventing CTA misleading price | Cart items, discounts, shipping, tax | Clear "Subtotal de productos" or full total | CTA does not promise incomplete total | `ORIGINAL_REQUEST.md:20` |
| 10 | Checkout (R3) | Two-Column Desktop Layout | Asymmetric grid with 65% left column and 35% sticky summary | Screen width >= 992px | Two-column sticky layout | Stacks vertically on mobile | Figma `04-figma-checkout.png` |
| 11 | Checkout (R3) | Steps Indicator | Header breadcrumb: "✓ Carrito — 02 Pago — 03 A disfrutar" | Current view route | Visual step indicator | None (static status) | Figma `04-figma-checkout.png` |
| 12 | Checkout (R3) | Compact Delivery Summary Card | Displays saved address, recipient, phone, and reference | Saved address from API | Compact delivery summary card | Defaults to open form if none | Figma `04-figma-checkout.png` |
| 13 | Checkout (R3) | "Editar" Delivery Action | Toggles between compact summary and full editing form | `#editDeliveryBtn` click | Reveals full form, map, and GPS | Form validates on save | Figma `04-figma-checkout.png` |
| 14 | Checkout (R3) | Interactive Delivery Map | Google Map with fixed pin and pan navigation for exact location | Pan/drag, GPS locate button | Updated coordinates & address | Falls back to manual text if rejected | `mapaEntrega.js`, `04-figma-checkout` |
| 15 | Checkout (R3) | Phone Number Sanitization | Filters input to exactly 9 digits in real time | `#customerPhone` typing | Only digits permitted, max 9 | Adds `.is-invalid` on submit if `<9` | `app.js:401`, `validacion_telefono.feature` |
| 16 | Checkout (R3) | Horizontal Payment Selector | Grid of 3 tiles: Yape/Plin, Tarjeta, Efectivo | Radio `input[name="paymentMethod"]` | Highlights tile, switches drawer | None | Figma `04-figma-checkout.png` |
| 17 | Checkout (R3) | In-Place QR Wallet Block | Displays restaurant QR in-place inside payment zone | `metodo_pago === 'wallet'` | In-place QR, timer, merchant info | Reverts on changing payment method | Figma `04-figma-checkout.png` |
| 18 | Checkout (R3) | "Ya pagué" Confirmation Semantics | Submit button verifies payment and registers order | `#confirmOrderBtn` click | Calls `api.createOrderAPI` | Blocks duplicate clicks with lock | `ORIGINAL_REQUEST.md:23` |
| 19 | Checkout (R3) | Card Input & Bank Auth Sim | Formats card inputs and simulates 2.5s bank authorization | Card details form | Calls `#cardAuthModal` then submits | Shows inline errors for invalid fields | `app.js:574`, `pago_tarjeta.feature` |
| 20 | Checkout (R3) | Reconciled Financial Summary | Summary breakdown matching backend formula | Subtotal, discounts, shipping, tax | Linear breakdown summing to Total | No mismatch between UI and server | `orderController.js:97` |

---

## 7. Edge Cases & Observed Behavior

| # | Feature | Input / Condition | Observed & Specified Behavior |
|---|---|---|---|
| 1 | Cart Offcanvas | Cart is completely empty (`state.isCartEmpty() === true`) | `#emptyCart` is visible with "Explorar el menú" button. `#cartFooter` and `#cartRestaurantBanner` are hidden (`display: none`). `#cartTotal` is `S/ 0.00`. `#checkoutBtn` is disabled (`disabled = true`). Badge `#cartCount` is hidden. |
| 2 | Cart Offcanvas | User clicks `+ Agregar más antojos` | Offcanvas closes smoothly (`data-bs-dismiss="offcanvas"`), scroll position restored to catalog, focus returned to triggering element. |
| 3 | Single Restaurant Rule | User attempts to add product from Restaurant B while cart has product from Restaurant A | `state.addToCart(id)` returns `{ success: false, error: 'DIFFERENT_RESTAURANT' }`. UI opens `#restaurantChangeModal`. Cart items remain untouched. If user clicks "Conservar", modal closes with no change. If user clicks "Vaciar y agregar", cart is cleared, new product added, and offcanvas re-opens. |
| 4 | Student Discount | Student user logs in (`user.es_estudiante: true`) with discounted product | Product price is reduced by `product.descuento_estudiante%`. Cart item displays student badge. `#cartStudentSavingsRow` / `#studentDiscountRow` is displayed with negative amount `-S/ XX.XX`. |
| 5 | Student Discount | Non-student user views discounted product | Regular price is charged. No student badge or negative student discount row is displayed. Subtotal equals catalog price. |
| 6 | Coupon Engine | User enters coupon in lowercase (`pruebacupon`) or with whitespace | `validateCoupon` trims and normalizes to lowercase. Correctly resolves `{ id: 1, codigo: 'PruebaCupon', porcentaje: 10.0 }`. Input is marked `.is-valid` and disabled. `#removeCouponBtn` is displayed. |
| 7 | Coupon Engine | User enters invalid coupon code (`DESCUENTO100`) | `validateCoupon` returns `{ valid: false, error: 'Código de cupón no válido.' }`. Input is marked `.is-invalid`. `#couponMessage` shows warning. Totals remain untouched. |
| 8 | Coupon Engine | User removes applied coupon (`#removeCouponBtn`) | `state.setActiveCoupon(null)`. Input is re-enabled, cleared, and validated marks removed. Breakdown recalculates without coupon discount. |
| 9 | Delivery Location | Google Maps API key rejected (`gm_authFailure` or invalid key) | Cascading loader catches failure, falls back to secondary key. If both fail, `retirarMapa` is called: map wrapper is hidden, manual address input remains active, and browser GPS / reverse geocoding is used without blocking checkout. |
| 10 | Delivery Location | User has saved address and clicks "Editar" | `#deliverySummaryCard` hides; `#deliveryFormContainer` expands. Form fields and map are populated with saved coordinates. User can edit address or move map pin. Validations enforce presence of address and coordinates. |
| 11 | Digital Wallet QR | User chooses "Yape / Plin" when restaurant lacks QR (`restaurante.qr_pago === null`) | UI aborts wallet payment and shows toast: `"No se encontró el QR de pago para este restaurante"`. In-place QR is not displayed. Submit button remains disabled or in error state. |
| 12 | Digital Wallet QR | User clicks "Ya pagué" multiple times rapidly | `isSubmittingOrder` flag is set to `true` on first click; button is disabled and shows spinner `#confirmOrderSpinner`. Subsequent clicks are ignored, preventing duplicate orders. |
| 13 | Digital Wallet QR | User switches payment method while QR is active | Event listener on `input[name="paymentMethod"]` detects change; active QR timer interval is cleared (`clearInterval`), `#paymentWalletInfo` is hidden, and CTA button text reverts to `"Confirmar Pedido"`. |
| 14 | Checkout Submit | User session expired during checkout | `api.createOrderAPI` returns 401/403 (`isAuthFailure`). Frontend calls `cerrarSesionCaducada()`, displays toast instructing user to log in again, and preserves cart in state so user doesn't lose items. |

---

## 8. Preserved DOM IDs & Functional Contracts

### 8.1 Shopping Cart DOM IDs (`frontend/index.html`)
- `#cartBtn`: Trigger button in navbar with `data-bs-toggle="offcanvas"` and `data-bs-target="#cartOffcanvas"`.
- `#cartCount`: Badge counter in navbar.
- `#cartOffcanvas`: Container offcanvas element.
- `#cartOffcanvasLabel`: Accessible label for offcanvas.
- `#cartItemCount`: Item count badge inside header.
- `#cartRestaurantBanner`: Dynamic container for single restaurant card.
- `#cartRestaurantName`: Heading with restaurant name.
- `#clearCartBtn`: Action button to empty the cart.
- `#cartItemsContainer`: Scrollable container.
- `#emptyCart`: Empty state placeholder.
- `#cartItems`: Container where item rows are appended.
- `#cartFooter`: Footer element containing breakdown and CTA.
- `#cartSubtotalRow` & `#cartSubtotal`: Subtotal row and value element.
- `#cartStudentSavingsRow` & `#cartStudentSavings`: Student savings row and value element.
- `#cartTotal`: Final cart total value element.
- `#checkoutBtn`: Primary CTA button to navigate to checkout (`handleCheckoutNavigation`).
- `#restaurantChangeModal`: Warning modal for restaurant conflict.
- `#restaurantChangeModalLabel`: Title of conflict modal.
- `#restaurantChangeCurrentName`: Text showing current restaurant.
- `#restaurantChangeNewName`: Text showing attempted new restaurant.
- `#restaurantChangeCancelBtn`: Button to cancel and keep current cart.
- `#restaurantChangeConfirmBtn`: Button to clear and switch restaurant.

### 8.2 Checkout DOM IDs (`frontend/index.html`)
- `#checkoutView`: Main checkout section.
- `#backToMenuBtn`: Back navigation button.
- `#checkoutPageTitle`: Display title ("A un paso del antojo.").
- `#checkoutForm`: Form element.
- `#deliveryAddressCard`: Card containing delivery information.
- `#customerName`: Input for recipient name.
- `#customerPhone` & `#customerPhoneError`: Input and error feedback for 9-digit phone.
- `#savedAddressesContainer` & `#savedAddressesList`: Chips list for saved addresses.
- `#customerAddress`: Input for street address.
- `#deliveryAddressSearch`: Button to geocode address search.
- `#deliveryMapWrapper`: Wrapper for map canvas.
- `#deliveryMap`: Google Maps canvas element.
- `#deliveryMapLocate`: GPS locate button.
- `#deliveryMapStatus`: Live region for map status feedback.
- `#customerReference`: Input for apartment/reference.
- `#paymentMethodCard`: Card containing payment options.
- `#paymentOptionsGrid`: Grid container for payment tiles.
- `#paymentWallet` & `#payWallet`: Digital wallet tile & radio (`value="wallet"`).
- `#paymentCard` & `#payCard`: Card tile & radio (`value="card"`).
- `#paymentCash` & `#payCash`: Cash tile & radio (`value="cash"`).
- `#paymentCashInfo`: Information callout for cash payment.
- `#paymentWalletInfo`: In-place container for digital wallet QR and timer.
- `#walletAmountDisplay`: Formatted amount display for wallet.
- `#qrRestaurantName`: Restaurant name for QR.
- `#qrPaymentImage`: Image element for restaurant QR code.
- `#qrTimerText`: Countdown timer element.
- `#cancelQrPaymentBtn`: Cancel button for QR payment.
- `#cardDetails`: Drawer container for card input fields.
- `#cardBrandBadge` & `#detectedBrandIcon`: Badge and icon for detected card brand.
- `#cardNumber` & `#cardNumberError`: Card number input and error feedback.
- `#cardExpiry` & `#cardExpiryError`: Card expiry input and error feedback.
- `#cardCvc` & `#cardCvcError`: Card CVC input and error feedback.
- `#cardAuthModal` & `#cardAuthBrand`: Modal and label for bank authorization simulation.
- `#orderSummaryCard`: Right column card container for order summary.
- `#checkoutCartItems`: List of item rows in summary.
- `#checkoutItems`: Backward-compatibility fallback element.
- `#couponCode`: Input field for discount coupon code.
- `#applyCouponBtn`: Button to apply coupon.
- `#removeCouponBtn`: Button to remove coupon.
- `#couponMessage`: Alert container for coupon validation feedback.
- `#checkoutSubtotal`: Span displaying subtotal.
- `#studentDiscountRow` & `#studentDiscountAmount`: Student discount row and amount element.
- `#checkoutDiscountRow`, `#couponDiscountRate`, & `#checkoutDiscount`: Coupon discount row, rate, and amount elements.
- `#checkoutTaxes` & `#checkoutTax`: 18% IGV taxes elements.
- `#checkoutDelivery` & `#checkoutDeliveryFee`: Delivery fee elements (S/ 5.00).
- `#checkoutTotal`: Final order total element.
- `#confirmOrderBtn`: Submit button.
- `#confirmOrderSpinner`: Loading spinner inside submit button.
- `#confirmOrderText`: Text inside submit button.
- `#confirmOrderArrow`: Arrow icon inside submit button.

---

## 9. Recommendations for Implementation Workers

1. **Cart Refinement (`ui.js` & `styles.css`)**:
   - Refactor `renderCartOffcanvas` to generate the exact Figma hierarchy: header with dynamic count subtitle, clean restaurant card with mint delivery pill, left-aligned inline `- Qty +` controls, right-aligned item totals, and `+ Agregar más antojos` button.
   - Synchronize coupon application in cart offcanvas with `state.setActiveCoupon`.
2. **Checkout Delivery Card (`index.html`, `ui.js`, `app.js`)**:
   - Introduce `#deliverySummaryCard` and `#deliveryFormContainer` inside `#deliveryAddressCard`.
   - In `fillCheckoutUserData`, toggle between the compact summary view and the full editing view based on address presence and user clicking `#editDeliveryBtn`.
3. **In-Place Digital Wallet (`index.html`, `app.js`, `ui.js`)**:
   - Move the QR display layout (`#qrPaymentImage`, `#qrRestaurantName`, `#qrTimerText`) directly inside `#paymentWalletInfo` within `#paymentMethodCard`.
   - Update `processWalletPayment` / `toggleCardDetails` so that selecting `payWallet` immediately initiates the in-place QR view without opening `#qrModal`.
   - Update `#confirmOrderBtn` text to `"Ya pagué · S/ [Total] →"` and ensure order creation happens only upon click.
4. **Summary Breakdown (`ui.js`)**:
   - Update `renderCheckoutCart` to display original regular subtotal, student discount (if applicable), coupon discount (if applicable), delivery fee (S/ 5.00), and 18% IGV, ensuring that the linear sum of all lines precisely equals `checkoutTotal`.
