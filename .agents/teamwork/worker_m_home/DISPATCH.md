## 2026-10-31T21:43:43Z

You are teamwork_worker operating in the Teamwork framework.
Your working directory is: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m_home\
Your parent orchestrator is: 58c3ffd8-dc5b-402f-bd35-e8433b2f19cb

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY FIRST STEP:
Read ORIGINAL_REQUEST.md at:
C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md

Your assigned scope is:
Milestone M-Home: R1. Reconstrucción de Home y cabecera según diseño Figma

Authoritative Specifications & Input Artifacts:
- Complete Explorer Report:
  C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_figma_1\report.md
- Explorer Handoff:
  C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_figma_1\handoff.md
- Visual References:
  C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\01-figma-home.png
  C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\02-web-home.png
  C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\07-web-catalog.png

Exclusive File Write Boundaries:
You have exclusive write access to:
- frontend/index.html
- frontend/styles.css
- frontend/js/ui.js
- frontend/js/app.js

HARD CONSTRAINTS:
- NEVER modify backend/, prisma/, docker-compose.yml, Caddyfile, or CI scripts.
- ZERO new npm packages, ZERO frameworks (Vanilla ES modules, HTML5, CSS3, Bootstrap 5.3 only).
- All 165 baseline DOM IDs from commit 515e3ad MUST be preserved. Zero duplicate IDs.

Implementation Requirements:
1. Header & Navigation:
   - Location display: 2-line stacked component (#headerAddressBar, #headerAddressText) with "Entregar en" / address and chevron icon.
   - Central search bar: place #catalogSearchInput and #catalogSearchClear in the navbar center, keeping existing event bindings in ui.js:initCatalogSearch().
   - Cart button: textual orange pill button "Mi carrito · " with #cartCount and shopping bag icon (#cartBtn).
   - Address Selector: create #addressSelectorModal to select saved address from api.fetchMyAddressesAPI(token) or enter custom address, synced with checkout, requesting GPS ONLY upon explicit user click on #btnHeaderLocateGps.
   - Clean user action menu (#userMenu, #favoritesNav, #loginNav).
2. Vertical Ordering on Home:
   - Headline "Tu antojo. Sin escalas." and subtitle placed BEFORE the promotion banner.
   - Banner: horizontal compact banner of two halves (left: orange with title, copy, CTA; right: full-bleed food photography inside container, real promo without generic stock or fake prices).
   - Benefits strip: remove the 4 advantages strip from between banner and catalog, relocate it to the secondary/footer section.
3. Filter System:
   - Replace permanently open lateral sidebar (col-lg-3) with 2 compact horizontal rows:
     - Row 1: Category pills (#filter-food-type-container).
     - Row 2: Secondary quick action pills + "Filtros" button opening an accessible popover/drawer containing #filter-price-min, #filter-price-max, #time-30, #time-60, #time-more, #btn-apply-filters, #btn-clear-filters.
4. Product Catalog:
   - Full-width grid (col-12, 3 cards per row on desktop >= 380px wide).
   - Unclipped "PRECIO ESTUDIANTE" and "MÁS PEDIDO" badges.
   - Preserve approved product cards and all functionality.

Verification:
Execute and verify:
1. node tests/empirical_m2_1_audit.mjs (165 baseline IDs must pass 100%)
2. npm run test:unit (25 tests must pass)
3. npm run test:frontend (86 cucumber scenarios must pass)

Deliverables:
- Write detailed report: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m_home\report.md
- Write handoff report: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m_home\handoff.md
- Send message to parent orchestrator (58c3ffd8-dc5b-402f-bd35-e8433b2f19cb).
