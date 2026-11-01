# Report: Existing Codebase Architecture, DOM Contracts & Domain Bridges

**Explorer**: Survey Explorer 2  
**Date**: 2026-10-29  
**Target Directory**: `c:\Users\ORLANDO\Desktop\Pagina-Foodjet\frontend`  
**Baseline Test Execution**: `npm test` (76 frontend + 45 backend cucumber scenarios passed, 100%), `npm run test:unit` (25/25 white-box domain tests passed, 100%).

---

## 1. Executive Summary & Architecture Overview

The FoodJet frontend is a lightweight Single Page Application (SPA) designed to operate without build tools, bundlers, or frameworks (No React, Vue, Vite, Webpack, or Tailwind). It runs directly in modern evergreen browsers using:
- **HTML5** (`frontend/index.html`) as the single page hosting all view sections and modals.
- **Bootstrap 5.3.0** via CDN (`bootstrap.min.css` and `bootstrap.bundle.min.js`), icons via `bootstrap-icons@1.11.0`.
- **CSS3** (`frontend/styles.css`, 1595 lines) providing color variables, responsive layouts, timeline styling, dark mode rules, and accessibility enhancements.
- **JavaScript**: A hybrid architecture consisting of:
  1. A classic script configuration (`frontend/js/config.js`) setting the relative API URL (`window.FOODJET_API_URL = '/api'`).
  2. A classic legacy script (`frontend/js/legacy.js`) handling session restoration, login/register modal submissions, admin operations panel polling, toast alerts, and backward compatibility.
  3. Modern ES Modules (`frontend/js/app.js` with `type="module"`, `api.js`, `state.js`, `ui.js`, `favorites.js`, `googleMaps.js`, `mapaEntrega.js`, `mapaSeguimiento.js`).
  4. Pure domain modules (`frontend/js/domain/`): `catalog.js`, `checkout.js`, `orderStatus.js`, `payment.js`, `seguimiento.js`, `session.js`, `ubicacion.js`, `validation.js`. These are pure, headless business logic modules with 0 DOM or network dependencies, enabling direct testability in Node.js (via Node test runner and Cucumber).
  5. Global communication bridges (`window.FoodJetSession`, `window.FoodJetMapas`, `window.FoodJetValidation`, `window.app`, `window.state`, `window.ui`) bridging ESM modules with classic scripts and inline HTML event attributes.

---

## 2. Comprehensive DOM Contract Registry

The entire application relies on specific DOM IDs, classes, and data attributes for view management, DOM manipulation, form submissions, and automated testing.

### 2.1. View Containers (SPA Navigation)
Views are toggled in `ui.js` (`showView()`) and `legacy.js` (`displayDashboard()`, `handleLogout()`) by manipulating `style.display = 'block' | 'none'`.

| View Element ID | Tag | Purpose | Selectors / Hooks |
|---|---|---|---|
| `homeView` | `<div id="homeView">` | Main catalog, hero carousel, features, about, contact | Initial active view; focus `h1` |
| `checkoutView` | `<section id="checkoutView">` | Order checkout, delivery, payment selection, summary | Controlled via `showView('checkoutView')`, contains `#checkoutForm` |
| `trackingView` | `<section id="trackingView">` | Live order delivery tracking with timeline & animated map | Controlled via `showView('trackingView')`, triggers polling |
| `dashboardView` | `<section id="dashboardView">` | Operations panel for admin/delivery personnel | Controlled via `displayDashboard()` |
| `orderHistoryView` | `<section id="orderHistoryView">` | Customer order history cards and review triggers | Controlled via `showView('orderHistoryView')` |

### 2.2. Navigation & User Header Controls
Found in `<nav class="navbar ...">`:

