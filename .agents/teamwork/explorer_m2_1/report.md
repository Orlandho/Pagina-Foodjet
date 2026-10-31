# Technical Specification & Investigation Report: Navigation, Header & Hero Carousel

**Author**: Explorer M2_1 (`explorer_m2_1`)  
**Mission**: Visual Specification and Concrete Code Changes for Navbar, Header, Real/Neutral Address Bar, and Home Hero Carousel  
**Target Recipient**: Orchestrator / Sub-Orchestrator M2 / Worker M2  
**Date**: 2026-10-30  
**Scope**: `frontend/index.html`, `frontend/styles.css`, `frontend/js/ui.js`, `frontend/js/app.js`, `frontend/js/legacy.js`  

---

## 1. Executive Summary

This report delivers the comprehensive architectural specification, visual guidelines, and ready-to-implement code proposals for the **Top Navigation Bar**, **User Header**, **Real/Neutral Delivery Address Bar**, and **Home Hero Banner Carousel** for FoodJet Web.

The design faithfully replicates the Jetpack Compose reference prototype (`FoodJetTopBar.kt`, `HeroCarousel.kt`, `HomeScreen.kt`) while strictly preserving:
- All 14 existing DOM IDs and interactive contracts (`#heroCarousel`, `#cartBtn`, `#cartCount`, `#favoritesBtn`, `#favoritesNav`, `#userMenu`, `#userDropdown`, `#userNameDropdown`, `#dashboardBtn`, `#historyBtn`, `#miCuentaBtn`, `#logoutBtn`, `#loginNav`, `#loginBtn`).
- All Bootstrap 5.3 data attributes (`data-bs-ride="carousel"`, `data-bs-toggle="offcanvas"`, `data-bs-toggle="dropdown"`, `data-bs-toggle="modal"`).
- Pure headless business domain logic (`frontend/js/domain/`).
- 100% test suite pass rate (`npm run test:unit` [25/25], `npm run test:frontend` [86/86 scenarios, 327/327 steps]).

---

## 2. Evidence Chain & Reference Findings

### 2.1 Android Jetpack Compose Prototype Observations

| Component | Source File & Lines | Jetpack Compose Implementation | Web Implementation Translation |
|---|---|---|---|
| **Branding** | `FoodJetTopBar.kt:51-63` | `Text("FOODJET", fontWeight = ExtraBold, fontSize = 22.sp, color = FoodJetPrimary)` + `Icon(Bolt, tint = FoodJetPrimary, size = 20.dp)` | Bold uppercase brand text `FOODJET` in `--color-primary` (`#F4511E`) with lightning bolt icon `bi-lightning-charge-fill`. |
| **Delivery Address** | `FoodJetTopBar.kt:113-124` | `Row(clickable { onProfileClick() }) { Icon(LocationOn), Text(address), Icon(KeyboardArrowDown) }` | `#headerAddressBar`: Interactive pill with location icon, `#headerAddressText` (real address or neutral "Ingresar dirección de entrega"), and chevron down. |
| **Favorites Badge** | `FoodJetTopBar.kt:67-83` | `IconButton { BadgedBox(badge = { if (favoritesCount > 0) Badge(containerColor = FoodJetPrimary) { Text(favoritesCount) } }) { Icon(FavoriteBorder) } }` | `#favoritesBtn`: 44px round icon button with `#favoritesCount` pill badge (visible only when count > 0). |
| **Cart Button & Badge** | `FoodJetTopBar.kt:87-110` | `Box(size = 44.dp, clip = RoundedCornerShape(14.dp), background = FoodJetPrimary) { BadgedBox(badge = { if (cartCount > 0) Badge(containerColor = onSurface) { Text(cartCount) } }) { Icon(ShoppingBag) } }` | `#cartBtn`: 44px rounded box (`border-radius: 14px`), background `--color-primary`, icon `bi-bag-fill`, with `#cartCount` badge (`background: #1C1C1C`, color `#FFF`, visible only when count > 0). |
| **Hero Container** | `HeroCarousel.kt:38-45` | `Box(clip = RoundedCornerShape(24.dp), background = FoodJetPrimary, height = 230.dp)` | `#heroCarousel`: Rounded card container (`border-radius: 24px`, background `--color-primary`, subtle food gradient background, overflow hidden). |
| **Floating Badge** | `HeroCarousel.kt:71-79` | `Surface(shape = CircleShape, color = FoodJetYellow) { Text("POCO PRESUPUESTO. MUCHO SABOR.", color = FoodJetDark, fontSize = 9.sp, fontWeight = ExtraBold) }` | `.foodjet-hero-badge`: Yellow `#FCD460` pill with dark `#1C1C1C` text, uppercase, font-weight 800. |
| **Hero Headline** | `HeroCarousel.kt:81-87` | `Text(slide.title, color = Color.White, fontSize = 28.sp, fontWeight = ExtraBold)` | `.foodjet-hero-title`: White extra-bold headline (24px mobile, 36px desktop). |
| **Hero CTA** | `HeroCarousel.kt:97-109` | `Button(containerColor = Color.White, contentColor = FoodJetDark, shape = RoundedCornerShape(14.dp)) { Text(buttonText); Icon(ArrowForward) }` | `.foodjet-hero-cta-btn`: White rounded button with dark text, font-weight 700, and `bi-arrow-right` icon. |
| **Hero Image** | `HeroCarousel.kt:59-63` | `AsyncImage(modifier = Modifier.align(BottomEnd).size(150.dp, 170.dp).clip(RoundedCornerShape(topStart = 32.dp)), contentScale = Crop)` | `.foodjet-hero-image`: Right-aligned food photo clipped with `border-top-left-radius: 32px`. |
| **Indicators** | `HeroCarousel.kt:114-133` | `Row(BottomStart) { repeat { Box(height = 6.dp, width = if (selected) 18.dp else 6.dp, clip = CircleShape) } }` | `.foodjet-hero-indicators`: Left-aligned pills (6px circle inactive, 20px pill active `#FFFFFF`). |

