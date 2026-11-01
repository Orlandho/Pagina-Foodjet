# Handoff Report: R1. Reconstrucción de Home y Cabecera según Diseño Figma

**Agent:** teamwork_spec_miner (`explorer_survey_figma_1`)  
**Recipient:** Parent Orchestrator (`58c3ffd8-dc5b-402f-bd35-e8433b2f19cb`)  
**Date:** 2026-10-31  
**Working Directory:** `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_figma_1\`  
**Scope:** R1 — Reconstrucción de Home y cabecera según diseño Figma  

---

## 1. Observation

### Authoritative Visual Sources & Captures:
- **`01-figma-home.png`** (`C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\01-figma-home.png`):
  - **Header:** Clean white background (`#FFFFFF`). Left contains "FOODJET" brand logo in orange with jet/bolt icon, directly adjacent to a 2-line location selector: top line small muted text "Enviar a casa" / "Entregar en", bottom line bold "Av. Larco 812, Miraflores" with a chevron down icon. Center contains a rounded search bar with placeholder "¿Qué se te antoja hoy?". Right contains user action (accessibility/profile) and a solid vibrant orange pill button with white text and shopping bag icon: `"Mi carrito · 3"`.
  - **Hero Title & Subtitle:** Placed immediately below navbar and **before** the banner: Left has headline "Tu antojo. Sin escalas." and subtitle "Lo mejor del barrio, directo a tu puerta."; Right has callout icon + "Recién hecho. Rápido de verdad.".
  - **Banner:** Horizontal compact banner split in two halves inside a rounded container: Left half is solid orange with a yellow badge "POCO PRESUPUESTO, MUCHO SABOR.", title "Combos Estudiantes", copy, and a white pill button "Ver combos ↗"; Right half is a full-bleed food photography of a burger combo with fries and beverage.
  - **Benefits Strip:** The 4-circle advantages strip ("Entrega Rápida", "Calidad Premium", etc.) is **completely absent** between the banner and the catalog.
  - **Filters:** Two compact horizontal rows: Row 1 has category pills ("Todos", "Burgers", "Pizza", "Chaufa", "Bowls", "Extras"); Row 2 has secondary pills ("Filtros" button with slider icon, "★ 4.5+", "Menos de S/ 20.00", "⚡ Entrega rápida") and a right-aligned sort dropdown "Ordenar por: Recomendados v". There is **no lateral sidebar**.
  - **Catalog:** Full-width 3-column grid of product cards ("Los favoritos del barrio" / "6 antojos que nunca fallan"). Cards have generous width (~380-420px), and badges ("MÁS PEDIDO", "PRECIO ESTUDIANTE") have ample space without clipping.
- **`02-web-home.png` & `07-web-catalog.png`**:
  - Show dark background theme, legacy navigation links ("Inicio", "Menú", "Nosotros", "Contacto") dominating the header center, search bar exiled into the catalog section, banner positioned at the very top without hero title, giant 4-benefits strip pushing catalog down, a permanently open lateral sidebar taking 25% of the screen width (`col-lg-3`), and the yellow badge "PRECIO ESTUDIANTE" clipped to "PRECIO ESTUDIAN" due to narrow card width (< 260px in `col-lg-9`).

### Codebase & DOM Contracts:
- `frontend/index.html`:
  - Lines 20-98: Header navbar containing `#navbar`, `#headerAddressBar`, `#headerAddressText`, `#navbarNav`, `#favoritesNav`, `#favoritesBtn`, `#favoritesCount`, `#cartBtn`, `#cartCount`, `#userMenu`, `#userDropdown`, `#userNameDropdown`, `#dashboardBtn`, `#historyBtn`, `#miCuentaBtn`, `#logoutBtn`, `#loginNav`, `#loginBtn`, `#userNameBtn`.
  - Lines 102-197: `#heroCarousel` carousel section.
  - Lines 199-240: 4-benefits strip ("Entrega Rápida", "Calidad Premium", "24/7 Disponible", "Pago Seguro").
  - Lines 242-263: Section `#menu` with title "Tu antojo. Sin escalas." (line 246) and search bar `#catalogSearchInput`, `#catalogSearchClear` (lines 254-261).
  - Lines 267-270: `#filter-food-type-container` for category pills.
  - Lines 275-325: Lateral sidebar `col-lg-3` containing `#filter-price-min`, `#filter-price-max`, `#time-30`, `#time-60`, `#time-more`, `#btn-apply-filters`, `#btn-clear-filters`.
  - Lines 327-336: `col-lg-9` containing `#catalogResultsCount` and `#productsGrid`.