| ID / Selector | Tag | Function | Event Listeners |
|---|---|---|---|
| `.navbar-brand`, `.navbar-nav .nav-link` | `<a>` | Navigation links | Click resets to `homeView` (`app.js:89-93`) |
| `#favoritesNav` | `<li>` | Container for favorites button | Toggled by `updateUserUI()` (`display: block` if user logged in) |
| `#favoritesBtn` | `<button>` | Toggles favorites offcanvas | `data-bs-toggle="offcanvas"` `data-bs-target="#favoritesOffcanvas"` |
| `#cartBtn` | `<button>` | Opens cart offcanvas | Click triggers `openCart()` (`app.js:98`) |
| `#cartCount` | `<span class="cart-badge">` | Navbar badge displaying item count | Updated in `ui.js:441-444` (`display: inline-flex` when > 0) |
| `#userMenu` | `<li class="dropdown">` | User profile dropdown | Shown when `window.currentUser` exists |
| `#userDropdown` | `<a>` | Dropdown trigger | Shows user name, toggles admin/client icon |
| `#userNameDropdown` | `<span>` | Span holding user name | Updated by `updateUserUI(user)` |
| `#dashboardBtn` | `<a>` | Dropdown link to Admin Dashboard | Click invokes `displayDashboard()`; shown only if `rol === 'admin'` |
| `#historyBtn` | `<a>` | Dropdown link to Order History | Click triggers `handleHistoryClick()` (`app.js:141`) |
| `#miCuentaBtn` | `<a>` | Dropdown link to My Account (Student modal) | Click opens `#miCuentaModal` (`app.js:675`) |
| `#logoutBtn` | `<a>` | Dropdown link to logout | Click triggers `handleLogout()` (`legacy.js:107`) |
| `#loginNav` | `<li>` | Container for guest login button | Hidden when user logged in (`display: none`) |
| `#loginBtn` | `<button>` | Opens login modal | `data-bs-toggle="modal"` `data-bs-target="#loginModal"` |
| `#userNameBtn` | `<span>` | Label "Ingresar" | Inside `#loginBtn` |

### 2.3. Home View & Catalog DOM Contracts
- **Hero Carousel**: `#heroCarousel` (Bootstrap carousel indicators, slides, CTA buttons pointing to `#menu`).
- **Filters**:
  - Container for category checkboxes: `#filter-food-type-container` (dynamically filled by `ui.renderFoodTypeFilters()`). Checkboxes have class `.filter-food-type` with `value="<Category>"`.
  - Price bounds: `#filter-price-min`, `#filter-price-max` (`<input type="number">`).
  - Delivery time: Radio inputs `name="deliveryTimeFilter"` with class `.filter-delivery-time` (`#time-30` = "30 minutos", `#time-60` = "1 hora", `#time-more` = "Más de 1 hora").
  - Action buttons: `#btn-apply-filters` (triggers `ui.renderProducts()`), `#btn-clear-filters` (resets inputs & re-renders).
- **Product Grid**: `#productsGrid` (dynamically populated by `ui.renderProducts()`).
  - Dynamic elements rendered:
    - Card container `.product-card`.
    - Favorite button `.favorite-toggle` with `data-id="${product.id}"`.
    - Price container rendering `renderProductPrice(product, window.currentUser)`.
    - Add to cart button: `.add-to-cart` with `data-id="${product.id}"` (disabled class `.disabled` if `product.disponibilidad === false`).

### 2.4. Cart & Offcanvas DOM Contracts
- **Cart Offcanvas**: `#cartOffcanvas` (`aria-labelledby="cartOffcanvasLabel"`).
  - `#cartItemCount`: Header badge showing total items in cart.
  - `#cartItemsContainer`: Scrollable wrapper.
  - `#emptyCart`: Element displayed when cart is empty (`display: block | none`).
  - `#cartItems`: Container where cart rows are appended.
    - Each row includes: image, product name, student badge (if applicable), item total, `.minus-btn` (`data-id`), quantity span, `.plus-btn` (`data-id`).
  - `#cartFooter`: Bottom bar containing total and checkout button (`display: none` when empty).
  - `#cartTotal`: Total amount (`S/ XX.XX`).
  - `#checkoutBtn`: Button to navigate to checkout (`handleCheckoutNavigation()`).