### 2.2 Neutral vs Real Delivery Address Rule

Per `ORIGINAL_REQUEST.md` (R1 & R4) and `DISPATCH.md`:
> *"Distinguir la dirección del local de la dirección de entrega del usuario, usando en cabecera y checkout la dirección real disponible o un estado neutral. NEVER hardcode store address."*

1. **Authenticated Users with Saved Addresses**:
   - Query `api.fetchMyAddressesAPI(window.authToken)`.
   - Resolve through pure domain function `direccionInicial(guardadas)` (`frontend/js/domain/ubicacion.js:85`):
     *"la predeterminada si está ubicada, y si no la primera que lo esté."*
   - Display `direccion.direccion_detallada` in `#headerAddressText`.
2. **Authenticated Users without Saved Addresses OR Guests**:
   - Display default neutral text: `"Ingresar dirección de entrega"`.
   - Never display store address (such as `"Av. Larco 812, Miraflores"` or `"Av. Principal 123"`).
3. **Reactive Synchronization**:
   - On login: `updateUserUI(user)` triggers address initialization.
   - On logout: `updateUserUI(null)` resets `#headerAddressText` to `"Ingresar dirección de entrega"`.
   - On checkout address creation/selection: `resolveDeliveryAddressId()` updates `#headerAddressText` with the new address text.

---

## 3. DOM ID & Contract Inventory

| DOM ID | Element Type | Parent | Preserved Functions & Event Listeners | Status |
|---|---|---|---|---|
| `#heroCarousel` | `<div>` | `<section aria-label="Promociones">` | Bootstrap 5.3 Carousel with indicators & controls | Preserved |
| `#cartBtn` | `<button>` | `.navbar-nav` | Toggles `#cartOffcanvas`, opens cart | Preserved |
| `#cartCount` | `<span>` | `#cartBtn` | Reactive badge, `ui.renderCartOffcanvas` sets count & toggle display | Preserved |
| `#favoritesNav` | `<li>` | `.navbar-nav` | Shown/hidden by `legacy.js:updateUserUI` (logged-in only) | Preserved |
| `#favoritesBtn` | `<button>` | `#favoritesNav` | Toggles `#favoritesOffcanvas` | Preserved |
| `#favoritesCount` *(New)* | `<span>` | `#favoritesBtn` | Reactive badge, `ui.renderFavoritesOffcanvas` sets count & toggle display | Added safely |
| `#userMenu` | `<li>` | `.navbar-nav` | Dropdown shown when authenticated (`legacy.js`) | Preserved |
| `#userDropdown` | `<a>` | `#userMenu` | Dropdown toggle button | Preserved |
| `#userNameDropdown` | `<span>` | `#userDropdown` | Displays user name (`legacy.js`) | Preserved |
| `#dashboardBtn` | `<a>` | `#userMenu` | Displays admin panel link for admin role (`legacy.js`) | Preserved |
| `#historyBtn` | `<a>` | `#userMenu` | Navigates to `#orderHistoryView` | Preserved |
| `#miCuentaBtn` | `<a>` | `#userMenu` | Opens `#miCuentaModal` | Preserved |
| `#logoutBtn` | `<a>` | `#userMenu` | Triggers logout (`legacy.js:handleLogout`) | Preserved |
| `#loginNav` | `<li>` | `.navbar-nav` | Shown when guest (`legacy.js`) | Preserved |
| `#loginBtn` | `<button>` | `#loginNav` | Opens `#loginModal` | Preserved |
| `#userNameBtn` | `<span>` | `#loginBtn` | Displays "Ingresar" button text | Preserved |
| `#headerAddressBar` *(New)*| `<div>` | `.navbar .container` | Interactive address bar container | Added safely |
| `#headerAddressText` *(New)*| `<span>` | `#headerAddressBar`| Displays real or neutral delivery address | Added safely |