- `tests/empirical_m2_1_audit.mjs`:
  - Command `node tests/empirical_m2_1_audit.mjs` executed:
    - Baseline unique IDs in commit `515e3ad`: 165 IDs.
    - All 165 baseline IDs must be strictly preserved.
    - Zero duplicate DOM IDs allowed.
    - 13 specific Milestone 2 IDs tested: `headerAddressBar`, `headerAddressText`, `cartRestaurantBanner`, `cartStudentSavingsRow`, `cartStudentSavings`, `restaurantChangeModal`, `restaurantChangeCurrentName`, `restaurantChangeNewName`, `restaurantChangeCancelBtn`, `restaurantChangeConfirmBtn`, `catalogSearchInput`, `catalogSearchClear`, `favoritesCountBadge`.
    - Result: `ALL EMPIRICAL ASSERTIONS PASSED (100% SUCCESS)`.
- Test commands executed:
  - `npm run test:unit`: 25 passed, 0 failed, 6 suites passed.
  - `npm run test:frontend`: 86 scenarios passed, 327 steps passed.

---

## 2. Logic Chain

1. **Header Layout Inference:**
   - In `01-figma-home.png`, the central search bar is in the top navigation bar. In `index.html`, `#catalogSearchInput` is inside `#menu` on line 254, while the navbar is crowded with legacy navigation links ("Inicio", "Menú", "Nosotros", "Contacto").
   - Removing the legacy nav links from the top horizontal desktop bar and placing `#catalogSearchInput` in the navbar center simultaneously satisfies the Figma composition and preserves all search bindings in `ui.js:initCatalogSearch()`.
   - Modifying `#headerAddressBar` to display a 2-line stacked component ("Entregar en" / address) matches Figma while preserving `#headerAddressBar` and `#headerAddressText` bindings in `ui.js:syncHeaderAddress()` and `ui.js:initHeaderAddress()`.
   - Modifying `#cartBtn` from an icon button to a textual pill button containing "Mi carrito · " and `#cartCount` directly reproduces the Figma frame while keeping `app.js:openCart()` and `ui.js:renderCartOffcanvas()` functional.

2. **Vertical Order Inference:**
   - In `index.html`, "Tu antojo. Sin escalas." is at line 246 (inside `#menu`), whereas in `01-figma-home.png`, it is prominently displayed at the top of the content area, above the promotion banner.
   - Moving this heading and subtitle to a dedicated section before `#heroCarousel` aligns with Figma without removing or breaking any DOM elements.
   - In `01-figma-home.png`, the 4 benefits strip does not exist between the banner and the catalog. In `index.html` lines 199-240, this strip creates massive vertical separation. Relocating it to the secondary content area (above `#about` or near footer) fulfills Figma alignment and satisfies the requirement to keep informative content accessible.

3. **Filter System & Product Grid Inference:**
   - In `07-web-catalog.png`, the permanently open sidebar (`col-lg-3`) compresses the catalog into `col-lg-9`, squeezing cards to < 260px and truncating the yellow badge to "PRECIO ESTUDIAN".
   - In `01-figma-home.png`, the filter system is horizontal (Category pills in Row 1, secondary quick pills + "Filtros" button in Row 2), and the catalog is full width with 3 cards per row (~380-420px wide).
   - Placing the price inputs (`#filter-price-min`, `#filter-price-max`) and delivery time radio buttons (`#time-30`, `#time-60`, `#time-more`) inside a collapsible panel or accessible popover/drawer triggered by the "Filtros" button eliminates the sidebar, preserves 100% of the baseline DOM IDs and event listeners, and allows the product grid to expand to full width (`col-12`), resolving badge clipping completely.