- **Favorites Offcanvas**: `#favoritesOffcanvas` (`aria-labelledby="favoritesOffcanvasLabel"`).
  - `#favoritesItemsContainer`: Container where favorite cards are rendered.
  - Each item includes: `.remove-favorite` (`data-id`), product title, price, `.add-to-cart-from-fav` (`data-id`).

### 2.5. Checkout View DOM Contracts
Section `#checkoutView` containing form `#checkoutForm`:
- **Navigation**: `#backToMenuBtn` (returns to `homeView`).
- **Delivery Section**:
  - `#customerName`: Full name text input (`required`). Pre-filled from `currentUser.nombre`.
  - `#customerPhone`: Phone input (`type="tel"`, `inputmode="numeric"`, `maxlength="9"`, `pattern="\d{9}"`, `required`, `aria-describedby="customerPhoneError"`).
  - `#customerPhoneError`: Element receiving validation error text (`.invalid-feedback`).
  - `#customerAddress`: Street address input (`required`, `autocomplete="street-address"`, `aria-describedby="deliveryMapStatus"`). Also stores GPS dataset: `data-lat` and `data-lon`.
  - `#deliveryAddressSearch`: Search button for address (`<button id="deliveryAddressSearch" hidden>`).
  - `#deliveryMapWrapper`: Map container (`hidden` until Google Maps key is verified).
  - `#deliveryMap`: Map canvas (`role="application"`).
  - Pin overlay: `.mapa-entrega__pin`.
  - Locate button: `#deliveryMapLocate` (triggers browser GPS geolocation).
  - Status display: `#deliveryMapStatus` (`aria-live="polite"`).
  - `#customerReference`: Optional delivery reference.
- **Payment Method Section**:
  - Radio inputs `name="paymentMethod"`:
    - `#payCash` (`value="cash"`, checked by default). Container `.payment-option[data-payment="cash"]`.
    - `#payCard` (`value="card"`). Container `.payment-option[data-payment="card"]`.
    - `#payWallet` (`value="wallet"`). Container `.payment-option[data-payment="wallet"]`.
  - Card details collapsible container: `#cardDetails` (`display: none` by default).
    - `#cardNumber`: Card number input (`maxlength="19"`, `inputmode="numeric"`, `autocomplete="cc-number"`, `aria-describedby="cardNumberError"`).
    - `#cardNumberError`: Card number error message.
    - `#cardExpiry`: Expiry input (`maxlength="5"`, `placeholder="MM/AA"`, `inputmode="numeric"`, `autocomplete="cc-exp"`, `aria-describedby="cardExpiryError"`).
    - `#cardExpiryError`: Expiry error message.
    - `#cardCvc`: CVC input (`maxlength="4"`, `inputmode="numeric"`, `autocomplete="cc-csc"`, `aria-describedby="cardCvcError"`).
    - `#cardCvcError`: CVC error message.
- **Order Summary Section**:
  - `#checkoutItems` (or `#checkoutCartItems`): Dynamic list of ordered products.
  - Coupon input: `#couponCode` (`placeholder="Ejem: PruebaCupon"`).
  - Coupon apply button: `#applyCouponBtn`.
  - Coupon message feedback: `#couponMessage`.
  - Financial line items:
    - `#checkoutSubtotal`: Subtotal before taxes and shipping (`S/ XX.XX`).
    - `#checkoutDiscountRow`: Container for coupon discount (`display: none !important` when 0).
    - `#checkoutDiscount`: Discount amount (`-S/ XX.XX`).
    - `#checkoutTaxes` (or `#checkoutTax`): 18% IGV tax.
    - `#checkoutDelivery` (or `#checkoutDeliveryFee`): Fixed delivery fee (`S/ 5.00`).
    - `#checkoutTotal`: Final grand total.
  - Submit button: `<button type="submit" class="btn btn-primary w-100 py-3">Confirmar Pedido</button>`.