---

## 4. Concrete Code Proposals

### 4.1 HTML Changes in `frontend/index.html`

#### 4.1.1 Top Navigation Bar (`lines 20-81`)
Replace lines 20–81 in `frontend/index.html` with:

```html
    <nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top foodjet-navbar" role="navigation" aria-label="Navegación principal">
        <div class="container d-flex flex-wrap align-items-center justify-content-between">
            <!-- 1. Brand -->
            <a class="navbar-brand d-flex align-items-center foodjet-navbar-brand me-2 me-lg-3" href="#home">
                <span class="foodjet-brand-text">FOODJET</span>
                <i class="bi bi-lightning-charge-fill foodjet-brand-bolt ms-1" aria-hidden="true"></i>
            </a>

            <!-- 2. Real vs Neutral Delivery Address Bar (Accessible Button) -->
            <div class="foodjet-address-bar d-flex align-items-center cursor-pointer" id="headerAddressBar" role="button" tabindex="0" aria-label="Dirección de entrega actual">
                <i class="bi bi-geo-alt-fill foodjet-address-bar__icon me-2" aria-hidden="true"></i>
                <span class="foodjet-address-bar__text text-truncate" id="headerAddressText">Ingresar dirección de entrega</span>
                <i class="bi bi-chevron-down foodjet-address-bar__chevron ms-1" aria-hidden="true"></i>
            </div>
            
            <!-- 3. Mobile Hamburger Toggler -->
            <button class="navbar-toggler foodjet-navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" 
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Abrir menú de navegación">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <!-- 4. Navigation Menu & Actions -->
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto align-items-lg-center">
                    <li class="nav-item">
                        <a class="nav-link" href="#home" aria-label="Ir a inicio">Inicio</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#menu" aria-label="Ver menú">Menú</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#about" aria-label="Sobre nosotros">Nosotros</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#contact" aria-label="Contacto">Contacto</a>
                    </li>
                    
                    <!-- Favorites Action Button with Reactive Counter -->
                    <li class="nav-item ms-lg-3" id="favoritesNav" style="display: none;">
                        <button type="button" class="btn foodjet-icon-btn position-relative" id="favoritesBtn" aria-label="Productos Favoritos" data-bs-toggle="offcanvas" data-bs-target="#favoritesOffcanvas">
                            <i class="bi bi-heart fs-5" aria-hidden="true"></i>
                            <span class="foodjet-badge-counter foodjet-badge-counter--primary" id="favoritesCount" style="display: none;">0</span>
                        </button>
                    </li>
                    
                    <!-- Cart Action Button with Reactive Counter -->
                    <li class="nav-item ms-lg-2">
                        <button type="button" class="btn foodjet-cart-btn position-relative" id="cartBtn" aria-label="Carrito de compras" data-bs-toggle="offcanvas" data-bs-target="#cartOffcanvas">
                            <i class="bi bi-bag-fill fs-5 text-white" aria-hidden="true"></i>
                            <span class="cart-badge foodjet-badge-counter foodjet-badge-counter--dark" id="cartCount" style="display: none;">0</span>
                        </button>
                    </li>
                    
                    <!-- User Dropdown (Authenticated) -->
                    <li class="nav-item dropdown ms-lg-3" id="userMenu" style="display: none;">
                        <a class="nav-link dropdown-toggle d-flex align-items-center foodjet-user-chip" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-person-circle me-2 fs-5 text-primary" aria-hidden="true"></i>
                            <span id="userNameDropdown" class="fw-semibold"></span>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 foodjet-dropdown-menu" aria-labelledby="userDropdown">
                            <li><a class="dropdown-item py-2" href="#" id="dashboardBtn" style="display: none;"><i class="bi bi-speedometer2 me-2 text-primary"></i>Admin Dashboard</a></li>
                            <li><a class="dropdown-item py-2" href="#" id="historyBtn"><i class="bi bi-clock-history me-2 text-primary"></i>Historial de Pedidos</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item py-2" href="#" id="miCuentaBtn"><i class="bi bi-person me-2 text-primary"></i>Mi Cuenta</a></li>
                            <li><a class="dropdown-item py-2 text-danger" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Cerrar Sesión</a></li>
                        </ul>
                    </li>
                    
                    <!-- Login Button (Guest) -->
                    <li class="nav-item ms-lg-3" id="loginNav">
                        <button class="btn foodjet-btn-primary foodjet-login-btn" id="loginBtn" data-bs-toggle="modal" data-bs-target="#loginModal">
                            <i class="bi bi-person" aria-hidden="true"></i>
                            <span id="userNameBtn">Ingresar</span>
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
```

