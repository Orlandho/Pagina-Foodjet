# Handoff Report — explorer_survey_figma_2 (R2 Shopping Cart & R3 Checkout)

**Agent**: `teamwork_spec_miner` (`explorer_survey_figma_2`)  
**Date**: 2026-10-31T21:38:00Z  
**Parent Orchestrator**: `58c3ffd8-dc5b-402f-bd35-e8433b2f19cb`  
**Type**: Hard Handoff (Specification Task Complete)  

---

## 1. Observation

1. **Visual Audit Reference Images**:
   - `03-figma-cart.png` shows: Desktop offcanvas cart with light theme surface, "Tu carrito" with subtitle "3 productos · 2 antojos", restaurant card with coral fork/knife icon and mint pill "En tu puerta en 25–35 min", item cards with rounded thumbnails, inline `- 2 +` quantity controls under the title, right-aligned bold line prices (`S/ 37.80`), link `+ Agregar más antojos`, coupon section with "Aplicado" badge and green discount text, financial breakdown (Subtotal S/ 46.70, Envío S/ 4.90, Descuento CAMPUS5 -S/ 5.00, Total a pagar S/ 46.60), delivery address teaser, and orange CTA button `"Ir a pagar · S/ 46.60 →"`.
   - `08-web-cart.png` shows: Dark-themed cart offcanvas, bag icon title "Tu carrito 1", restaurant card with trash icon "Vaciar", nuggets item with student badge, subtotal S/ 6.50, student savings -S/ 0.65, total S/ 5.85, note "El envío, IGV y cupones se calculan al pagar", and CTA button `"Proceder al pago →"` without price.
   - `04-figma-checkout.png` shows: Desktop two-column layout (~65% left, ~35% right sticky summary). Steps indicator "✓ Carrito — 02 Pago — 03 A disfrutar". Left Card 1: "¿Dónde lo llevamos?" with top-right "Editar" button, displaying compact summary (Bold address "Casa · Av. Larco 812", subtext "Dpto. 402, Miraflores, Lima", contact "Valeria Torres · +51 987 654 321", reference note, delivery estimate 25-35 min). Left Card 2: "¿Cómo quieres pagar?" with 3 horizontal tiles (Yape/Plin, Tarjeta, Efectivo); selected Yape/Plin displays **in-place QR code block** (timer `⏱ 04:59`, QR image, amount `S/ 46.60`, restaurant reference, instructions, and notice "después de pagar, toca 'Ya pagué'"). Right summary card shows compact items, green coupon pill, breakdown, and primary button `"Ya pagué · S/ 46.60 →"`.
   - `09-web-checkout.png` & `10-web-wallet.png` show: Open input fields for delivery (Name, Phone, Address Chips, Address Input, Map, Reference) with no compact summary card. Under payment options, selecting wallet showed a text box stating "Al confirmar tu pedido, se abrirá el código QR del restaurante..." rather than an in-place QR code.
2. **Backend Calculation** (`backend/src/controllers/orderController.js` lines 76-103):
   ```javascript
   let price = product.precio;
   if (user.es_estudiante && product.descuento_estudiante > 0) {
       price = price - (price * (product.descuento_estudiante / 100));
   }
   subtotal += price * item.cantidad;
   ...
   if (cupon_id) {
       descuento = subtotal * (cupon.porcentaje_descuento / 100);
   }
   const subtotalConDescuento = subtotal - descuento;
   const IMPUESTO_PORCENTAJE = 0.18;
   const COSTO_ENVIO = 5.00;
   const impuestos = subtotalConDescuento * IMPUESTO_PORCENTAJE;
   const total = subtotalConDescuento + impuestos + COSTO_ENVIO;
   ```
3. **Frontend Implementation**:
   - `frontend/js/ui.js` line 701: `renderCartOffcanvas()` handles cart items, single restaurant banner (`getCartRestaurant`), student pricing, and event listeners (`.plus-btn`, `.minus-btn`, `.remove-item-btn`).
   - `frontend/js/ui.js` line 895: `renderCheckoutCart()` renders checkout items and financial breakdown.
   - `frontend/js/app.js` line 591: `processWalletPayment()` previously invoked `openQRModal()` popping up `#qrModal` with a 5-second automatic countdown submission.
   - `frontend/js/mapaEntrega.js` lines 44-99: handles Google Maps canvas `#deliveryMap`, pin, locate button `#deliveryMapLocate`, and status `#deliveryMapStatus`.
4. **Current Test Suite Status**:
   - `npm run test:frontend`: 86 scenarios passed (327 steps passed).
   - `npm run test:backend`: 45 scenarios passed (150 steps passed).
   - `npm run test:unit`: 25 tests passed across 6 test suites with 0 failures.

---

## 2. Logic Chain