### 2.6. Tracking View DOM Contracts
Section `#trackingView` (`aria-label="Seguimiento de pedido"`):
- Layout container: `#trackingLayout` (receives class `seguimiento--con-mapa` when coordinates are available).
- Map elements:
  - `#trackingMapCard`: Map card container (`hidden` until map loaded).
  - `#trackingMap`: Google Map canvas (`role="region"`).
  - `#trackingRoute`: Distance and remaining route status text.
- Live Status elements:
  - `#statusIcon`: Icon container with class `.order-status-icon`.
  - `#statusTitle`: Status heading (`tabindex="-1"`).
  - `#statusDescription`: Detailed explanation text.
  - `#estimatedTime`: Arrival container (`hidden` when order is delivered or cancelled).
  - `#etaValue`: Large prominent time remaining (`etaValue`, e.g., "12 min").
  - `#etaText`: Subtitle (e.g., "Llegada aprox. 20:30").
  - `#trackingConnection`: Network connection status ("Sin conexión con el servidor, reintentando…").
- Timeline steps: `<ol class="linea-tiempo">`:
  - `#step1`: Confirmation step (`data-situacion="hecha|en_curso|pendiente|cancelada"`, `aria-current="step"`).
    - `#stepTime1`: Real or estimated timestamp (`<time datetime="...">`).
  - `#step2`: Preparation step (`#stepTime2`).
  - `#step3`: On the way / Delivery step (`#stepTime3`).
  - `#step4`: Delivered step (`#stepTime4`).
- Order Details Card:
  - `#orderNumber`: `#FJ0000`.
  - `#orderPayment`: Payment method name.
  - `#orderDate`: Order date.
  - `#orderSubtotal`: Subtotal (`deriveSubtotal()`).
  - `#orderTaxes`: IGV.
  - `#orderDelivery`: Shipping cost.
  - `#orderTotalFinal`: Grand total.
  - `#backToMenuFromTracking`: Return button (hidden by default).
  - `#trackingHistoryBtn`: "Ver Historial" button.

### 2.7. Dashboard & Operations Panel DOM Contracts
Section `#dashboardView` (`aria-label="Panel de operaciones"`):
- Navigation & Profile:
  - `#backToMenuFromDashboard`: Return button.
  - `#dashboardUserName`: Admin user name.
  - `#dashboardUserEmail`: Admin user email.
  - `#refreshOperationsBtn`: Refresh button.
  - `#logoutBtnDashboard`: Logout link.
- Table & Filters:
  - `#operationsUpdated`: Last updated timestamp.
  - `#operationsFilters`: Filter buttons container (`data-filter="en_curso|pendiente|confirmado|en_preparacion|en_camino|entregado|cancelado|todos"`).
  - `#operationsTableBody`: Orders table rows.
    - Each row includes buttons: `.btn-order-detail` (`data-order-id`).
  - `#operationsNotice`: Feedback message.
- Order Detail Modal: `#orderDetailModal`:
  - `#orderDetailTitle`: Header title (`Pedido #FJXXXX`).
  - `#orderDetailGrid`: Modal grid.
  - `#orderDetailMapCard`, `#orderDetailMap`, `#orderDetailRoute`: Route map inside modal.
  - `#orderDetailBody`: Timeline progress bar, stage list, and action buttons (`.btn-advance-order` with `data-next`, `.btn-cancel-order`).

### 2.8. Modals DOM Contracts
- **Authentication**:
  - `#loginModal`: `#loginForm`, `#loginEmail`, `#loginPassword`.
  - `#registerModal`: `#registerForm`, `#registerName`, `#registerEmail`, `#registerEmailError`, `#registerPhone`, `#registerPhoneAyuda`, `#registerPhoneError`, `#registerPassword`.
- **Student Verification**: `#miCuentaModal`:
  - `#studentStatusContainer`: Status message alert (`alert-success` or `alert-secondary`).
  - `#verifyStudentFormContainer`: Form wrapper.
  - `#verifyStudentForm`: Form (`#carnetImage`, `#verifyStudentSubmitBtn`).
