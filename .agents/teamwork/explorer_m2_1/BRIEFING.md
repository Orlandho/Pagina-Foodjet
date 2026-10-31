# BRIEFING — 2026-10-30T00:45:00Z

## Mission
Investigate and design visual specification and concrete code changes for Top Navigation Bar, User Header, Real/Neutral Delivery Address Bar, and Home Hero Banner Carousel matching Jetpack Compose prototype, preserving all DOM IDs and event bindings.

## 🔒 My Identity
- Archetype: explorer
- Roles: Teamwork explorer
- Working directory: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_1\
- Original parent: b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c
- Milestone: M2

## 🔒 Key Constraints
- Read-only investigation — do NOT implement in source code directly
- Preserve all existing DOM IDs (e.g. #cartCount, #cartBtn, #favoritesBtn, #userMenu, #userNameDropdown, #dashboardBtn, #historyBtn, #miCuentaBtn, #logoutBtn, #loginNav, #loginBtn, #heroCarousel, etc.)
- Preserve all event bindings and global bridges
- Show user address if authenticated/saved; otherwise neutral default (e.g. "Ingresar dirección de entrega") — NEVER hardcode store address
- Match Jetpack Compose reference prototype style (#F4511E, 24px border radius, yellow #FCD460 pill "POCO PRESUPUESTO. MUCHO SABOR.", "Combos Estudiantiles" / "Tu antojo. Sin escalas.", etc.)
- Accessible WCAG AA compliance, responsive mobile & desktop

## Current Parent
- Conversation ID: b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c
- Updated: 2026-10-30T00:45:00Z

## Investigation State
- **Explored paths**:
  - Reference prototype in `C:\Users\ORLANDO\Desktop\ciclo 9\frontend para actualizar foodjet para app moviles y adm de proyec de software\proyecto-app-movil-UPN-2026-2-main`:
    * `components/FoodJetTopBar.kt`
    * `components/HeroCarousel.kt`
    * `screens/HomeScreen.kt`
    * `theme/Color.kt`
  - Codebase:
    * `frontend/index.html` (lines 20-130)
    * `frontend/styles.css` (tokens, legacy navbar, carousel rules)
    * `frontend/js/ui.js` (cart offcanvas, favorites, address handlers)
    * `frontend/js/app.js` (initialization, address resolution, event listeners)
    * `frontend/js/legacy.js` (updateUserUI, session restore)
    * `frontend/js/favorites.js` (loadFavorites)
    * `frontend/js/domain/ubicacion.js` (direccionInicial, buscarDireccionGuardada)
  - Test suites:
    * `npm run test:unit` (25/25 passing)
    * `npm run test:frontend` (86 scenarios, 327 steps passing)
- **Key findings**:
  - All existing DOM IDs (#heroCarousel, #cartBtn, #cartCount, #favoritesBtn, #favoritesNav, #userMenu, #userNameDropdown, #dashboardBtn, #historyBtn, #miCuentaBtn, #logoutBtn, #loginNav, #loginBtn, #userNameBtn) are preserved.
  - Adding `#favoritesCount` inside `#favoritesBtn` provides reactive counter for favorites, mirroring `#cartCount`.
  - Adding `#headerAddressBar` and `#headerAddressText` in the navbar with responsive desktop/mobile placement provides real address display for authenticated users and neutral default ("Ingresar dirección de entrega") for guests, strictly avoiding hardcoded store addresses.
  - Hero carousel design matching Compose HorizontalPager: vibrant #F4511E background, 24px border radius, yellow #FCD460 badge pill "POCO PRESUPUESTO. MUCHO SABOR.", bold white typography, 14px rounded white CTA button with arrow icon, and right-aligned food illustration clipped with 32px top-left border radius.
- **Unexplored areas**: None for M2_1 scope.

## Key Decisions Made
- Fully specified HTML markup changes, CSS classes, responsive breakpoints, accessibility attributes, and JavaScript lifecycle hooks for Worker M2.

## Artifact Index
- DISPATCH.md — Assignment instructions
- BRIEFING.md — Persistent memory
- progress.md — Liveness heartbeat
- report.md — Detailed technical specification and proposed diffs/changes
- handoff.md — 5-component handoff report
