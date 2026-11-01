# Technical Specification Report: R1. Reconstrucción de Home y Cabecera según Diseño Figma

**Author:** teamwork_spec_miner  
**Date:** 2026-10-31  
**Scope:** R1. Reconstrucción de Home y cabecera según diseño Figma (`FOODJET-BUSS-PROJ` Home - Desktop)  
**Target Repository:** `c:\Users\ORLANDO\Desktop\Pagina-Foodjet`  
**Branch:** `feat/UI-frontend-update-fix1`  
**Target Files:** `frontend/index.html`, `frontend/styles.css`, `frontend/js/ui.js`, `frontend/js/app.js`

---

## 1. Executive Summary & Authoritative Specification Source

The objective of this specification survey is to document the exact architectural, structural, and visual requirements to align the FoodJet web application's Home view and Header with the authoritative Figma design (**Figma Frame: Home - Desktop**, node ID `0-1`).

### Authoritative Visual Sources Inspected:
1. **`01-figma-home.png`** (`C:\Users\ORLANDO\.codex\visualizations\2026\10\29\01a189af-40f5-7701-8e6a-9addc1171a30\audit-web-oct31\01-figma-home.png`): The golden master desktop frame (1440px / 1280px). Clean white background, 2-line location header, central search bar, orange textual cart button ("Mi carrito · 3"), hero title/subtitle placed **before** the promotional banner, compact 2-half banner, compact 2-row horizontal filters, absence of the 4-benefits strip between banner and catalog, and full-width 3-column product grid with unclipped badges.
2. **`02-web-home.png`**: Previous web capture showing significant architectural deviations: dark background, legacy links ("Inicio", "Menú", "Nosotros", "Contacto") dominating the header, search bar missing from header, banner positioned at the very top without hero title, and giant 4-benefits strip pushing catalog down.
3. **`06-web-address.png`**: User profile & account modal capture.
4. **`07-web-catalog.png`**: Catalog view showing the title "Tu antojo. Sin escalas." misplaced below the banner, a permanently open lateral sidebar taking 25% width, and "PRECIO ESTUDIAN" badge clipped by the card container / heart icon.

---

## 2. Visual & Structural Discrepancy Matrix

| Feature Element | Figma Golden Master (`01-figma-home.png`) | Current Implementation (`index.html`, `02-web-home.png`, `07-web-catalog.png`) | Required Technical Adaptation |
|---|---|---|---|
| **Header Theme & Canvas** | Crisp white canvas (`#FFFFFF`), light border (`#E5E7EB`), dark typography (`#1C1C1C`). | Mixed legacy dark surfaces in audit capture, though CSS tokens contain light mode variables. | Ensure header is explicitly clean light theme (`bg-white` / `var(--color-surface)`). |
| **Brand Identity** | Bold orange "FOODJET" logo with lightning bolt / jet glyph on left. | Present in HTML (`.foodjet-navbar-brand`), styled with `.foodjet-brand-text`. | Preserve logo styling, link to `#homeView`. |
| **Location Selector** | 2-line stacked component: Top line: small secondary label "Enviar a casa" / "Entregar en"; Bottom line: bold detailed address "Av. Larco 812, Miraflores" + chevron down. | Single-line horizontal pill button with map pin icon and single text node `#headerAddressText`. | Refactor `#headerAddressBar` into 2-line layout (`.foodjet-address-stacked`): secondary label + main address text. |
| **Address Selector Behavior** | Clicking opens address picker / editor to select saved address, input new one, or trigger GPS explicitly. | Currently opens `#miCuentaModal` (profile/student modal), confusing address selection with account settings. | Introduce dedicated or accessible address selector modal/popover that integrates with `api.fetchMyAddressesAPI()`, synchronizes with checkout without duplicate DB entries, and requests GPS **only** on user click. |
| **Header Center** | Central search bar with search icon, placeholder "¿Qué se te antoja hoy?", and rounded pill container. | Center is occupied by legacy navigation links: "Inicio", "Menú", "Nosotros", "Contacto". Search bar was exiled to catalog section (`#menu`). | Move search bar (`#catalogSearchInput`, `#catalogSearchClear`) to the center of the navbar. Retract or eliminate legacy links from dominating desktop composition. |
| **Cart Button** | Vibrant orange textual pill button: `[bag icon] Mi carrito · 3` with high-contrast white text. | 44x44px icon-only button `#cartBtn` with tiny absolute counter badge `#cartCount` top-right. | Expand `#cartBtn` to textual button: `<i class="bi bi-bag-fill me-2"></i><span>Mi carrito</span><span class="cart-sep"> · </span><span id="cartCount">0</span>`. |
| **Vertical Order: Hero Title** | "Tu antojo. Sin escalas." + subtitle "Lo mejor del barrio, directo a tu puerta." appears **above** the promotional banner. | Title and subtitle were located on line 246, below both the banner and the 4 benefits! | Move hero title container to the top of `#homeView`, immediately below navbar and **before** the banner. |
| **Promotion Banner** | Compact horizontal banner split into two halves: Left: orange container with student promo copy & CTA; Right: full-bleed food photography. | Bulky carousel (3 slides) with inset padded image, top-down stock photo, white-on-white button, carousel dots below. | Redesign banner container: Left half (orange `#EA580C`) with yellow badge "POCO PRESUPUESTO, MUCHO SABOR.", title "Combos Estudiantes", text, and white button "Ver combos ↗"; Right half: full-bleed food photo. |
| **4 Benefits Strip** | Completely absent between banner and catalog. | Huge section with 4 orange circles ("Entrega Rápida", "Calidad Premium", "24/7 Disponible", "Pago Seguro") between banner and catalog. | **Remove from between banner and catalog.** Relocate to secondary section near footer or inside `#about`. |
| **Filters Architecture** | 2 compact horizontal rows below banner: Row 1: Category pills (Todos, Burgers, Pizza, Chaufa, Bowls, Extras); Row 2: Secondary pills ("Filtros", "★ 4.5+", "Menos de S/ 20.00", "⚡ Entrega rápida") + Sort dropdown. | Lateral column `col-lg-3` permanently taking 25% of grid width; catalog cramped in `col-lg-9`. | Eliminate lateral sidebar. Implement compact horizontal filter rows. "Filtros" button triggers accessible popover/drawer for price and time filters. |
| **Product Cards & Grid** | Full-width 3-column grid (`col-md-4` over `col-12`, ~380-420px per card). Badges ("PRECIO ESTUDIANTE", "MÁS PEDIDO") fit with ample space. | Cramped 3-column cards inside `col-lg-9` (~260px wide). "PRECIO ESTUDIANTE" clipped to "PRECIO ESTUDIAN". | Expand `#productsGrid` to full width `col-12`. Badges have full clearance without clipping. Maintain approved card structure, prices, and favorite toggles. |