- **Review Rating**: `#reviewModal`:
  - `#reviewForm`: `#reviewOrderId`, `#reviewRestaurantName`, `#reviewOrderDate`.
  - `#starRatingContainer`: Interactive star rating (`.bi-star` / `.bi-star-fill` with `data-rating="1..5"`).
  - `#reviewRating`: Hidden input.
  - `#reviewComment`: Textarea.
  - `#submitReviewBtn`: Submit button.
- **Payment Verification**:
  - `#qrModal`: Digital wallet modal (`#qrRestaurantName`, `#qrPaymentImage`, `#qrTimerText`, `#cancelQrPaymentBtn`).
  - `#cardAuthModal`: Simulated bank authorization modal (`#cardAuthBrand`).

---

## 3. JavaScript Module Hierarchy & Global Bridge Inventory

### 3.1. Script Execution Order in HTML
```
1. Bootstrap Bundle: bootstrap.bundle.min.js (Global window.bootstrap)
2. Classic Script: js/config.js (Sets window.FOODJET_API_URL)
3. Classic Script: js/legacy.js (Registers DOMContentLoaded for session, auth & dashboard)
4. ES Module: js/app.js (type="module") (Loads first before DOMContentLoaded fires, publishes bridges)
```

### 3.2. Global Bridges (`window.*`)
The following global bridges are strictly required and must remain intact:

| Global Property | Publisher | Consumer(s) | Description / Contract |
|---|---|---|---|
| `window.FOODJET_API_URL` | `config.js:16` | `legacy.js:1`, `api.js:3` | API base path string (defaults to `'/api'`). |
| `window.authToken` | `legacy.js`, `app.js` | `api.js`, `ui.js`, `legacy.js` | Current JWT bearer token string or `null`. |
| `window.currentUser` | `legacy.js`, `app.js` | `ui.js`, `state.js`, `legacy.js` | User object `{ id, nombre, email, telefono, rol, es_estudiante }` or `null`. |
| `window.FoodJetSession` | `app.js:18` | `legacy.js:23` | `{ isTokenExpired(token), isAuthFailure(status) }`. |
| `window.FoodJetMapas` | `app.js:21` | `legacy.js:542` | `{ crearMapaSeguimiento, fetchConfigAPI }`. |
| `window.FoodJetValidation` | `app.js:22` | `legacy.js:60, 160` | `{ sanitizePhone(str), validatePhone(str) }`. |
| `window.app` | `app.js:515` | `legacy.js`, HTML onclick, cucumber | `{ loadFavorites, handleToggleFavorite, handleAddToCart, handleRemoveFromCart, handleRemoveItemCompletely, showView }`. |
| `window.state` | `app.js:27` | `legacy.js:267`, tests | Exposes the `state.js` module namespace. |
| `window.ui` | `app.js:28` | `legacy.js:269`, tests | Exposes the `ui.js` module namespace. |
| `window.handleLogin` | `legacy.js:704` | HTML / tests | Form handler for `#loginForm`. |
| `window.handleRegister` | `legacy.js:705` | HTML / tests | Form handler for `#registerForm`. |
| `window.handleLogout` | `legacy.js:706` | HTML / navbar | Clears auth token and user state, resets to `homeView`. |
| `window.displayDashboard` | `legacy.js:707` | `app.js`, HTML | Switches view to `dashboardView` and starts operations polling. |
| `window.updateUserUI` | `legacy.js:708` | `app.js` | Updates navbar dropdown, login button, and user role elements. |
| `window.showToast` | `legacy.js:709` | `legacy.js` | Toasts helper (mirrors `ui.showToast`). |
| `window.gm_authFailure` | `googleMaps.js:65` | Google Maps SDK | Callback invoked by Google if API key authentication fails. |

### 3.3. ES Module Dependency Graph