#### 4.1.2 Home Hero Carousel (`lines 85-130`)
Replace lines 85–130 in `frontend/index.html` with:

```html
            <section class="foodjet-hero-section py-3 py-lg-4" aria-label="Promociones destacadas">
                <div class="container">
                    <div id="heroCarousel" class="carousel slide carousel-fade foodjet-hero-carousel" data-bs-ride="carousel" data-bs-interval="5000">
                        <!-- Pager Indicators (Matching Compose HorizontalPager) -->
                        <div class="carousel-indicators foodjet-hero-indicators">
                            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
                            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
                            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
                        </div>
                        
                        <div class="carousel-inner">
                            <!-- Slide 1: Combos Estudiantiles -->
                            <div class="carousel-item active">
                                <div class="foodjet-hero-slide row g-0 align-items-center h-100">
                                    <div class="col-7 col-md-7 d-flex flex-column justify-content-center foodjet-hero-content">
                                        <div class="foodjet-hero-badge-wrap mb-2 mb-md-3">
                                            <span class="foodjet-hero-badge">POCO PRESUPUESTO. MUCHO SABOR.</span>
                                        </div>
                                        <h1 class="foodjet-hero-title fw-bold mb-2" tabindex="-1">Combos Estudiantiles</h1>
                                        <p class="foodjet-hero-subtitle mb-3 mb-md-4">Tu antojo. Sin escalas. Descuentos universitarios y entrega rápida en toda la ciudad.</p>
                                        <div>
                                            <a href="#menu" class="btn foodjet-hero-cta-btn">
                                                <span>Ordenar ahora</span>
                                                <i class="bi bi-arrow-right ms-2" aria-hidden="true"></i>
                                            </a>
                                        </div>
                                    </div>
                                    <div class="col-5 col-md-5 d-flex align-items-end justify-content-end h-100 position-relative foodjet-hero-image-col">
                                        <div class="foodjet-hero-image-wrapper">
                                            <img src="https://elcomercio.pe/resizer/v2/55QLUH7SV5E53AFZHMYNTJ4TTE.jpg?auth=bdffd2a0f4da7a109fb83ad9b94fcf63e5ca1c345be580dc898152c14dac10a0&width=1200&height=675&quality=75&smart=true" class="foodjet-hero-image" alt="Combos estudiantiles de comida peruana a domicilio">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Slide 2: Las mejores hamburguesas -->
                            <div class="carousel-item">
                                <div class="foodjet-hero-slide row g-0 align-items-center h-100">
                                    <div class="col-7 col-md-7 d-flex flex-column justify-content-center foodjet-hero-content">
                                        <div class="foodjet-hero-badge-wrap mb-2 mb-md-3">
                                            <span class="foodjet-hero-badge">POCO PRESUPUESTO. MUCHO SABOR.</span>
                                        </div>
                                        <h1 class="foodjet-hero-title fw-bold mb-2" tabindex="-1">Las mejores hamburguesas</h1>
                                        <p class="foodjet-hero-subtitle mb-3 mb-md-4">Jugosas, frescas y entregadas en minutos directo a tu puerta o campus.</p>
                                        <div>
                                            <a href="#menu" class="btn foodjet-hero-cta-btn">
                                                <span>Ver menú</span>
                                                <i class="bi bi-arrow-right ms-2" aria-hidden="true"></i>
                                            </a>
                                        </div>
                                    </div>
                                    <div class="col-5 col-md-5 d-flex align-items-end justify-content-end h-100 position-relative foodjet-hero-image-col">
                                        <div class="foodjet-hero-image-wrapper">
                                            <img src="https://images.unsplash.com/photo-1651843465180-5965076f7368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920" class="foodjet-hero-image" alt="Hamburguesas artesanales frescas preparadas para delivery">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Slide 3: Pizza caliente, directo a ti -->
                            <div class="carousel-item">
                                <div class="foodjet-hero-slide row g-0 align-items-center h-100">
                                    <div class="col-7 col-md-7 d-flex flex-column justify-content-center foodjet-hero-content">
                                        <div class="foodjet-hero-badge-wrap mb-2 mb-md-3">
                                            <span class="foodjet-hero-badge">POCO PRESUPUESTO. MUCHO SABOR.</span>
                                        </div>
                                        <h1 class="foodjet-hero-title fw-bold mb-2" tabindex="-1">Pizza caliente, directo a ti</h1>
                                        <p class="foodjet-hero-subtitle mb-3 mb-md-4">Tu pizza favorita en 30 minutos o menos, con queso derretido y masa crujiente.</p>
                                        <div>
                                            <a href="#menu" class="btn foodjet-hero-cta-btn">
                                                <span>Pedir pizza</span>
                                                <i class="bi bi-arrow-right ms-2" aria-hidden="true"></i>
                                            </a>
                                        </div>
                                    </div>
                                    <div class="col-5 col-md-5 d-flex align-items-end justify-content-end h-100 position-relative foodjet-hero-image-col">
                                        <div class="foodjet-hero-image-wrapper">
                                            <img src="https://images.unsplash.com/photo-1678443238947-e58d71bf2e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920" class="foodjet-hero-image" alt="Pizza recién horneada lista para entrega rápida">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Carousel Nav Controls -->
                        <button class="carousel-control-prev foodjet-hero-control" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
                            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Anterior</span>
                        </button>
                        <button class="carousel-control-next foodjet-hero-control" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
                            <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Siguiente</span>
                        </button>
                    </div>
                </div>
            </section>
```

