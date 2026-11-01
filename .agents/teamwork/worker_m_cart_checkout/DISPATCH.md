## 2026-10-31T23:09:42Z
You are teamwork_worker operating in the Teamwork framework.
Your working directory is: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m_cart_checkout\
Your parent orchestrator is: 58c3ffd8-dc5b-402f-bd35-e8433b2f19cb

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY FIRST STEP:
Read ORIGINAL_REQUEST.md at:
C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md

Your assigned scope is:
Milestone M-Cart-Checkout: R2. Conservación y afinamiento del carrito de compras & R3. Checkout fiel al frame web con lógica existente

Authoritative Specifications & Input Artifacts:
- Explorer Report:
  C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_figma_2\report.md
- Explorer Handoff:
  C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_figma_2\handoff.md
- Visual References:
  C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\03-figma-cart.png
  C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\08-web-cart.png
  C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\04-figma-checkout.png
  C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\09-web-checkout.png
  C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\10-web-wallet.png

Exclusive File Write Boundaries:
You have exclusive write access to:
- frontend/index.html
- frontend/styles.css
- frontend/js/ui.js
- frontend/js/domain/checkout.js
- frontend/js/app.js

HARD CONSTRAINTS:
- NEVER modify backend/, prisma/, docker-compose.yml, Caddyfile, or CI scripts.
- ZERO new npm packages, ZERO frameworks (Vanilla ES modules, HTML5, CSS3, Bootstrap 5.3 only).
- All baseline DOM IDs from commit 515e3ad and Milestone M-Home MUST be preserved. Zero duplicate IDs.

Implementation Requirements:
1. Shopping Cart (Shopping cart - Desktop frame):
   - Offcanvas styling matching Figma: light surface, title "Tu carrito" with subtitle indicating product count (e.g. "3 productos · 2 antojos"), coral fork/knife restaurant card with mint delivery estimate pill ("En tu puerta en 25–35 min").
   - Cart item card: rounded thumbnails, inline `- 2 +` quantity controls under the item title, right-aligned bold line prices (`S/ 37.80`). Link `+ Agregar más antojos` to return to catalog.
   - Pricing clarity: clearly label amounts between subtotal of products and final total. Never promise a CTA total that excludes shipping (S/ 5.00) and taxes (18% IGV). Maintain single-restaurant rule alert and student discount display.
2. Checkout (Checkout - Desktop frame):
   - Proportions of two-column composition: ~65% left column (delivery & payment), ~35% right sticky summary. Steps breadcrumb ("✓ Carrito — 02 Pago — 03 A disfrutar").
   - Card 1 ("¿Dónde lo llevamos?"):
     - Show compact saved delivery data card with top-right "Editar" button.
     - When "Editar" is clicked, reveal full address form, interactive Google Map canvas (#deliveryMap), GPS button (#deliveryMapLocate), reference field, and validations.
     - Preserve all address form input IDs: #customerName, #customerPhone, #customerAddress, #customerReference, etc.
   - Card 2 ("¿Cómo quieres pagar?"):
     - 3 payment options as in Figma: Digital Wallet (Billetera / Yape/Plin), Card (Tarjeta), Cash (Efectivo).
     - When Digital Wallet is selected: **integrate the QR code block IN-PLACE within the payment card** (NO popup modal! Eliminate popup modal for wallet). Display countdown timer `⏱ 04:59`, QR image from restaurant, exact total amount, restaurant reference, instructions, and notice.
     - Confirmation button: Text changes to "Ya pagué · S/ [Total] →" when wallet is active. Clicking it validates and submits the order (preventing duplicate clicks/orders with synchronous lock `isSubmittingOrder`).
   - Summary breakdown:
     - Linear, reconcilable breakdown matching backend `orderController.js:76-103`:
       `Subtotal regular - Descuento estudiante - Descuento cupón + Costo de envío (S/ 5.00) + Impuestos (18% IGV) = Total a pagar`.
       Every line must mathematically reconcile with backend orderController.js to the centavo.

Verification:
Execute and verify:
1. `node tests/empirical_m2_1_audit.mjs` (must pass 100%, 0 duplicate IDs)
2. `npm run test:unit` (25 tests must pass)
3. `npm run test:frontend` (86 cucumber scenarios must pass)
4. `npm test` (131 total scenarios: 86 frontend + 45 backend must pass)
5. `node tests/unit/challenger_m3_1_empirical.test.mjs` (30 tests must pass)
6. `node tests/unit/challenger_m3_2_empirical.test.mjs` (26 tests must pass)

Deliverables:
- Write detailed report: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m_cart_checkout\report.md
- Write handoff report: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m_cart_checkout\handoff.md
- Send message to parent orchestrator (58c3ffd8-dc5b-402f-bd35-e8433b2f19cb).