```
js/app.js (Entry Module)
├── js/api.js (Network fetch calls)
│   └── (reads window.FOODJET_API_URL)
├── js/state.js (Cart, catalog & favorites in-memory state)
│   └── js/domain/catalog.js
├── js/ui.js (DOM manipulation & view updates)
│   ├── js/state.js
│   ├── js/api.js
│   ├── js/domain/orderStatus.js
│   ├── js/domain/catalog.js
│   ├── js/domain/seguimiento.js
│   └── js/mapaSeguimiento.js
├── js/favorites.js (Async favorite loader)
│   ├── js/api.js
│   ├── js/state.js
│   └── js/ui.js
├── js/mapaEntrega.js (Checkout delivery map controller)
│   ├── js/domain/ubicacion.js
│   └── js/googleMaps.js
├── js/mapaSeguimiento.js (Tracking & Operations route map renderer)
│   ├── js/googleMaps.js
│   └── js/domain/seguimiento.js
└── js/domain/
    ├── catalog.js (Pricing, student discounts, restaurant mapping, filtering)
    ├── checkout.js (buildOrderPayload builder)
    ├── orderStatus.js (Status normalization, stages, badges, subtotal derivation)
    ├── payment.js (Luhn validation, card brand detection, formatting)
    ├── seguimiento.js (Timeline projections, route length, delivery interpolation)
    ├── session.js (JWT payload parsing, token expiration, auth failure)
    ├── ubicacion.js (Coordinates validation, haversine distance, address lookup)
    └── validation.js (Phone sanitization and 9-digit validation)
```

---

## 4. Backend API Contract Mapping

All frontend network calls are routed via relative path `/api` (or `window.FOODJET_API_URL`). The backend is implemented with Express, Prisma, and PostgreSQL.

| Endpoint | Method | Auth Req. | Frontend Function | Expected Payload | Response & Status Codes |
|---|---|---|---|---|---|
| `/api/auth/register` | `POST` | No | `legacy.js:handleRegister` | `{ nombre, email, telefono, password, rol: 'cliente' }` | `201 Created`: `{ user, token }`<br>`400`: `{ error }`<br>`409`: `{ error, code: 'EMAIL_ALREADY_EXISTS' }` |
| `/api/auth/login` | `POST` | No | `legacy.js:handleLogin` | `{ email, password }` | `200 OK`: `{ user, token }`<br>`401`: `{ error: 'Credenciales inválidas' }` |
| `/api/auth/me` | `GET` | Bearer Token | - | None | `200 OK`: `{ user }`<br>`401`: `{ error }` |
| `/api/products` | `GET` | No | `api.fetchProductsAPI` | None | `200 OK`: `Array<Product>` including `Restaurant` and `categoria` relations |
| `/api/orders` | `POST` | Bearer Token | `api.createOrderAPI` | `{ items: [{ productId, cantidad }], metodo_pago, restaurante_id, direccion_entrega_id, cupon_id? }` | `201 Created`: `{ message, order }`<br>`400`: Invalid parameters / unavailable products<br>`403`: Address doesn't belong to user |
| `/api/orders` | `GET` | Admin / Repartidor | `legacy.js:renderOperationsPanel` | None | `200 OK`: `Array<Order>` for operations dashboard |
| `/api/orders/my-orders` | `GET` | Bearer Token | `api.fetchMyOrdersAPI` | None | `200 OK`: `Array<Order>` with `OrderItem`, `Restaurant`, `Transaction`, `Review` |
| `/api/orders/:id` | `GET` | Bearer Token | `api.fetchOrderByIdAPI` | None | `200 OK`: Full order object (`historial`, `plan_tiempos`, `ruta`, `distancia_metros`, `servidor_ahora`, `DeliveryAddress`, `Restaurant`) |
| `/api/orders/:id/status` | `PUT` | Admin / Repartidor | `legacy.js:advanceOrder` | `{ nuevo_estado: string }` | `200 OK`: `{ message, order }`<br>`400`: Invalid transition |
| `/api/orders/:id/cancel` | `PUT` | Bearer Token (Owner) | - | None | `200 OK`: `{ message, order }`<br>`400`: State not cancelable |
| `/api/favorites` | `GET` | Bearer Token | `api.fetchFavoritesAPI` | None | `200 OK`: `Array<Product>` |
| `/api/favorites/:id/toggle`| `POST` | Bearer Token | `api.toggleFavoriteAPI` | None | `200 OK`: `{ ok: true, isFavorite: boolean }` |
| `/api/reviews` | `POST` | Bearer Token | `api.createReviewAPI` | `{ pedido_id, puntuacion, comentario }` | `201 Created`: Review object<br>`400`: Missing rating or already reviewed |
| `/api/reviews/my-reviews` | `GET` | Bearer Token | - | None | `200 OK`: `Array<Review>` |
| `/api/users/verify-student` | `POST` | Bearer Token | `api.verifyStudentAPI` | `FormData` with `image` file | `200 OK`: `{ message, user }` (updates `es_estudiante: true`) |
| `/api/addresses` | `GET` | Bearer Token | `api.fetchMyAddressesAPI` | None | `200 OK`: `Array<DeliveryAddress>` |
| `/api/addresses` | `POST` | Bearer Token | `api.createAddressAPI` | `{ direccion_detallada, referencia?, latitud?, longitud?, es_predeterminada? }` | `201 Created`: `DeliveryAddress` object |
| `/api/config` | `GET` | No | `api.fetchConfigAPI` | None | `200 OK`: `{ googleMapsApiKey: string|null, googleMapsApiKeys: string[] }` |