1. **Cart Fidelity & Hierarchy (R2)**:
   - Observation 1 demonstrates that Figma's `Shopping cart - Desktop` uses clean light surfaces, distinct density, dynamic product count subtitle, inline quantity controls directly under titles, right-aligned line prices, and `+ Agregar más antojos`.
   - In `08-web-cart.png`, the button promised "Proceder al pago" while showing S/ 5.85, but checkout added S/ 5.00 shipping and S/ 1.05 tax, surprising the user.
   - Therefore, per `ORIGINAL_REQUEST.md:20`, the cart must either calculate the full estimated total (including S/ 5.00 shipping and 18% IGV) so the CTA button `Ir a pagar · S/ [Total] →` matches checkout, or clearly label its total as `Subtotal de productos: S/ [Subtotal]` with CTA `Ir a pagar →`.
2. **Two-Column Checkout & Compact Saved Address (R3)**:
   - In `04-figma-checkout.png`, users with saved addresses see a compact summary card with an "Editar" button in the top right.
   - Observations from `frontend/index.html` (lines 425-499) and `app.js` (lines 330-379) show that all form fields (`customerName`, `customerPhone`, `customerAddress`, `customerReference`, map canvas) are required for validation and backend payload generation.
   - Therefore, introducing a collapsible container pattern (`#deliverySummaryCard` and `#deliveryFormContainer`) inside `#deliveryAddressCard` allows displaying the compact card when saved addresses exist, while revealing the full form upon clicking "Editar" without breaking existing DOM IDs or validation routines.
3. **In-Place Digital Wallet Elimination of Modal (R3)**:
   - In `04-figma-checkout.png`, the QR code is displayed directly within the payment card, accompanied by countdown timer `⏱ 04:59`, instructions, and button `"Ya pagué · S/ [Total] →"`.
   - In existing code (`app.js:604`), `openQRModal()` created a popup modal `#qrModal` with auto-submission after 5 seconds, which created risk of duplicate orders and premature confirmation.
   - Therefore, migrating the QR rendering in-place into `#paymentWalletInfo` and requiring explicit user click on `#confirmOrderBtn` ("Ya pagué") eliminates the modal, prevents premature confirmation, and honors the Figma frame.
4. **Mathematical Breakdown Reconciliation (R3)**:
   - Observation 2 proves that the backend calculates student discount on the product unit price first, applies coupon discount on the net subtotal, then adds 18% IGV and S/ 5.00 shipping.
   - In `09-web-checkout.png`, the UI displayed Subtotal S/ 5.85 (already discounted) and below it Descuento Estudiante -S/ 0.65, making the arithmetic appear to double-deduct the student discount.
   - Therefore, displaying regular subtotal $\sum (P_i \times Q_i)$, student discount $-\sum ((P_i - P'_i) \times Q_i)$, coupon discount, shipping (S/ 5.00), and 18% IGV produces a linear sum that equals `checkoutTotal` down to the centavo, fully reconciling with `orderController.js`.

---

## 3. Caveats

- **No Backend Modifications**: All findings and specifications strictly preserve existing backend API routes, schema, and `orderController.js`. No backend changes are required or permitted.
- **Fixed S/ 5.00 Shipping**: In Figma `03-figma-cart.png` and `04-figma-checkout.png`, shipping is illustrated as `S/ 4.90`. In the FoodJet codebase (`orderController.js:100`), `COSTO_ENVIO` is fixed at `5.00`. The frontend must adhere to the backend's `5.00` fee.
- **Purely Read-Only Role**: As a specification miner, no modifications have been made to application source files. Implementation will be handled by designated worker agents.

---

## 4. Conclusion

The specification mining for R2 (Shopping Cart) and R3 (Checkout) is complete. All visual components, gap discrepancies, interaction workflows (compact delivery card with "Editar", in-place QR wallet, single restaurant rule, student discount, coupon engine), mathematical equations, and 50+ DOM IDs have been documented in `report.md`. The design can be implemented cleanly in `frontend/index.html`, `frontend/js/ui.js`, `frontend/js/app.js`, and `frontend/styles.css` without breaking any existing tests or API contracts.

---

## 5. Verification Method

1. **Frontend Cucumber Feature Tests**:
   ```powershell
   npm run test:frontend
   ```
   *Expected*: All 86 scenarios pass (including `carrito.feature`, `billetera.feature`, `descuentos.feature`, `pago_tarjeta.feature`, and `ubicacion_entrega.feature`).
2. **Backend Cucumber Feature Tests**:
   ```powershell
   npm run test:backend
   ```
   *Expected*: All 45 scenarios pass (including `estado_pedido.feature`, `pago.feature`, and `simulacion.feature`).
3. **Unit Tests with Domain Coverage**:
   ```powershell
   npm run test:unit
   ```
   *Expected*: 25 tests pass across 6 suites with >75% coverage.
4. **Technical Report Inspection**:
   - Inspect `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_figma_2\report.md` for complete specification tables, edge case matrices, and DOM ID preservation lists.
5. **Invalidation Conditions**:
   - Any modification to `backend/src/controllers/orderController.js` or `prisma/schema.prisma`.
   - Removal or renaming of any listed DOM ID (e.g. `#cartOffcanvas`, `#cartTotal`, `#checkoutForm`, `#confirmOrderBtn`, `#deliveryMap`).
   - Failure of any of the 86 frontend or 45 backend cucumber test scenarios.
