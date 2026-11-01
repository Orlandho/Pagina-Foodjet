# Handoff Report: Specification Mining for Order Tracking (R4) & Accessibility/Themes (R5)

**Agent:** teamwork_spec_miner (`explorer_survey_figma_3`)  
**Target Recipient:** Parent Orchestrator (`58c3ffd8-dc5b-402f-bd35-e8433b2f19cb`)  
**Date:** 2026-10-31T21:37:00Z  
**Type:** Hard Handoff (Investigation Complete)  

---

## 1. Observation

1. **Figma Reference Inspection (`05-figma-tracking.png`):**
   - Header: Brand logo + address dropdown + accessibility link.
   - Title: `¡Tu antojo va volando!` with subtitle `Pedido #FJ-2048 · Sigue cada parte del viaje.`.
   - Layout: Asymmetric 2-column grid.
     - **Left Column:** Interactive wide map of contained height (~380–420px), containing an overlaid pill badge `• Actualizando en vivo` in the top-left corner. Directly beneath the map is the **Order Summary Card** (`Tu pedido #FJ-2048`, `S/ 46.60`, items list, delivery address, and payment method).
     - **Right Column:** Compact tracking card featuring a status badge (`• TU ANTOJO YA ESTÁ EN CAMINO`), prominent ETA display (`12–18 min` / `Llegada estimada: 1:35–1:41 p. m.`), a 4-stage vertical timeline (Confirmación, Preparación, En camino, Entregado), and a status callout banner at the bottom (`¡Ya falta poquito! / Ten tu celular cerca...`).
   - Non-existent backend data in Figma: Courier profile ("Diego Ramirez", avatar, ratings, direct chat, phone). The project constraints in `ORIGINAL_REQUEST.md:26` strictly prohibit inventing fake driver data or chat.

2. **Previous Web Tracking Implementation (`11-web-tracking.png`, `12-web-tracking-loaded.png`, `index.html:785-930`):**
   - In `index.html:805-928`, `.seguimiento` defines `#trackingMapCard` in the left column and `.seguimiento__panel` in the right column.
   - `.seguimiento__panel` wraps both `#statusCard` AND the "Detalles del pedido" card stacked vertically on the right.
   - The map height in `styles.css:2165` is set to `height: min(640px, calc(100vh - 120px)); min-height: 440px;`, taking up almost the entire screen vertically, leaving the space below empty on desktop.
   - In `11-web-tracking.png`, the timeline text broken bug is visible: `Confirmació\nn` splits across two lines.
   - The live connection badge `#liveIndicator` is placed outside the map in `tracking-header` (`index.html:797`), rather than overlaid in the map corner as in Figma.

3. **Codebase Contracts & Polling Mechanics:**
   - Polling: `ui.js:1540-1803` polls `GET /api/orders/:id` every 4,000 ms, handles failure states (`reconnecting` on error, `disconnected` after 5 failures), and stops on terminal states (`entregado`/`cancelado`).
   - Page Visibility: `ui.js:1792` binds to `document.visibilitychange`, pausing polling when the tab is backgrounded and re-polling immediately on reactivation.
   - Animated Driver: `mapaSeguimiento.js:165-218` smoothly animates `.marcador-seguimiento--repartidor` using `requestAnimationFrame`, server drift compensation, and OSRM route slicing (`dividirRuta()`).
   - Cancellation Button: `ui.js:1631-1635` and `app.js:522-550` enforce that `#cancelOrderBtn` is strictly visible only for `pendiente` and `confirmado` states.

4. **Dark Mode & Contrast Discrepancies:**
   - `styles.css:2944`: `.foodjet-hero-cta-btn` sets `background-color: #ffffff !important` and `color: var(--color-text-primary) !important`. In dark mode, `--color-text-primary` evaluates to `#E8E8E8`, producing invisible white text on a white button.
   - `styles.css:3818`: `.seguimiento__llegada-cifra` uses `color: var(--color-primary-dark, #D94310)`, which has insufficient contrast against dark mode surfaces.
   - `styles.css:2238`: `.linea-tiempo__etapa` has grid columns `32px 1fr auto`, but `.linea-tiempo__nombre` lacks `white-space: nowrap;`, causing Spanish words like "Confirmación" to split syllables when panel width narrows.