---

## 3. Component-by-Component Specifications

### 3.1 Header & Top Navigation Bar

#### Brand Logo
- **DOM Container:** `<a class="navbar-brand d-flex align-items-center foodjet-navbar-brand me-3" href="#home" id="brandLogo">`
- **Elements:**
  - Text: `<span class="foodjet-brand-text">FOODJET</span>` (Font: 22px, weight: 800, color: `var(--color-primary, #F4511E)`)
  - Icon: `<i class="bi bi-lightning-charge-fill foodjet-brand-bolt ms-1" aria-hidden="true"></i>`
- **Behavior:** Clicking resets active view to `#homeView` and clears view stacks.

#### Location Selector (`headerAddressBar`)
- **Structure:**
  ```html
  <div class="foodjet-address-bar d-flex align-items-center cursor-pointer" id="headerAddressBar" role="button" tabindex="0" aria-label="Dirección de entrega actual: Av. Larco 812, Miraflores">
      <i class="bi bi-geo-alt-fill foodjet-address-bar__icon me-2" aria-hidden="true"></i>
      <div class="foodjet-address-bar__content d-flex flex-column text-start">
          <span class="foodjet-address-bar__label small text-muted">Entregar en</span>
          <span class="foodjet-address-bar__text text-truncate fw-bold" id="headerAddressText">Ingresar dirección de entrega</span>
      </div>
      <i class="bi bi-chevron-down foodjet-address-bar__chevron ms-2" aria-hidden="true"></i>
  </div>
  ```
