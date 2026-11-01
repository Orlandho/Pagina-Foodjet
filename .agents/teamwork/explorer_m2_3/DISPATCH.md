# Task Assignment: Explorer M2_3 (Cart/Favorites Offcanvas, Restaurant Rules & A11y Advisory Fix)

**Role**: teamwork_explorer
**Working Directory**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_3\
**Parent Conversation ID**: b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c
**Authoritative Request**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md
**Project Plan**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md
**Challenger Advisory**: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\challenger_m1_1\handoff.md
**Target Files**: `frontend/index.html`, `frontend/styles.css`, `frontend/js/ui.js`

## Objective
Investigate and design the overhaul of Cart and Favorites Offcanvas drawers, single-restaurant rule visual alert, and dark mode contrast remediation flagged in Milestone 1 challenge.

## Scope
1. **Cart Offcanvas (`#cartOffcanvas`)**:
   - Drawer header: "Tu carrito" with item badge counter and close button.
   - Active restaurant banner: Display current restaurant name with store icon.
   - Single restaurant rule enforcement & alert: Clear warning banner if user attempts to add an item from another restaurant, with option to clear cart or keep current.
   - Item row styling: Thumbnail, title, student price badge, quantity stepper (`.minus-btn`, quantity span, `.plus-btn`), item total, remove icon.
   - Cart footer: Subtotal, student savings line (if applicable), grand total, and full-width checkout CTA button (`#checkoutBtn`).
2. **Favorites Offcanvas (`#favoritesOffcanvas`)**:
   - Header, empty state with friendly illustration, item cards with quick add-to-cart button and remove button.
3. **Challenger M1_1 Advisory Remediation**:
   - Fix `.foodjet-badge--student` and `.foodjet-badge--yellow` dark mode contrast by enforcing `color: #1C1C1C !important;` in all themes.
   - Fix `.foodjet-pill--active` in dark mode to ensure high contrast against active background.
4. Formulate concrete code changes for the Worker.

Write `report.md` and `handoff.md` in your working directory. Notify parent when done.

## 2026-10-30T00:35:15Z
You are Explorer M2_3 (Cart/Favorites Offcanvas, Restaurant Rules & A11y Advisory Fix).
Your working directory is: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_3\
Read your task description in C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_3\DISPATCH.md and the authoritative request in C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md.
Investigate cart and favorites offcanvas drawers, restaurant change warning, and dark mode contrast remediation.
Write report.md and handoff.md in your working directory and notify parent b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c.

## 2026-10-30T00:46:34Z
**Context**: Explorer M2_3 (Cart/Favorites Offcanvas, Restaurant Rules & A11y Advisory Fix)
**Content**: We observed `cart_favorites_architecture.drawio` has been generated. Are `report.md` and `handoff.md` ready?
**Action**: Please complete authoring `report.md` and `handoff.md` and send your completion report to parent conversation b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c.