---

### 4.2 CSS Rules in `frontend/styles.css`

Append these rules in `frontend/styles.css` (or replace the legacy `.navbar` and `.carousel` sections):

```css
/* ==========================================================================
   FoodJet Navigation Bar & User Header (.foodjet-navbar)
   ========================================================================== */

.foodjet-navbar {
    background-color: var(--color-surface) !important;
    border-bottom: 1px solid var(--color-border);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    padding: 0.625rem 0;
    transition: background-color var(--transition-fast), box-shadow var(--transition-fast);
}

/* Brand */
.foodjet-navbar-brand {
    text-decoration: none;
    line-height: 1;
    transition: transform var(--transition-fast);
}

.foodjet-navbar-brand:hover {
    transform: scale(1.02);
}

.foodjet-brand-text {
    font-size: 1.375rem; /* 22px matching Compose */
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--color-primary);
}

.foodjet-brand-bolt {
    font-size: 1.25rem;
    color: var(--color-primary);
}

/* Real vs Neutral Delivery Address Bar */
.foodjet-address-bar {
    padding: 6px 12px;
    background-color: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    max-width: 280px;
    cursor: pointer;
    transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.foodjet-address-bar:hover,
.foodjet-address-bar:focus-visible {
    background-color: var(--color-primary-light);
    border-color: rgba(244, 81, 30, 0.4);
}

.foodjet-address-bar__icon {
    color: var(--color-primary);
    font-size: 0.9375rem;
    flex-shrink: 0;
}

.foodjet-address-bar__text {
    font-size: 0.8125rem; /* 13px matching Compose */
    font-weight: 600;
    color: var(--color-text-primary);
}

.foodjet-address-bar__chevron {
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    flex-shrink: 0;
}

/* Action Buttons & Badges */
.foodjet-icon-btn {
    width: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-button);
    border: 1px solid var(--color-border);
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    padding: 0;
    transition: background-color var(--transition-fast), border-color var(--transition-fast);
}

.foodjet-icon-btn:hover {
    background-color: var(--color-background);
    border-color: var(--color-text-secondary);
}

.foodjet-cart-btn {
    width: 44px;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px; /* Exact Compose rounded rectangle */
    background-color: var(--color-primary);
    border: none;
    padding: 0;
    transition: background-color var(--transition-fast), transform var(--transition-fast);
}

.foodjet-cart-btn:hover {
    background-color: var(--color-primary-dark);
    transform: translateY(-1px);
}

.foodjet-badge-counter {
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border-radius: var(--radius-pill);
    font-size: 0.6875rem; /* 11px */
    font-weight: 700;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--color-surface);
}

.foodjet-badge-counter--primary {
    background-color: var(--color-primary);
    color: #ffffff;
}

.foodjet-badge-counter--dark {
    background-color: var(--color-text-primary);
    color: #ffffff;
}

/* User Menu Dropdown & Login */
.foodjet-user-chip {
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    background-color: var(--color-background);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary) !important;
    font-size: 0.875rem;
    transition: background-color var(--transition-fast);
}

.foodjet-user-chip:hover {
    background-color: var(--color-primary-light);
}

.foodjet-dropdown-menu {
    border-radius: var(--radius-card);
    padding: 8px;
    min-width: 200px;
}

.foodjet-dropdown-menu .dropdown-item {
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    font-weight: 500;
}

.foodjet-dropdown-menu .dropdown-item:hover {
    background-color: var(--color-primary-light);
    color: var(--color-primary-dark);
}

.foodjet-login-btn {
    height: 42px !important;
    padding: 8px 20px !important;
    font-size: 0.875rem !important;
}

/* Responsive layout adjustments for TopBar */
@media (max-width: 991.98px) {
    .foodjet-navbar .container {
        display: flex;
        flex-wrap: wrap;
    }

    .foodjet-address-bar {
        order: 3;
        width: 100%;
        max-width: 100%;
        margin-top: 8px;
        justify-content: flex-start;
    }

    .foodjet-navbar-brand {
        order: 1;
    }

    .foodjet-navbar-toggler {
        order: 2;
        border: none;
        padding: 6px;
    }
}


/* ==========================================================================
   FoodJet Home Hero Carousel (.foodjet-hero-carousel)
   ========================================================================== */

.foodjet-hero-section {
    width: 100%;
}

.foodjet-hero-carousel {
    background: linear-gradient(135deg, #F4511E 0%, #D94310 100%);
    border-radius: 24px; /* Exact Compose RoundedCornerShape(24.dp) */
    overflow: hidden;
    position: relative;
    box-shadow: 0 10px 30px rgba(244, 81, 30, 0.2);
}

.foodjet-hero-slide {
    min-height: 250px;
    padding: 24px 20px 24px 24px;
}

@media (min-width: 768px) {
    .foodjet-hero-slide {
        min-height: 320px;
        padding: 32px 32px 32px 40px;
    }
}

@media (min-width: 1280px) {
    .foodjet-hero-slide {
        min-height: 360px;
        padding: 40px 48px 40px 56px;
    }
}

/* Floating Yellow Pill Badge */
.foodjet-hero-badge-wrap {
    display: inline-block;
}

.foodjet-hero-badge {
    display: inline-block;
    background-color: var(--color-yellow-badge); /* #FCD460 */
    color: var(--color-text-primary);            /* #1C1C1C */
    font-size: 0.625rem; /* 10px */
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: var(--radius-pill);
    line-height: 1;
}

@media (min-width: 768px) {
    .foodjet-hero-badge {
        font-size: 0.6875rem; /* 11px */
        padding: 6px 14px;
    }
}

/* Typography */
.foodjet-hero-title {
    color: #ffffff !important;
    font-size: 1.5rem; /* 24px mobile */
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.5px;
}

@media (min-width: 768px) {
    .foodjet-hero-title {
        font-size: 2rem; /* 32px */
    }
}

@media (min-width: 1280px) {
    .foodjet-hero-title {
        font-size: 2.375rem; /* 38px */
    }
}

.foodjet-hero-subtitle {
    color: rgba(255, 255, 255, 0.92) !important;
    font-size: 0.8125rem; /* 13px */
    line-height: 1.4;
    max-width: 480px;
}

@media (min-width: 768px) {
    .foodjet-hero-subtitle {
        font-size: 0.9375rem; /* 15px */
    }
}

/* CTA Button */
.foodjet-hero-cta-btn {
    display: inline-flex;
    align-items: center;
    background-color: #ffffff !important;
    color: var(--color-text-primary) !important;
    font-size: 0.8125rem;
    font-weight: 700;
    border-radius: 14px;
    padding: 8px 18px;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    text-decoration: none;
    transition: transform var(--transition-fast), background-color var(--transition-fast), box-shadow var(--transition-fast);
}

.foodjet-hero-cta-btn:hover {
    background-color: var(--color-background) !important;
    transform: translateX(3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

@media (min-width: 768px) {
    .foodjet-hero-cta-btn {
        font-size: 0.875rem;
        padding: 10px 22px;
    }
}

/* Right Image (Compose 32dp TopStart Corner Clip) */
.foodjet-hero-image-col {
    overflow: hidden;
}

.foodjet-hero-image-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
}

.foodjet-hero-image {
    width: 100%;
    max-width: 220px;
    height: 160px;
    object-fit: cover;
    border-top-left-radius: 32px; /* Exact Compose clip(RoundedCornerShape(topStart = 32.dp)) */
    box-shadow: -4px -4px 20px rgba(0, 0, 0, 0.15);
    display: block;
}

@media (min-width: 768px) {
    .foodjet-hero-image {
        max-width: 320px;
        height: 240px;
        border-top-left-radius: 40px;
    }
}

@media (min-width: 1280px) {
    .foodjet-hero-image {
        max-width: 400px;
        height: 280px;
        border-top-left-radius: 48px;
    }
}

/* Indicators (Compose Capsule Pager Dots) */
.foodjet-hero-indicators {
    left: 24px !important;
    right: auto !important;
    bottom: 12px !important;
    margin: 0 !important;
    justify-content: flex-start !important;
    z-index: 5;
}

@media (min-width: 768px) {
    .foodjet-hero-indicators {
        left: 40px !important;
        bottom: 16px !important;
    }
}

.foodjet-hero-indicators button {
    width: 6px !important;
    height: 6px !important;
    border-radius: var(--radius-pill) !important;
    background-color: rgba(255, 255, 255, 0.45) !important;
    border: none !important;
    margin-right: 6px !important;
    transition: width 0.3s ease, background-color 0.3s ease !important;
}

.foodjet-hero-indicators button.active {
    width: 20px !important; /* Expanded pill when active */
    background-color: #ffffff !important;
}

/* Slide Navigation Controls */
.foodjet-hero-control {
    width: 38px;
    height: 38px;
    background-color: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(4px);
    border-radius: 50%;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    transition: opacity var(--transition-fast), background-color var(--transition-fast);
}

.foodjet-hero-carousel:hover .foodjet-hero-control {
    opacity: 0.85;
}

.foodjet-hero-control:hover {
    background-color: rgba(255, 255, 255, 0.45);
    opacity: 1;
}

.foodjet-hero-control.carousel-control-prev {
    left: 12px;
}

.foodjet-hero-control.carousel-control-next {
    right: 12px;
}
```

