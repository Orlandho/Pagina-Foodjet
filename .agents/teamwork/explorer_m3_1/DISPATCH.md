# Dispatch: Explorer M3-1 (Checkout Layout, Delivery Address & Map Fallback)

**Role**: teamwork_explorer
**Working Directory**: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m3_1\`
**Parent Conversation ID**: `20c340e3-fa46-461e-a7ae-9dd6bbd67479`

Authoritative User Request (MUST READ FIRST):
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md`

Project Plan:
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md`

Reference Material:
- Local Prototype (read-only reference): `C:\Users\ORLANDO\Desktop\ciclo 9\frontend para actualizar foodjet para app moviles y adm de proyec de software\proyecto-app-movil-UPN-2026-2-main`
- Existing Frontend: `frontend/index.html` (specifically `#checkoutView`, `#deliveryAddressCard`, `#mapaEntrega`), `frontend/styles.css`, `frontend/js/ui.js`, `frontend/js/mapaEntrega.js`, `frontend/js/domain/ubicacion.js`.

Exploration Objectives:
1. Investigate the checkout view (`#checkoutView`) in `frontend/index.html` and `frontend/styles.css`:
   - Design a responsive multi-column layout on desktop (>= 1280px) with delivery & payment on the left, sticky order summary on the right.
   - Design a single-column layout on mobile (360px, 390px) where navigation and buttons do not obscure input fields.
2. Investigate delivery information and address handling:
   - Customer name, phone validation, address input with GPS suggestions (`frontend/js/domain/ubicacion.js`).
   - Use real delivery address or neutral fallback, never store addresses.
3. Investigate the interactive delivery map (`frontend/js/mapaEntrega.js`):
   - Integration with Google Maps API and cascading keys (`GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_API_KEY_SECUNDARIA`).
   - Graceful degradation to manual address + browser GPS without maps when keys are missing or invalid (`gm_authFailure`).
   - Rule R7 conformance: cleanup failed `<script>` tags, 100-150ms auth observation window, idempotent loading.
4. Document all preserved DOM IDs and event listeners required.
5. Provide concrete implementation blueprint, CSS classes, and HTML structure.
6. Write `report.md` and `handoff.md` in your working directory. State your recommendation clearly. Notify parent when done.


## 2026-10-30T23:14:57Z
Sender: 20c340e3-fa46-461e-a7ae-9dd6bbd67479
Content:
You are assigned as Explorer M3-1 for FoodJet Frontend UI Modernization (Milestone 3).

Your working directory is: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m3_1\`
Your parent orchestrator is: `20c340e3-fa46-461e-a7ae-9dd6bbd67479`

Authoritative User Request (MUST READ FIRST):
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md`

Project Plan:
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md`

Detailed Task Assignment:
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m3_1\DISPATCH.md`

Read-Only References to Inspect:
- Local Prototype: `C:\Users\ORLANDO\Desktop\ciclo 9\frontend para actualizar foodjet para app moviles y adm de proyec de software\proyecto-app-movil-UPN-2026-2-main`
- Existing Codebase: `frontend/index.html` (`#checkoutView`, `#deliveryAddressCard`, `#mapaEntrega`), `frontend/styles.css`, `frontend/js/ui.js`, `frontend/js/mapaEntrega.js`, `frontend/js/domain/ubicacion.js`.

Exploration Task:
1. Examine `#checkoutView` layout: multi-column on desktop (>= 1280px, left delivery/payment, right sticky summary) vs single-column on mobile (< 576px / 360px / 390px) without horizontal overflow or keyboard obstruction.
2. Examine delivery information: customer name, phone validation, address input with GPS suggestions from `domain/ubicacion.js`. Use real delivery address or neutral fallback, never store addresses.
3. Examine interactive delivery map (`frontend/js/mapaEntrega.js`): Google Maps API key cascading (`GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_API_KEY_SECUNDARIA`), graceful degradation to manual/GPS fallback without maps on auth failure (`gm_authFailure`), Rule R7 cleanup and observation window.
4. Enumerate all preserved DOM IDs and event listeners.
5. Provide actionable implementation blueprints and CSS/HTML specifications for the Worker.

Write `report.md` and `handoff.md` in your working directory. When complete, notify parent via `send_message`.