---

## 5. Domain Logic & Invariant Analysis (`frontend/js/domain/`)

1. **`catalog.js`**:
   - `calculateStudentPrice(product, user)`: Calculates discount (`product.precio * (1 - descuento_estudiante / 100)`) strictly when `user?.es_estudiante === true` and `product.descuento_estudiante > 0`.
   - `parseDeliveryTime(str)`: Converts strings like `"30 minutos"` (-> 30), `"1 hora"` (-> 60), `"Más de 1 hora"` (-> 90).
   - `filterProducts(products, minPrice, maxPrice, maxTime, selectedCategories)`: Pure multi-attribute filtering.
   - `getProductRestaurant(product)`: Handles Prisma capital casing `product.Restaurant` and fallback `product.restaurante`.
   - `getCartRestaurant(cart, getProductById)`: Returns the restaurant tied to the first item in the cart to enforce single-restaurant per order rule.
2. **`checkout.js`**:
   - `buildOrderPayload(cart, getProductById, metodoPago, direccionEntregaId)`: Builds the payload for `POST /api/orders`.
3. **`orderStatus.js`**:
   - `normalizeEstado(str)`: Canonicalizes accents and case (e.g. `'En preparación'` -> `'en_preparacion'`).
   - `isTerminal(estado)`: Returns true for `'entregado'` and `'cancelado'`.
   - `getTrackingViewModel(estado)`: Maps stage titles, descriptions, icons, and indices.
   - `deriveSubtotal(order)`: Derives subtotal via `Math.max(0, total - impuestos - envio)`.
4. **`payment.js`**:
   - `luhnCheck(number)`: Standard Luhn mod 10 check on digits.
   - `detectBrand(number)`: Visa (`^4`), Mastercard (`^5[1-5]|^2[2-7]`), Amex (`^3[47]`).
   - `validateCard({ numero, expiracion, cvc })`: Validates length, expiration, Luhn, returning errors per field.
5. **`seguimiento.js`**:
   - `lineaDeTiempo(pedido, ahoraMs)`: Computes stage states (`hecha`, `en_curso`, `pendiente`, `cancelada`) and timestamps.
   - `avanceDelReparto({ inicioMs, duracionMs, ahoraMs, entregado })`: Calculates 0.0 to 1.0 fraction.
   - `dividirRuta(ruta, fraccion)`: Splits geo-coordinate array `[[lat, lon], ...]` at the interpolated fraction.
6. **`session.js`**:
   - `decodeJwtPayload(token)`: Decodes base64 JWT payload safely without extra libraries.
   - `isTokenExpired(token, nowMs)`: Checks `payload.exp * 1000 <= nowMs`.
   - `isAuthFailure(status)`: Checks `status === 401 || status === 403`.