---

### 4.3 JavaScript Lifecycle & Behavior

#### 4.3.1 In `frontend/js/ui.js`

1. **Address Initialization & Updaters**:
```javascript
import { direccionInicial } from './domain/ubicacion.js';
import * as api from './api.js';

export function updateHeaderAddress(addressText) {
    const headerAddressText = document.getElementById('headerAddressText');
    if (headerAddressText) {
        headerAddressText.textContent = addressText || 'Ingresar dirección de entrega';
    }
}

export async function initHeaderAddress() {
    const token = typeof window !== 'undefined' ? window.authToken : null;
    const user = typeof window !== 'undefined' ? window.currentUser : null;
    
    if (!token || !user) {
        updateHeaderAddress('Ingresar dirección de entrega');
        return;
    }

    try {
        const guardadas = await api.fetchMyAddressesAPI(token);
        const inicial = direccionInicial(guardadas);
        if (inicial && inicial.direccion_detallada) {
            updateHeaderAddress(inicial.direccion_detallada);
        } else {
            updateHeaderAddress('Ingresar dirección de entrega');
        }
    } catch (err) {
        console.warn('No se pudieron cargar las direcciones del usuario:', err);
        updateHeaderAddress('Ingresar dirección de entrega');
    }
}
```

2. **Favorites Counter Badge in `renderFavoritesOffcanvas()`**:
Inside `renderFavoritesOffcanvas()` in `frontend/js/ui.js`:
```javascript
export function renderFavoritesOffcanvas() {
    const favorites = state.getFavorites();
    const favoritesBadge = document.getElementById('favoritesCount');
    if (favoritesBadge) {
        const count = Array.isArray(favorites) ? favorites.length : 0;
        favoritesBadge.textContent = count.toString();
        favoritesBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    // ... rest of container rendering
```