5. **Executable Test Suite Verification:**
   - `npm run test:frontend` executes 86 scenarios across 11 feature files (including `seguimiento.feature` and `seguimiento_mapa.feature`), all 86 passed (0 failures).
   - `npm run test:backend` executes 45 scenarios, all 45 passed (0 failures).

---

## 2. Logic Chain

1. **Premise:** The authoritative visual reference `05-figma-tracking.png` defines an asymmetric 2-column layout where the map has a contained height and the order summary card sits directly beneath the map on the left, while the right column houses the ETA, timeline, and notification callout.
2. **Current Misalignment:** In `index.html` and `styles.css`, the order summary card is inside `.seguimiento__panel` on the right column below `#statusCard`, and the map is given a full-height container (`min(640px, calc(100vh - 120px))`), leaving the left column unbalanced.
3. **Fidelity Requirement:** Moving the order summary card under `#trackingMapCard` in the left column and reducing the map height to `~380px–420px` restores exact geometric fidelity to the Figma frame while preserving all DOM IDs (`#orderNumber`, `#orderPayment`, `#orderDate`, `#orderSubtotal`, `#orderTaxes`, `#orderDelivery`, `#orderTotalFinal`).
4. **Data Integrity Requirement:** `ORIGINAL_REQUEST.md:26` strictly forbids inventing fake courier names, avatars, phone numbers, or chat. Adapting the courier area into a truthful **Status Notification Callout Banner** ("Ten tu celular cerca para recibir tu pedido") preserves the visual layout density of Figma while adhering 100% to backend data truthfulness.
5. **Quality & Accessibility Requirement:** Fixing `white-space: nowrap` on `.linea-tiempo__nombre`, adding `color: #121212 !important` to white CTA buttons in dark mode, adding `tabindex="-1"` to `h1#trackingHeadline`, and ensuring 44×44px touch targets satisfies WCAG 2.1/2.2 AA and resolves all defects noted in prior visual audits.

---

## 3. Caveats

- **No Caveats:** All authoritative artifacts (Figma design capture, previous audit images, HTML, CSS, client JS modules, and Cucumber test specifications) were directly probed and verified against runnable test suites.
- Assumptions made: The layout restructure will be executed purely in the frontend (`index.html`, `styles.css`, `ui.js`) without modifying any backend models, API routes, or database seeds.

---

## 4. Conclusion

The specification mining for R4 and R5 is fully complete and documented in `report.md`. To achieve visual fidelity with Figma and full test pass rates:
1. Re-structure the tracking grid: Left column contains contained-height Map (`#trackingMapCard`) + Order Summary Card; Right column contains `#statusCard` (Prominent ETA + 4-Stage Timeline + Callout Banner + Action Buttons).
2. Embed the live connection pill badge (`#liveIndicator`) inside the top-left of the map canvas container.
3. Apply `white-space: nowrap` to `.linea-tiempo__nombre` and `color: #121212 !important` to `.foodjet-hero-cta-btn` in dark mode.
4. Add `tabindex="-1"` to `h1#trackingHeadline` for accessible programmatic focus.
5. Retain all 29 DOM element IDs and domain module export contracts intact.

---

## 5. Verification Method

To verify these findings independently:
1. **Frontend Cucumber Test Suite:**
   ```bash
   npm run test:frontend
   ```
   Must execute 86 scenarios across all features and confirm 100% passing.
2. **Backend Cucumber Test Suite:**
   ```bash
   npm run test:backend
   ```
   Must execute 45 scenarios and confirm 100% passing.
3. **Visual Inspection:**
   Inspect `05-figma-tracking.png` vs `11-web-tracking.png` and `12-web-tracking-loaded.png` using `view_file` to verify the 2-column layout and map/card placement.
4. **CSS Inspection:**
   Inspect `frontend/styles.css:2140-2170`, `styles.css:2944`, `styles.css:3818`, and `styles.css:3839`.
