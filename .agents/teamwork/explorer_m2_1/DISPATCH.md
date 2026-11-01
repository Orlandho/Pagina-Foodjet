# Task Assignment: Explorer M2_1 (Navigation, Header & Hero Carousel Spec)

**Role**: teamwork_explorer
**Working Directory**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_1\
**Parent Conversation ID**: b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c
**Authoritative Request**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md
**Project Plan**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md
**Target Files**: `frontend/index.html`, `frontend/styles.css`, `frontend/js/ui.js`, `frontend/js/app.js`

## Objective
Investigate and design the visual update for the Top Navigation Bar, User Header, Real/Neutral Delivery Address Bar, and Home Hero Banner Carousel matching the Compose reference prototype while preserving all DOM IDs and event bindings.

## Scope
1. **Navbar & Brand**:
   - FoodJet branding with logo and lightning bolt icon.
   - Real vs neutral address: Show user address if authenticated/saved; otherwise neutral default (e.g. "Ingresar dirección de entrega") — NEVER hardcode store address.
   - Badges: `#cartCount` reactive badge (only visible when cart > 0, count displayed), `#favoritesBtn` with heart icon and counter.
   - User menu dropdown (`#userMenu`, `#userNameDropdown`, `#dashboardBtn`, `#historyBtn`, `#miCuentaBtn`, `#logoutBtn`) and guest login (`#loginNav`, `#loginBtn`).
2. **Hero Carousel (`#heroCarousel`)**:
   - Container styling matching Jetpack Compose prototype: `#F4511E` background, 24px border radius, subtle food illustration/pattern background.
   - Floating badge: Yellow `#FCD460` pill with dark text "POCO PRESUPUESTO. MUCHO SABOR."
   - Headline: "Combos Estudiantiles" / "Tu antojo. Sin escalas."
   - Subtitle and CTA button linking to catalog with arrow icon.
3. Formulate concrete code changes for the Worker.

Write `report.md` and `handoff.md` in your working directory. Notify parent when done.

## 2026-10-30T00:34:51Z
You are Explorer M2_1 (Navigation, Header & Hero Carousel Spec).
Your working directory is: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_1\
Read your task description in C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_1\DISPATCH.md and the authoritative request in C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md.
Investigate navbar, user header, real/neutral address display, and hero banner carousel.
Write report.md and handoff.md in your working directory and notify parent b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c.