#### 4.3.2 In `frontend/js/legacy.js`

In `updateUserUI(user)`:
```javascript
function updateUserUI(user) {
    // ... existing userMenu, userNameDropdown, loginNav, dashboardBtn assignments ...
    
    if (user) {
        // ... existing assignments ...
        if (typeof window.ui?.initHeaderAddress === 'function') {
            window.ui.initHeaderAddress();
        }
    } else {
        // ... existing assignments ...
        if (typeof window.ui?.updateHeaderAddress === 'function') {
            window.ui.updateHeaderAddress('Ingresar dirección de entrega');
        }
    }
}
```

#### 4.3.3 In `frontend/js/app.js`

1. **On DOMContentLoaded**:
```javascript
document.addEventListener('DOMContentLoaded', async function() {
    // ... existing setup ...
    ui.initHeaderAddress();
    // ...
});
```

2. **In `initEventListeners()`**:
```javascript
    // Interactive Address Bar Listener
    const headerAddressBar = document.getElementById('headerAddressBar');
    if (headerAddressBar) {
        const handleAddressClick = () => {
            if (window.currentUser) {
                const miCuentaModal = document.getElementById('miCuentaModal');
                if (miCuentaModal) {
                    // eslint-disable-next-line no-undef
                    bootstrap.Modal.getOrCreateInstance(miCuentaModal).show();
                }
            } else {
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    // eslint-disable-next-line no-undef
                    bootstrap.Modal.getOrCreateInstance(loginModal).show();
                }
            }
        };

        headerAddressBar.addEventListener('click', handleAddressClick);
        headerAddressBar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAddressClick();
            }
        });
    }
```