4. **Address Management & GPS Safeguard Inference:**
   - The user dispatch requires: "con selector/edición real de dirección usando datos y servicios existentes, sincronizado con checkout sin duplicados y solicitando GPS solo tras acción explícita".
   - Currently, clicking `#headerAddressBar` opens `#miCuentaModal`, which is a profile modal.
   - Introducing an address selector modal (`#addressSelectorModal`) that lists saved addresses from `api.fetchMyAddressesAPI(token)` allows selecting an existing address or typing a new one. It uses `buscarDireccionGuardada()` to deduplicate within 25 meters, preventing database duplicates.
   - Browser geolocation is wired exclusively to the click event of a dedicated locate button (`#btnHeaderLocateGps`), ensuring zero automatic GPS requests on page load.

---

## 3. Caveats

- **Backend Immutability:** No backend endpoints, Prisma migrations, seeds, or schemas were altered or requested to be altered. All catalog and address data are consumed from existing endpoints (`/api/products`, `/api/addresses`, `/api/config`).
- **Read-Only Mining Execution:** In accordance with the Teamwork Specification Miner role, no production or application files (`frontend/index.html`, `frontend/styles.css`, `frontend/js/ui.js`, `frontend/js/app.js`) were modified during this turn. All findings and technical designs are fully articulated in `report.md` for implementation by the designated implementation agent.
- **Stock Photo Asset for Promotion Banner:** In `01-figma-home.png`, the right half of the banner features a burger combo with fries and a beverage. A high-resolution photo matching this composition has been documented in `report.md` for use in the banner container.

---

## 4. Conclusion

The specification for **R1. Reconstrucción de Home y cabecera según diseño Figma** is fully mined, validated against authoritative reference frames, and structurally mapped:
1. **Header:** 2-line stacked location component, central search bar (`#catalogSearchInput`), textual orange cart button (`#cartBtn` with "Mi carrito · N"), and clean user actions cluster without dominating legacy links.
2. **Vertical Ordering:** Top hero title/subtitle ("Tu antojo. Sin escalas.") -> 2-halves compact promo banner -> compact 2-row filters -> full-width 3-column product catalog. 4-benefits strip cleanly relocated to secondary section.
3. **Filter System:** Horizontal category pills (`#filter-food-type-container`) and secondary quick action pills with collapsible popover/drawer housing all baseline filter controls (`#filter-price-min`, `#filter-price-max`, `#time-30`, `#time-60`, `#time-more`, `#btn-apply-filters`, `#btn-clear-filters`).
4. **Product Grid:** Full-width grid (`col-12`), 3 cards per row on desktop (>= 380px wide), unclipped "PRECIO ESTUDIANTE" badges, preserving all approved card logic and backend fields.
5. **DOM Contracts:** All 165 baseline DOM IDs and 13 Milestone 2 IDs are cataloged and preserved with zero duplicates.

The technical report is available at:  
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_figma_1\report.md`

---

## 5. Verification Method

To independently verify the findings and enforce compliance:

1. **Verify Baseline & Milestone 2 DOM IDs:**
   ```powershell
   node tests/empirical_m2_1_audit.mjs
   ```
   *Expected Outcome:* Exit code 0, 0 baseline IDs missing, 0 duplicate IDs, 100% assertions passed.

2. **Verify Adversarial Stress Suite & Unit Domain Tests:**
   ```powershell
   node tests/empirical_m2_1_stress.mjs
   npm run test:unit
   ```
   *Expected Outcome:* 25 unit tests pass, adversarial regex & search inputs pass.

3. **Verify Cucumber Frontend BDD Scenarios:**
   ```powershell
   npm run test:frontend
   ```
   *Expected Outcome:* 86 scenarios pass (327 steps).

4. **Visual Comparison against Figma Golden Master:**
   - Inspect `reports/screenshots/01_home_desktop_1440.png` vs `01-figma-home.png`.
   - Validate desktop 1440px / 1280px views and responsive 390px mobile viewport without horizontal overflow.
