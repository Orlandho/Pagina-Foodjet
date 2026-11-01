# Task Assignment: Worker M2 (Navigation, Header, Home Catalog, Cart & Favorites Implementation)

**Role**: teamwork_worker
**Working Directory**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m2\
**Parent Conversation ID**: 20c340e3-fa46-461e-a7ae-9dd6bbd67479
**Authoritative Request**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md
**Project Plan**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md
**Exclusive File Ownership**: `frontend/index.html`, `frontend/js/ui.js`, `frontend/styles.css`.
(DO NOT touch any backend files, prisma schemas, seeds, Docker Compose, or domain logic files).

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Input Exploratory Handoffs (Read Carefully Before Modifying):
1. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_1\handoff.md` (Navbar, user header, real/neutral address bar, hero carousel)
2. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_2\handoff.md` (Integrated search bar, category pills, feedback states, product card grid)
3. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_3\handoff.md` (Cart/favorites offcanvas overhaul, restaurant conflict UX, dark mode contrast fix)
4. Architecture Diagram: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_3\cart_favorites_architecture.drawio`

## Scope & Implementation Deliverables

### 1. Navigation & Header (`frontend/index.html`, `frontend/js/ui.js`)
- Preserve all 165 DOM IDs (`#navbar`, `#favoritesNav`, `#favoritesBtn`, `#cartBtn`, `#cartCount`, `#userMenu`, `#userDropdown`, `#userNameDropdown`, `#dashboardBtn`, `#historyBtn`, `#miCuentaBtn`, `#logoutBtn`, `#loginNav`, `#loginBtn`).
- Add/update delivery address bar: Show customer's real address if available/authenticated; otherwise neutral default (e.g. "Ingresar dirección de entrega") — never hardcode store address.
- Reactive cart badge `#cartCount`: Show badge only when cart has items (`count > 0`).

### 2. Hero Banner Carousel (`frontend/index.html`, `frontend/styles.css`)
- Style `#heroCarousel` container: 24px border radius (`--radius-hero`), brand orange background (`#F4511E`).
- Floating pill: Yellow `#FCD460` pill with dark text `#1C1C1C` "POCO PRESUPUESTO. MUCHO SABOR."
- Headline: "Combos Estudiantiles" / "Tu antojo. Sin escalas." with Compose typography scale.

### 3. Integrated Search & Category Chips (`frontend/index.html`, `frontend/js/ui.js`)
- Integrated search input with magnifying glass and clear button, filtering products by name/description.
- Category pills in `#filter-food-type-container` using `.foodjet-pill` (supporting "Todos" and category selections).
- Support loading state with skeleton cards (`.foodjet-card--skeleton`).
- Zero-results state with clear button ("Limpiar filtros").
- Error state with retry button calling `ui.loadProducts()`.

### 4. Product Card Grid (`frontend/js/ui.js`, `frontend/styles.css`)
- Product cards in `#productsGrid`: `.foodjet-card` with 20px radius, hover elevation.
- Badges: Floating "PRECIO ESTUDIANTE" badge (`.foodjet-badge--student`) when student discount applies; "AGOTADO" when unavailable.
- "+" button (`.add-to-cart`, `data-id`) with event-target click safety.
- Favorite button (`.favorite-toggle`, `data-id`).

### 5. Cart & Favorites Offcanvas Overhaul (`frontend/index.html`, `frontend/js/ui.js`, `frontend/styles.css`)
- `#cartOffcanvas`: Add active restaurant banner, direct item delete button (`.remove-item-btn`), student savings row (`#cartStudentSavingsRow`), and styled checkout CTA (`#checkoutBtn`).
- Single-restaurant conflict UX: Interactive modal or alert (`#restaurantChangeModal`) letting user keep current cart or clear and switch restaurant.
- `#favoritesOffcanvas`: Friendly empty state, styled favorite cards with student price display and quick add-to-cart.

### 6. Challenger M1_1 Contrast Remediation (`frontend/styles.css`)
- Set `.foodjet-badge--student` and `.foodjet-badge--yellow` text to `color: #1C1C1C !important;` (fixes dark mode 1.16:1 defect).
- Set `.foodjet-pill--active` in dark mode to high contrast (`background: #E8E8E8 !important; color: #121212 !important;`).

### 7. Verification & Tests
- Execute `npm run test:unit`
- Execute `npm run test:frontend`
- Execute `npm test`
Ensure 100% pass (131/131 acceptance scenarios, 93/93 unit tests).

Write `report.md` and `handoff.md` in your working directory. Notify parent when done.

## 2026-10-30T22:42:47Z
You are assigned as Worker M2 for FoodJet Frontend UI Modernization.

Your working directory is: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m2\`
Your parent orchestrator is: `20c340e3-fa46-461e-a7ae-9dd6bbd67479`

Authoritative User Request (MUST READ FIRST):
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md`

Project Plan:
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md`

Detailed Task Assignment:
`C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m2\DISPATCH.md`

Input Exploratory Handoffs:
1. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_1\handoff.md` (Navbar, delivery address bar, reactive cart badge, hero carousel)
2. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_2\handoff.md` (Integrated search, category pills, feedback states, product card grid)
3. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_3\handoff.md` (Cart/favorites offcanvas overhaul, single-restaurant conflict UX, dark mode contrast remediation)
4. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_3\cart_favorites_architecture.drawio` (Architecture diagram)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You own and can modify ONLY:
- `frontend/index.html`
- `frontend/js/ui.js`
- `frontend/styles.css`
DO NOT modify any backend files (`backend/`), Prisma files, seeds, Docker Compose, or domain logic files (`frontend/js/domain/`).

Deliverables:
1. Navigation & Header: Preserve all 165 DOM IDs. Implement delivery address bar showing real customer address or neutral state, and reactive cart counter badge (`#cartCount`).
2. Hero Banner Carousel: Style `#heroCarousel` with 24px radius, brand orange background, yellow pill `#FCD460` with dark text `#1C1C1C` "POCO PRESUPUESTO. MUCHO SABOR.", and headline.
3. Integrated Search & Category Pills: Integrated search input with clear button, category pills in `#filter-food-type-container` using `.foodjet-pill`, skeleton loading state, zero-results state with clear button, and error state with retry.
4. Product Card Grid: Product cards in `#productsGrid` with 20px radius, hover elevation, floating "PRECIO ESTUDIANTE" badge (`.foodjet-badge--student`) when student discount applies, "AGOTADO" tag when unavailable, functional "+" button (`.add-to-cart`, `data-id`), and favorite button (`.favorite-toggle`, `data-id`).
5. Cart & Favorites Offcanvas: `#cartOffcanvas` with active restaurant banner, direct delete button (`.remove-item-btn`), student savings row (`#cartStudentSavingsRow`), single-restaurant rule alert/modal, and `#favoritesOffcanvas` with styled cards and quick add.
6. Challenger M1_1 Contrast Fix: Update `.foodjet-badge--student`, `.foodjet-badge--yellow` to `color: #1C1C1C !important;` and dark mode `.foodjet-pill--active` to high contrast.
7. Verification: Run `npm run test:unit`, `npm run test:frontend`, and `npm test`. Ensure 100% pass (131 acceptance scenarios, 93 unit tests).

Write `report.md` and `handoff.md` in `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m2\`. When complete, notify parent via `send_message`.