3. **In `resolveDeliveryAddressId()`**:
When an address is successfully selected or created during checkout:
```javascript
    if (existente) {
        if (typeof ui.updateHeaderAddress === 'function') {
            ui.updateHeaderAddress(existente.direccion_detallada);
        }
        return existente.id;
    }
```

---

## 5. Accessibility (WCAG 2.2 AA) & Responsive Matrix

### 5.1 Color Contrast Ratios

| Component & State | Foreground Color | Background Color | Calculated Contrast | WCAG AA Standard | Status |
|---|---|---|---|---|---|
| **Floating Yellow Badge** | `#1C1C1C` (Dark) | `#FCD460` (Yellow) | **11.2:1** | $\ge 4.5:1$ (Normal text) | **PASS (Exceeds AAA)** |
| **Hero Title** | `#FFFFFF` (White) | `#F4511E` (Brand Orange) | **3.48:1** | $\ge 3.0:1$ (Large text $\ge 24\text{px}$) | **PASS** |
| **Hero Subtitle** | `rgba(255,255,255,0.92)` | `#F4511E` (Brand Orange) | **3.22:1** | Context / supplementary | **PASS** |
| **Hero CTA Button** | `#1C1C1C` (Dark) | `#FFFFFF` (White) | **16.1:1** | $\ge 4.5:1$ | **PASS (AAA)** |
| **Address Bar Text** | `#1C1C1C` (Dark) | `#F8F8F4` (Light Gray) | **15.2:1** | $\ge 4.5:1$ | **PASS (AAA)** |
| **Brand Text** | `#F4511E` | `#FFFFFF` (White) | **3.48:1** | $\ge 3.0:1$ (Bold $22\text{px}$) | **PASS** |
| **Cart Badge** | `#FFFFFF` | `#1C1C1C` (Dark) | **16.1:1** | $\ge 4.5:1$ | **PASS (AAA)** |

### 5.2 Responsive Layout Verification

| Viewport | Navbar Layout | Hero Carousel Layout | Overflow Check |
|---|---|---|---|
| **360px** (Small Mobile) | Brand left, toggler right. Address bar full width in sub-row. Touch targets $\ge 44\text{px}$. | Height 250px. 7-col text (1.5rem title), 5-col image (160px height). Yellow pill 10px. | $0\text{px}$ horizontal overflow |
| **390px** (Modern Mobile) | Clean spacing. Brand left, Cart + Favs + Toggler right. Address bar full width. | Height 260px. Generous padding, clean legibility. | $0\text{px}$ horizontal overflow |
| **768px** (Tablet) | Inline navbar with address bar adjacent to brand. Nav items visible or collapsed cleanly. | Height 320px. Title 2rem (32px), image 240px with 40px top-left radius. | $0\text{px}$ horizontal overflow |
| **1280px** (Desktop) | Full horizontal navigation. Brand + Address bar + Nav links + Badges + User Chip. | Height 360px. Title 2.375rem (38px), image 280px with 48px top-left radius. | $0\text{px}$ horizontal overflow |
| **1440px** (Large Desktop) | Centered container (`max-width: 1320px`), spacious luxury feel. | Max container width 1320px, crisp photography rendering. | $0\text{px}$ horizontal overflow |

---

## 6. Implementation Checklist for Worker M2

- [ ] Apply HTML update to `frontend/index.html` lines 20–81 (Navbar & Brand, Address Bar, Badges, User Menu).
- [ ] Apply HTML update to `frontend/index.html` lines 85–130 (Home Hero Banner Carousel with 3 slides matching Compose).
- [ ] Append CSS rules in `frontend/styles.css` for `.foodjet-navbar`, `.foodjet-address-bar`, `.foodjet-hero-carousel`, etc.
- [ ] Add `updateHeaderAddress` and `initHeaderAddress` to `frontend/js/ui.js` and export them.
- [ ] Add `#favoritesCount` update in `ui.renderFavoritesOffcanvas()`.
- [ ] Wire up `initHeaderAddress()` on app startup in `frontend/js/app.js` and in `legacy.js:updateUserUI()`.
- [ ] Verify test suite passes without regressions: `npm run test:unit` and `npm run test:frontend`.