- **States:**
  - **Neutral / Guest State:** When `window.currentUser == null` or user has no saved addresses:
    - Label: `Entregar en`
    - Text: `Ingresar dirección de entrega`
  - **Authenticated State:** Synchronized with `direccionInicial(guardadas)` via `ui.syncHeaderAddress()`:
    - Label: `Entregar en` (or `Casa` / `Oficina` if tag exists)
    - Text: `Av. Larco 812, Miraflores` (or user's default saved detailed address).
- **Interactive Selector Modal (`#addressSelectorModal`):**
  - Clicking `#headerAddressBar` must **not** navigate to `#miCuentaModal`.
  - It opens `#addressSelectorModal` (or an accessible popover).
  - Inside the modal:
    1. List of saved user addresses (rendered from `api.fetchMyAddressesAPI(token)`). Selecting an address marks it as selected, updates `#headerAddressText`, and syncs with checkout `#customerAddress` without duplicating database rows.
    2. Input to type a new address with optional map pin.
    3. Explicit button: `<button id="btnHeaderLocateGps"><i class="bi bi-crosshair"></i> Usar mi ubicación actual</button>`.
    4. **STRICT CONSTRAINT:** Geolocation (`navigator.geolocation.getCurrentPosition`) MUST ONLY be invoked when the user explicitly clicks this button. It must NEVER be triggered on page load or on modal open.

#### Central Search Bar
- **Position:** Placed centrally in the `<nav>` between the location selector and user actions.
- **Markup:**
  ```html
  <div class="foodjet-header-search flex-grow-1 mx-3 mx-lg-4 d-none d-md-block" style="max-width: 480px;">
      <div class="foodjet-search-bar position-relative">
          <i class="bi bi-search foodjet-search-icon" aria-hidden="true"></i>
          <input type="text" id="catalogSearchInput" class="foodjet-search-input" 
                 placeholder="¿Qué se te antoja hoy?" 
                 autocomplete="off" 
                 aria-label="Buscar comida, platos o restaurantes">
          <button type="button" id="catalogSearchClear" class="foodjet-search-clear d-none" 
                  aria-label="Limpiar búsqueda" title="Limpiar búsqueda">
              <i class="bi bi-x-circle-fill"></i>
          </button>
      </div>
  </div>
  ```
- **Behavior & Consumer Integration:**
  - Preserves exact IDs: `catalogSearchInput` and `catalogSearchClear`.
  - Driven by `ui.initCatalogSearch()`.
  - On `input` event: Filters `state.getProducts()` by product name, product description, and restaurant name. Real-time update of `#productsGrid` and `#catalogResultsCount`.
  - Mobile responsiveness: On screens `< 768px`, can collapse to a prominent search bar below the top bar or expand when tapped, without breaking `#catalogSearchInput`.

#### User Actions & Navigation Menu
- **Legacy Navigation Links:**
  - "Inicio", "Menú", "Nosotros", "Contacto" must be removed from the top desktop bar so they do not dominate the composition or crowd out the search bar.
  - Can be placed inside the mobile hamburger offcanvas/collapse or in the footer.
- **User Authentication Elements:**
  - **Guest:** `#loginNav` containing `#loginBtn` with `#userNameBtn` ("Ingresar").
  - **Authenticated:** `#userMenu` containing `#userDropdown` and `#userNameDropdown`, with dropdown items `#dashboardBtn` (admin operations), `#historyBtn` (order history), `#miCuentaBtn` (account & student status), and `#logoutBtn` (sign out).
  - **Favorites Button:** `#favoritesNav` containing `#favoritesBtn` with badge `#favoritesCount`.

#### Textual Cart Button ("Mi carrito · N")
- **Markup:**
  ```html
  <li class="nav-item ms-2 ms-lg-3">
      <button type="button" class="btn foodjet-cart-btn foodjet-cart-btn--textual position-relative d-inline-flex align-items-center" 
              id="cartBtn" aria-label="Carrito de compras" data-bs-toggle="offcanvas" data-bs-target="#cartOffcanvas">
          <i class="bi bi-bag-fill me-2 text-white" aria-hidden="true"></i>
          <span class="foodjet-cart-btn__label fw-bold text-white">Mi carrito</span>
          <span class="foodjet-cart-btn__sep text-white opacity-75 mx-1">·</span>
          <span class="cart-badge-text fw-bold text-white" id="cartCount">0</span>
      </button>
  </li>
  ```
- **Styling:**
  - Background: `var(--color-primary, #F4511E)` / `#EA580C`.
  - Border-radius: `var(--radius-pill, 999px)`.
  - Padding: `8px 18px`.
  - Text: High contrast white `#FFFFFF`.
  - Badge counter updates dynamically: `ui.renderCartOffcanvas()` sets `cartCount.textContent = count.toString()`. When count is 0, it shows `0` or `Mi carrito · 0`.

---

### 3.2 Vertical Ordering on Home View

The vertical flow must strictly adhere to the following sequence:

```
[ Top Navbar: Logo | Location | Central Search | User & Favorites | Mi carrito · N ]
                                    │
                                    ▼
[ Hero Header Section: Title "Tu antojo. Sin escalas." & Subtitle & Right Badge ]
                                    │
                                    ▼
[ Compact Split Promotion Banner: Left Orange Info | Right Full-Bleed Food Image ]
                                    │
                                    ▼
[ Compact Filter System: Row 1 Category Pills | Row 2 Quick Actions & "Filtros" Popover ]
                                    │
                                    ▼
[ Full-Width Product Catalog Grid: "Los favoritos del barrio" (3 Cards / Row) ]
                                    │
                                    ▼
[ Secondary / Footer Section: Re-located 4 Benefits, About FoodJet, Contact, Footer ]
```

#### 1. Hero Header Section (Placed BEFORE Banner)
- **Container:** `<section class="foodjet-hero-header-section pt-4 pb-2" aria-label="Bienvenida">`
- **Layout:** Flex row with space-between alignment:
  - **Left column:**
    - Main Headline: `<h1 class="display-6 fw-extrabold mb-1" style="color: var(--color-text-primary);">Tu antojo. Sin escalas.</h1>`
    - Subtitle: `<p class="text-secondary small mb-0">Lo mejor del barrio, directo a tu puerta.</p>`
  - **Right column (Desktop):**
    - Feature Callout: `<div class="d-none d-md-flex align-items-center text-secondary small gap-2"><i class="bi bi-stopwatch text-primary fs-5" aria-hidden="true"></i><span class="fw-semibold">Recién hecho. Rápido de verdad.</span></div>`

#### 2. Compact Split Promotion Banner
- **Container:** `<section class="foodjet-banner-section py-3" aria-label="Promoción destacada">`
- **Structure:**
  ```html
  <div class="foodjet-promo-banner rounded-4 overflow-hidden shadow-sm" style="background: linear-gradient(135deg, #EA580C 0%, #D94310 100%);">
      <div class="row g-0 align-items-stretch">
          <!-- Left Half: Promotion Text & Actions -->
          <div class="col-12 col-md-6 col-lg-7 p-4 p-lg-5 d-flex flex-column justify-content-center text-white">
              <div class="mb-2">
                  <span class="foodjet-badge foodjet-badge--student text-dark fw-bold">POCO PRESUPUESTO, MUCHO SABOR.</span>
              </div>
              <h2 class="display-6 fw-extrabold text-white mb-2">Combos Estudiantes</h2>
              <p class="text-white opacity-90 mb-4" style="max-width: 420px;">
                  Tu break merece algo épico. Combos desde S/ 16.90 con descuentos universitarios exclusivos.
              </p>
              <div>
                  <a href="#menu" class="btn btn-light rounded-pill px-4 py-2 fw-bold text-dark d-inline-flex align-items-center shadow-sm" id="bannerCtaBtn">
                      <span>Ver combos</span>
                      <i class="bi bi-arrow-up-right ms-2" aria-hidden="true"></i>
                  </a>
              </div>
          </div>
          <!-- Right Half: Full-Bleed Image inside Container -->
          <div class="col-12 col-md-6 col-lg-5 position-relative overflow-hidden foodjet-promo-banner__img-col">
              <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80" 
                   alt="Combos estudiantiles con hamburguesas y papas" 
                   class="w-100 h-100 object-fit-cover foodjet-promo-banner__img">
          </div>
      </div>
  </div>
  ```
- **Banner Details:**
  - Preserves real promotion data (Combos Estudiantes, real prices `S/ 16.90`, student discount info).
  - Right half image is **full-bleed** to the container edges without awkward inset padding or white borders.
  - White button has dark text `#1C1C1C` (WCAG AAA contrast 17.04:1), resolving the previous white-on-white text bug.

#### 3. Removal & Relocation of the 4 Benefits Strip
- **Action:** Remove the `row g-4` with the 4 orange circular icons ("Entrega Rápida", "Calidad Premium", "24/7 Disponible", "Pago Seguro") from between the banner and the menu section.
- **New Location:** Relocate to the bottom of the page, above `#about` or inside the footer container, preserving its informative and accessibility value without interrupting the shopping flow.

---

### 3.3 Filter Architecture: Compact Rows & Popover/Drawer

#### Row 1: Category Pills (`#filter-food-type-container`)
- Retains container ID: `id="filter-food-type-container"`.
- Contains horizontal scrolling / wrap list of category pills:
  - "Todos" (`#filter-cat-all`, active default).
  - Dynamic categories generated by `renderFoodTypeFilters()`: "Burgers", "Pizzas", "Chaufa", "Bowls", "Extras" (or categories matching seeded backend data).
  - Pill design: `class="foodjet-pill"` with subtle icon + label.

#### Row 2: Secondary Quick Filters & "Filtros" Button
- Horizontal bar placed directly below Row 1:
  ```html
  <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
      <!-- Quick Filter Buttons -->
      <div class="d-flex flex-wrap align-items-center gap-2">
          <!-- Popover / Modal Trigger Button -->
          <button type="button" class="btn foodjet-pill d-inline-flex align-items-center" id="btn-toggle-filters-popover" data-bs-toggle="collapse" data-bs-target="#filtersPanel" aria-expanded="false" aria-controls="filtersPanel">
              <i class="bi bi-sliders2 me-2" aria-hidden="true"></i>
              <span>Filtros</span>
          </button>

          <!-- Quick Pill 1: Top Rated -->
          <button type="button" class="foodjet-pill quick-filter-btn" data-filter="rating-45" id="quickFilterRating">
              <i class="bi bi-star-fill text-warning me-1"></i>
              <span>4.5+</span>
          </button>

          <!-- Quick Pill 2: Budget Friendly -->
          <button type="button" class="foodjet-pill quick-filter-btn" data-filter="price-20" id="quickFilterPrice">
              <span>Menos de S/ 20.00</span>
          </button>

          <!-- Quick Pill 3: Fast Delivery -->
          <button type="button" class="foodjet-pill quick-filter-btn" data-filter="fast-delivery" id="quickFilterDelivery">
              <i class="bi bi-lightning-charge-fill text-primary me-1"></i>
              <span>Entrega rápida</span>
          </button>
      </div>

      <!-- Sort Dropdown -->
      <div class="d-flex align-items-center gap-2">
          <label for="catalogSortSelect" class="small text-muted mb-0">Ordenar por:</label>
          <select id="catalogSortSelect" class="form-select form-select-sm border-0 bg-transparent fw-semibold" style="width: auto; cursor: pointer;">
              <option value="recommended" selected>Recomendados</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="rating-desc">Mejor calificados</option>
          </select>
      </div>
  </div>
  ```

#### Collapsible Popover / Drawer for Advanced Filters
- Instead of a permanent lateral column taking up 25% of the screen width, the advanced filters panel (`#filtersPanel`) collapses cleanly or opens as an accessible drawer/popover.
- **Preserved Form Controls:**
  - Price Range Inputs:
    - Min: `<input type="number" id="filter-price-min" ...>`
    - Max: `<input type="number" id="filter-price-max" ...>`
  - Delivery Time Radios:
    - 30 mins or less: `<input type="radio" class="filter-delivery-time" name="deliveryTimeFilter" id="time-30" value="30 minutos">`
    - Up to 1 hour: `<input type="radio" class="filter-delivery-time" name="deliveryTimeFilter" id="time-60" value="1 hora">`
    - More than 1 hour: `<input type="radio" class="filter-delivery-time" name="deliveryTimeFilter" id="time-more" value="Más de 1 hora">`
  - Action Buttons:
    - Apply: `<button class="btn foodjet-btn-primary" id="btn-apply-filters">Aplicar filtros</button>`
    - Clear: `<button class="btn foodjet-btn-secondary" id="btn-clear-filters">Limpiar filtros</button>`
- **Bidirectional Sync with Quick Pills:**
  - Clicking "Menos de S/ 20.00" sets `filter-price-max.value = '20'` and triggers `renderProducts()`.
  - Clicking "Entrega rápida" checks `time-30` and triggers `renderProducts()`.
  - Clicking "Limpiar filtros" resets inputs and unchecks pills.

---

### 3.4 Product Cards & Grid Layout

#### Grid Layout
- **Container:** `<div class="col-12">`
- **Header:**
  - Left: `<h3 class="h4 fw-bold mb-0">Los favoritos del barrio</h3>`
  - Right: `<span id="catalogResultsCount" class="text-muted small">8 productos</span>`
- **Product Row Container:** `<div class="row g-4" id="productsGrid">`
- **Desktop Sizing:** Each card column is `<div class="col-12 col-sm-6 col-lg-4 mb-4">`.
  - On 1440px / 1280px containers: Exactly **3 cards per row**.
  - Width per card: ~380px to ~420px. This provides 50% more horizontal clearance than the old sidebar layout!

#### Card Anatomy & Badge Anti-Clipping Fix
- **Image & Badge Clearance:**
  - In `07-web-catalog.png`, the yellow badge was clipped to "PRECIO ESTUDIAN" because:
    1. The badge container was pinned top-left with limited width.
    2. The card was squeezed to < 260px in `col-lg-9`.
    3. The absolute favorite heart button on the top-right occupied 34px + 8px margin.
  - **Fix:**
    - With the full-width grid, each card is >= 380px wide.
    - Set `.product-card__badge-container` to:
      ```css
      .product-card__badge-container {
          position: absolute;
          top: 10px;
          left: 10px;
          max-width: calc(100% - 60px);
          z-index: 3;
      }
      .foodjet-badge {
          white-space: nowrap;
          overflow: visible;
          text-overflow: clip;
      }
      ```
    - This guarantees "PRECIO ESTUDIANTE" renders with full letter spacing and zero truncation.
- **Card Content:**
  - Rating & Delivery Time: `<span class="badge-rating"><i class="bi bi-star-fill text-warning"></i> 4.9 (125)</span> • <span>20-30 min</span>`
  - Product Name: `<h5 class="product-card__title text-truncate">${product.nombre}</h5>`
  - Description: `<p class="product-card__desc">${product.descripcion}</p>`
  - Price & Action Row:
    - Regular / Student price: `renderProductPrice(product, window.currentUser)`
    - Add to Cart button: `<button class="product-card__add-btn add-to-cart" data-id="${product.id}"><i class="bi bi-plus-lg"></i></button>`
- **No Invented Backend Data Rule:**
  - Delivery time uses `product.Restaurant?.tiempo_entrega || '30 min'` from existing backend relationship.
  - Ratings use existing attributes or fall back gracefully without introducing fictitious DB fields or fake mutations.

---

## 4. Comprehensive DOM Contract Inventory

To ensure zero regressions across existing test suites (`tests/empirical_m2_1_audit.mjs`, `tests/unit/domain.test.mjs`, Cucumber frontend & backend), all baseline DOM IDs must be strictly preserved.

### 4.1 Preserved Header DOM IDs

| DOM ID | Element Type | Role / Binding | Consumer Script |
|---|---|---|---|
| `navbar` | `<nav>` | Top navigation bar element | `index.html`, Bootstrap CSS |
| `headerAddressBar` | `<div>` | Delivery location button | `ui.js:initHeaderAddress()`, `app.js` |
| `headerAddressText` | `<span>` | Current address display text | `ui.js:updateHeaderAddress()`, `ui.js:syncHeaderAddress()` |
| `navbarNav` | `<div>` | Collapsible navigation container | Bootstrap navbar toggler |
| `favoritesNav` | `<li>` | Container for favorites button | `legacy.js:updateUserUI()` (shows when logged in) |
| `favoritesBtn` | `<button>` | Opens favorites offcanvas | `index.html` (data-bs-target="#favoritesOffcanvas") |
| `favoritesCount` | `<span>` | Reactive favorites count badge | `ui.js:renderFavoritesOffcanvas()`, `legacy.js` |
| `cartBtn` | `<button>` | Opens cart offcanvas | `app.js:initEventListeners()`, `app.js:openCart()` |
| `cartCount` | `<span>` | Reactive cart item counter | `ui.js:renderCartOffcanvas()`, `styles.css` |
| `userMenu` | `<li>` | Authenticated user dropdown container | `legacy.js:updateUserUI()` |
| `userDropdown` | `<a>` | User dropdown trigger | Bootstrap dropdown, `legacy.js` |
| `userNameDropdown`| `<span>` | Display logged-in user name | `legacy.js:updateUserUI()` |
| `dashboardBtn` | `<a>` | Admin operations panel shortcut | `legacy.js:updateUserUI()` (admin only) |
| `historyBtn` | `<a>` | Order history navigation button | `app.js:initEventListeners()`, `handleHistoryClick()` |
| `miCuentaBtn` | `<a>` | My account / Student verification modal | `index.html` (data-bs-target="#miCuentaModal") |
| `logoutBtn` | `<a>` | Sign out button | `legacy.js`, `app.js` |
| `loginNav` | `<li>` | Guest login container | `legacy.js:updateUserUI()` (shows when logged out) |
| `loginBtn` | `<button>` | Login modal trigger | `index.html` (data-bs-target="#loginModal") |
| `userNameBtn` | `<span>` | Text inside login button ("Ingresar")| `legacy.js:updateUserUI()` |

### 4.2 Preserved Home View & Catalog DOM IDs

| DOM ID | Element Type | Role / Binding | Consumer Script |
|---|---|---|---|
| `homeView` | `<div>` | Main Home view root container | `ui.js:showView('homeView')`, `app.js` |
| `heroCarousel` | `<div>` | Banner / Hero container | `tests/empirical_m2_1_audit.mjs` |
| `menu` | `<section>` | Menu & Catalog section container | Anchor links (`#menu`), `tests` |
| `catalogSearchInput` | `<input>` | Real-time text search input | `ui.js:initCatalogSearch()`, `ui.js:renderProducts()`, `empirical_m2_1_audit.mjs` |
| `catalogSearchClear` | `<button>` | Clear search input button | `ui.js:initCatalogSearch()`, `empirical_m2_1_audit.mjs` |
| `filter-food-type-container`| `<div>` | Container for dynamic category pills | `ui.js:renderFoodTypeFilters()`, `empirical_m2_1_audit.mjs` |
| `filter-price-min` | `<input>` | Minimum price filter | `ui.js:renderProducts()`, `app.js:initEventListeners()` |
| `filter-price-max` | `<input>` | Maximum price filter | `ui.js:renderProducts()`, `app.js:initEventListeners()` |
| `time-30` | `<input radio>`| Delivery time <= 30 mins | `ui.js:renderProducts()`, `index.html` |
| `time-60` | `<input radio>`| Delivery time <= 60 mins | `ui.js:renderProducts()`, `index.html` |
| `time-more` | `<input radio>`| Delivery time > 60 mins | `ui.js:renderProducts()`, `index.html` |
| `btn-apply-filters` | `<button>` | Apply filters button | `app.js:initEventListeners()` |
| `btn-clear-filters` | `<button>` | Reset filters button | `app.js:initEventListeners()`, `ui.js:resetAllCatalogFilters()` |
| `catalogResultsCount` | `<span>` | Product count feedback | `ui.js:renderProducts()` |
| `productsGrid` | `<div>` | Dynamic product cards grid container | `ui.js:renderProducts()`, `ui.js:renderCatalogLoading()` |
| `about` | `<section>` | About section | Anchor links, footer |
| `contact` | `<section>` | Contact section | Anchor links, footer |

### 4.3 Preserved Modals & Offcanvas IDs

| DOM ID | Element Type | Role / Binding |
|---|---|---|
| `cartOffcanvas` | `<div>` | Offcanvas cart panel |
| `cartItemCount` | `<span>` | Cart drawer item counter |
| `cartRestaurantBanner` | `<div>` | Active single-restaurant alert |
| `cartItems` | `<div>` | Cart items container |
| `emptyCart` | `<div>` | Empty cart placeholder |
| `cartFooter` | `<div>` | Subtotal, savings, checkout CTA |
| `cartSubtotal` | `<span>` | Cart subtotal amount |
| `cartStudentSavingsRow`| `<div>` | Student savings row |
| `cartStudentSavings` | `<span>` | Student savings amount |
| `cartTotal` | `<span>` | Cart total amount |
| `checkoutBtn` | `<button>` | Navigate to checkout |
| `favoritesOffcanvas`| `<div>` | Offcanvas favorites panel |
| `favoritesCountBadge`| `<span>` | Favorites drawer counter |
| `favoritesItemsContainer`| `<div>`| Favorites list container |
| `loginModal` | `<div>` | Login modal |
| `registerModal` | `<div>` | Registration modal |
| `miCuentaModal` | `<div>` | Account & student verification modal |
| `restaurantChangeModal`| `<div>` | Single restaurant conflict warning |

### 4.4 New DOM IDs Proposed for Figma Alignment

| Proposed DOM ID | Element Type | Placement | Purpose |
|---|---|---|---|
| `addressSelectorModal`| `<div class="modal">` | Body root | Dedicated address selection and editing modal (avoids overloading `miCuentaModal`) |
| `savedAddressCardsList`| `<div>` | Inside `addressSelectorModal` | Display saved user addresses with click-to-select |
| `btnHeaderLocateGps` | `<button>` | Inside `addressSelectorModal` | Explicit user button to trigger geolocation |
| `btn-toggle-filters-popover`| `<button>` | Row 2 of filters | Opens the compact popover/drawer for price and delivery time filters |
| `filtersPanel` | `<div>` | Under filter row | Collapsible panel / drawer containing price and delivery inputs |
| `quickFilterRating` | `<button>` | Row 2 of filters | Quick filter for rating >= 4.5 |
| `quickFilterPrice` | `<button>` | Row 2 of filters | Quick filter for price <= S/ 20.00 |
| `quickFilterDelivery`| `<button>` | Row 2 of filters | Quick filter for fast delivery (<= 30 min) |
| `catalogSortSelect` | `<select>` | Right side of Row 2 | Dropdown to sort products (Recommended, Price Asc/Desc, Rating) |

---

## 5. Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Header | 2-Line Stacked Address Bar | Displays secondary label ("Entregar en") and primary address text with chevron icon | User saved address or neutral prompt | Rendered 2-line header widget | Falls back to "Ingresar dirección de entrega" if no user/address | `01-figma-home.png`, `ui.js:syncHeaderAddress()` |
| 2 | Header | Central Search Input | Integrated header search for meals, descriptions, and restaurants | Text input string | Real-time filtered `#productsGrid` and count | Displays zero results state `#btn-zero-clear-filters` if no match | `01-figma-home.png`, `ui.js:initCatalogSearch()` |
| 3 | Header | Textual Cart CTA | High-contrast orange pill button displaying "Mi carrito · N" | `state.getCartItemCount()` | Updated button text and counter | Renders `Mi carrito · 0` when empty | `01-figma-home.png`, `ui.js:renderCartOffcanvas()` |
| 4 | Header | Header Address Selector Modal | Allows selecting/editing delivery address with sync to checkout | User click on address bar | Opens `#addressSelectorModal` | Doesn't create duplicate addresses if coordinates match within 25m | `ORIGINAL_REQUEST.md`, `ubicacion.js` |
| 5 | Header | Explicit GPS Trigger | Requests browser geolocation only upon explicit user action | Click on `#btnHeaderLocateGps` | Fills coordinates into address model | Shows warning toast if geolocation denied or unsupported | `ORIGINAL_REQUEST.md`, `ui.js:requestUserLocation()` |
| 6 | Home View | Hero Headline Pre-Banner | "Tu antojo. Sin escalas." & subtitle placed above promotional banner | None (static hero) | Clean top-level heading | Accessible heading with tabindex | `01-figma-home.png`, `index.html` |
| 7 | Home View | Split Promotion Banner | Two-halves layout: left copy with student discount info, right full-bleed photography | Banner data / image URL | Responsive split hero banner | High contrast white text on orange background (WCAG AAA) | `01-figma-home.png`, `styles.css` |
| 8 | Home View | 4-Benefits Relocation | 4 service advantages strip removed from between banner and catalog | None | Relocated to secondary section / footer | Does not block catalog or increase scroll debt | `ORIGINAL_REQUEST.md`, `01-figma-home.png` |
| 9 | Filters | Compact Category Pills | Horizontal scrollable row of category pills (Todos, Burgers, Pizza, Chaufa...) | `state.getProducts()` categories | Rendered pills in `#filter-food-type-container` | "Todos" acts as default active state | `01-figma-home.png`, `ui.js:renderFoodTypeFilters()` |
| 10 | Filters | Quick Action Filter Pills | Single-tap pills for "★ 4.5+", "Menos de S/ 20.00", "⚡ Entrega rápida" | User click event | Sets corresponding filter state and re-renders grid | Unclicking resets filter state | `01-figma-home.png` |
| 11 | Filters | Collapsible Advanced Filters | Popover / collapsible drawer housing price inputs and delivery radio buttons | Toggle click on "Filtros" button | Expands `#filtersPanel` | Inputs retain baseline IDs and sync with quick pills | `ORIGINAL_REQUEST.md`, `index.html` |
| 12 | Catalog | Full-Width 3-Column Grid | Catalog spans full width `col-12` with 3 cards per row on desktop | Filtered product array | Rendered cards in `#productsGrid` | Empty state with reset button if 0 items match | `01-figma-home.png`, `ui.js:renderProducts()` |
| 13 | Catalog | Anti-Clipping Badge Layout | Ample badge clearance so "PRECIO ESTUDIANTE" is never truncated | `product.descuento_estudiante`, `currentUser.es_estudiante` | Yellow pill badge with `#1C1C1C` text | Overflow visible, avoids overlap with favorite button | `07-web-catalog.png`, `styles.css` |
| 14 | Catalog | Product Sorting Dropdown | Sorts visible catalog by Recommended, Price (Asc/Desc), or Rating | Select change event | Re-ordered product list | Maintains active filters during sort | `01-figma-home.png` |
| 15 | Accessibility | Visible Keyboard Focus & ARIA | WCAG 2.2 focus rings, keyboard navigation, skip-link, labels | Keyboard TAB, Enter, Space | Visual focus indicator (2px orange ring) | Traps outline to mouse clicks via `:focus-visible` | `styles.css:1228-1275` |

---

## 6. Edge Cases & Boundary Conditions

| # | Feature | Input / Condition | Observed / Required Behavior |
|---|---|---|---|
| 1 | Search Bar | Special regex characters: `[Combo]`, `*Especial*`, `\ Central`, `$10`, `(con papas)` | Safely escaped or searched via string `includes()` without crashing regex engine. Tested in `empirical_m2_1_stress.mjs`. |
| 2 | Search Bar | Unicode characters & emojis: `🍣`, `🍱` | Correctly matches UTF-8 strings in product names and descriptions. |
| 3 | Search Bar | Whitespace only query (`"   "`) | Treated as empty query; resets search filter and displays full catalog. |
| 4 | Search Bar | Zero results match (`"xyz999nonexistent"`) | Displays `#btn-zero-clear-filters` empty state with clear button to restore catalog. |
| 5 | Address Bar | Guest user (no auth token) | Header displays neutral prompt "Ingresar dirección de entrega". Clicking prompts `#loginModal` or allows guest address input. |
| 6 | Address Bar | Authenticated user with multiple saved addresses | Selects default (`es_predeterminada: true`) or first saved address. Selecting a different address updates header and checkout without adding duplicate rows if within 25m. |
| 7 | GPS Geolocation | User denies browser permission | Traps `navigator.geolocation` error code 1 (`PERMISSION_DENIED`), displays warning toast, and keeps manual text address field active. Does not hang or loop. |
| 8 | GPS Geolocation | Page load or refresh | **Zero geolocation requests.** GPS is strictly quarantined behind explicit click on locate button. |
| 9 | Filter Popover | Min price greater than Max price (e.g. Min: 30, Max: 15) | Catalog displays zero results state without JavaScript runtime exception. |
| 10 | Quick Pills | Combinable filters (e.g. "Burgers" + "Menos de S/ 20.00" + "★ 4.5+") | Applies intersection (AND logic): only Burger products priced <= S/ 20.00 with rating >= 4.5 are returned. |
| 11 | Cart Counter | Empty cart (0 items) | Cart button displays `Mi carrito · 0` or hides `0` while maintaining button shape and contrast. |
| 12 | Cart Counter | Large quantity (> 99 items) | Counter displays cleanly inside button pill without breaking text line or overflowing button border. |
| 13 | Badges | Long badge text on narrow mobile viewport (390px) | Card width is ~350px on single-column mobile; badge container has `max-width: calc(100% - 60px)`, preventing collision with favorite button. |
| 14 | Theme Contrast | Yellow badge (`#FCD460`) on orange or dark backgrounds | Uses dark text `#1C1C1C !important` yielding 11.95:1 contrast (WCAG AAA compliant). |
| 15 | High Contrast Mode | Windows / OS High Contrast active (`prefers-contrast: high`) | Card borders, buttons, and inputs enforce 2px solid outlines. |

---

## 7. Responsive Viewport Specifications

| Viewport Width | Device Target | Header Behavior | Hero & Banner Behavior | Filters & Catalog Layout |
|---|---|---|---|---|
| **1440px** | Large Desktop (Figma Golden Master) | Full horizontal bar: Logo + 2-line location + 480px central search + User menu + Textual cart button. | Title & subtitle at top; 2-halves split banner (60/40); right photo full-bleed. | Row 1 category pills; Row 2 quick filters + sort; 3 cards per row (~400px wide). |
| **1280px** | Standard Desktop | Full horizontal bar: Logo + 2-line location + 380px central search + User menu + Textual cart button. | Title & subtitle at top; 2-halves split banner (50/50); right photo full-bleed. | Row 1 category pills; Row 2 quick filters + sort; 3 cards per row (~360px wide). |
| **768px** | Tablet | Logo + location bar; search collapses to full-width bar under navbar or expands on icon tap; textual cart button. | Hero title centered or left-aligned; banner stacks or maintains compact height. | Category pills scroll horizontally (`overflow-x: auto`); 2 cards per row (`col-sm-6`). |
| **390px** | Mobile (iOS / Android) | Brand logo left; hamburger toggler and cart button right; address bar full-width below; central search full-width. | Hero title compact; banner stacks vertically (photo on top or bottom, contained); no text overflow. | Category pills swipeable with hidden scrollbar; advanced filters collapse; 1 card per row (`col-12`). |

---

## 8. Verification Strategy & Acceptance Method

Before handoff, verify the specification against the project test suite and authoritative frames:

1. **DOM ID Integrity Audit:**
   ```bash
   node tests/empirical_m2_1_audit.mjs
   ```
   *Expectation:* 0 missing baseline IDs (all 165 preserved), 0 duplicate IDs, 100% pass on Milestone 2 IDs.
2. **Adversarial & Stress Unit Tests:**
   ```bash
   node tests/empirical_m2_1_stress.mjs
   npm run test:unit
   ```
   *Expectation:* 25 unit tests pass, adversarial query filtering passes.
3. **Frontend BDD Cucumber Suite:**
   ```bash
   npm run test:frontend
   ```
   *Expectation:* 86 scenarios pass (327 steps).
4. **Visual Frame Verification (DevTools / Headless Capture):**
   - Compare new capture of Home view at 1440px and 1280px against `01-figma-home.png`.
   - Verify vertical ordering: Title/subtitle -> Banner -> Compact filters -> Full-width 3-column catalog.
   - Verify absence of 4-benefits strip between banner and catalog.
   - Verify textual cart button "Mi carrito · N".
   - Verify unclipped badges on product cards.