7. **`ubicacion.js`**:
   - `LIMA_CENTRO` (`{ lat: -12.0464, lng: -77.0428 }`), `LIMA_LIMITES`.
   - `distanciaMetros(a, b)`: Haversine distance formula.
   - `buscarDireccionGuardada(guardadas, texto, coords)`: Checks text equality and distance within 25m (`MISMA_UBICACION_M`).
   - `faltaMarcarUbicacion({ mapaDisponible, coords })`: Returns true only if map is available and coordinates are unselected.
8. **`validation.js`**:
   - `sanitizePhone(val)`: Strips non-digits, trims to 9 digits.
   - `validatePhone(val)`: Strict 9 digits regex check (`^\d{9}$`).

---

## 6. Critical Touchpoints, Risks & Implementation Advice

### 6.1. Coupon Handling (Gap Identified)
- **Observation**: Requirement R4 specifies supporting valid coupons (`PruebaCupon` [10%], `FOODJET20` [20%]) and rejecting invalid coupons in checkout.
- **Current State**:
  - `state.js` has `setActiveCoupon` / `getActiveCoupon`.
  - `ui.js` lines 522-544 render `activeCoupon` in `renderCheckoutCart()`.
  - In `index.html`, inputs `#couponCode` and `#applyCouponBtn` exist, but no event listener in `app.js` or `legacy.js` was connected to handle `#applyCouponBtn` clicks or set active coupons.
  - The backend `orderController.js` accepts `cupon_id` in `POST /api/orders` and validates against `prisma.discountCoupon`. However, there is no public `/api/coupons` GET endpoint to validate codes.
- **Touchpoint for Redesign**: The checkout coupon interaction must be wired on the frontend to match seeded coupons (`PruebaCupon` -> id: 1, 10%; `FOODJET20` -> id: 2, 20%) or reject unknown codes, displaying `#couponMessage` and passing `cupon_id` in `buildOrderPayload`.

### 6.2. Invariant: Pure Domain Modules & Unit Tests
- `tests/unit/domain.test.mjs` directly imports `googleMaps.js`, `domain/checkout.js`, and `domain/orderStatus.js`.
- Cucumber steps in `frontend/features/step_definitions/` import directly from `js/state.js`, `js/domain/*.js`, and `js/favorites.js`.
- **Constraint**: The exports and signatures of `frontend/js/domain/*.js` and `frontend/js/state.js` must NEVER be broken or altered during UI redesign.

### 6.3. Dual Script Lifecycles (Classic Script vs ESM)
- `legacy.js` is loaded as a classic script, whereas `app.js` is an ES module.
- `app.js` runs its module body before `DOMContentLoaded` fires.
- `window.FoodJetSession`, `window.FoodJetMapas`, and `window.FoodJetValidation` MUST be assigned in the module top-level of `app.js` before `DOMContentLoaded` so that `legacy.js`'s `DOMContentLoaded` listener can access them immediately.

### 6.4. Google Maps Cascading Fallback & Grace Window
- Rule R7 and `googleMaps.js` require a cascading retry mechanism (Primary key -> Secondary key -> Fallback mode without map).
- `window.gm_authFailure` must be properly hooked and the cleanup routine `limpiarResiduosGoogleMaps` must remove leftover `<script>` elements and global `google` references.
- All map containers (`#deliveryMapWrapper`, `#trackingMapCard`, `#orderDetailMapCard`) must support graceful degradation using `hidden` attributes and fallback address inputs.

### 6.5. Accessibility & Responsive Viewport Rules
- Skip link (`.skip-link`) pointing to `#main-content` must be preserved.
- When views are switched (`ui.showView()`), focus is programmatically moved to `viewToShow.querySelector('h1')` for WCAG 2.4.3 focus ordering compliance. All new view layouts must maintain a focusable `h1` (with `tabindex="-1"` if necessary).
- Fixed bottom or top navigation bars must not obscure inputs or buttons on mobile viewports (360px and 390px).
