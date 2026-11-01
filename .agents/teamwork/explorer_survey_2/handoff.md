# Handoff Report: Existing Codebase Architecture, DOM Contracts & Domain Bridges

**Explorer**: Survey Explorer 2  
**Working Directory**: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_2\`  
**Target Subsystem**: Frontend Web (`frontend/`) and Backend Contracts (`backend/`)  
**Parent Task ID**: `b2ab8d46-d54d-46d1-bb73-6ace23f6ae5c`

---

## 1. Observation

1. **Test Baseline Status**:
   - Executed `npm test` via terminal:
     - Frontend cucumber profile (`frontend/features/**/*.feature`): `76 scenarios (76 passed), 281 steps (281 passed)` in `0m00.350s`.
     - Backend cucumber profile (`backend/features/**/*.feature`): `45 scenarios (45 passed), 150 steps (150 passed)` in `0m00.181s`.
   - Executed `npm run test:unit`:
     - `tests/unit/domain.test.mjs`: `25 tests pass, 0 fail, 6 suites pass` covering both backend and frontend domain modules.
2. **Frontend Architecture & File Structure**:
   - `frontend/index.html` (939 lines, 61,272 bytes) houses the single-page application views: `#homeView` (lines 84-298), `#orderHistoryView` (lines 299-310), `#checkoutView` (lines 312-492), `#dashboardView` (lines 494-555), `#trackingView` (lines 557-657), plus modals `#orderDetailModal` (674-692), `#loginModal` (721-750), `#registerModal` (753-799), `#reviewModal` (801-840), `#qrModal` (842-864), `#miCuentaModal` (866-898), `#cardAuthModal` (920-935) and offcanvases `#cartOffcanvas` (694-719) and `#favoritesOffcanvas` (900-911).
   - Scripts loaded in `index.html`:
     - Line 913: `<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>`
     - Line 916: `<script src="js/config.js"></script>` (sets `window.FOODJET_API_URL = window.FOODJET_API_URL || '/api'`)
     - Line 917: `<script src="js/legacy.js"></script>` (710 lines, classic script managing auth modals, operations dashboard, toasts)
     - Line 918: `<script type="module" src="js/app.js"></script>` (752 lines, ESM module root orchestrator)
3. **Domain Bridge Declarations in `frontend/js/app.js`**:
   - Lines 18-22:
     ```javascript
     window.FoodJetSession = { isTokenExpired, isAuthFailure };
     window.FoodJetMapas = { crearMapaSeguimiento, fetchConfigAPI: api.fetchConfigAPI };
     window.FoodJetValidation = { sanitizePhone, validatePhone };
     ```
   - Lines 27-28 (inside DOMContentLoaded):
     ```javascript
     window.state = state;
     window.ui = ui;
     ```
   - Lines 515-575:
     ```javascript
     window.app = {
         loadFavorites: () => loadFavorites(),
         handleToggleFavorite: async (productId) => { ... },
         handleAddToCart: (productId) => { ... },
         handleRemoveFromCart: (productId) => { ... },
         handleRemoveItemCompletely: (productId) => { ... },
         showView: (viewId) => { ui.showView(viewId); }
     };
     ```
4. **Pure Domain Modules in `frontend/js/domain/`**:
   - `catalog.js` (108 lines): `calculateStudentPrice`, `renderProductPrice`, `parseDeliveryTime`, `filterProducts`, `calculateCartTotal`, `getProductRestaurant`, `getCartRestaurant`.
   - `checkout.js` (30 lines): `buildOrderPayload(cart, getProductById, metodoPago, direccionEntregaId = 1)`.
   - `orderStatus.js` (147 lines): `ESTADOS`, `TERMINALES`, `ETAPAS`, `normalizeEstado`, `isTerminal`, `getTrackingViewModel`, `isLineCompleted`, `getEstadoBadge`, `deriveSubtotal`.
   - `payment.js` (112 lines): `luhnCheck`, `detectBrand`, `validateNumber`, `validateExpiry`, `validateCvc`, `validateCard`, `formatCardNumber`, `formatExpiry`.
   - `seguimiento.js` (201 lines): `ETAPAS_SEGUIMIENTO`, `lineaDeTiempo`, `longitudRuta`, `avanceDelReparto`, `dividirRuta`, `formatearDistancia`, `formatearRestante`.
   - `session.js` (47 lines): `decodeJwtPayload`, `isTokenExpired`, `isAuthFailure`.
   - `ubicacion.js` (100 lines): `LIMA_CENTRO`, `LIMA_LIMITES`, `MISMA_UBICACION_M`, `coordenadasValidas`, `distanciaMetros`, `buscarDireccionGuardada`, `direccionInicial`, `faltaMarcarUbicacion`.
   - `validation.js` (40 lines): `LONGITUD_TELEFONO`, `sanitizePhone`, `validatePhone`.
5. **Backend Route Contracts in `backend/src/index.js` & `backend/src/routes/`**:
   - Routes mounted at `/api/auth`, `/api/products`, `/api/orders`, `/api/reviews`, `/api/favorites`, `/api/users`, `/api/addresses`, `/api/restaurants`, `/api/config`.
   - `backend/prisma/seed.js` lines 113-116 defines seeded coupons:
     - `PruebaCupon` (10.0% discount, id: 1)
     - `FOODJET20` (20.0% discount, id: 2)
   - `backend/src/controllers/orderController.js` lines 89-95 verifies `cupon_id` against `prisma.discountCoupon`. However, the checkout UI inputs `#couponCode` and `#applyCouponBtn` (`index.html:458-459`) are unattached to any click listener in `app.js` or `legacy.js`.

---

## 2. Logic Chain

1. **Preservation of Domain Modules**:
   - `tests/unit/domain.test.mjs` directly imports `googleMaps.js`, `domain/checkout.js`, and `domain/orderStatus.js`.
   - All 11 Cucumber step definition files in `frontend/features/step_definitions/*.steps.mjs` directly import functions from `js/state.js`, `js/domain/*.js`, and `js/favorites.js` (e.g. `carrito.steps.mjs` imports `addToCart` from `state.js` and `getCartRestaurant` from `catalog.js`).
   - Therefore, any modification that alters function signatures, removes exports, or moves files inside `frontend/js/domain/` or `frontend/js/state.js` will immediately break unit tests and Cucumber test suites, violating Acceptance Criteria R2 and R5.
2. **Preservation of DOM Contracts**:
   - The user flows in `legacy.js` and `app.js` bind listeners via specific DOM IDs (`checkoutForm`, `customerPhone`, `customerPhoneError`, `customerAddress`, `deliveryMapWrapper`, `deliveryMap`, `deliveryAddressSearch`, `deliveryMapLocate`, `deliveryMapStatus`, `reviewForm`, `starRatingContainer`, `qrModal`, `cardAuthModal`, etc.).
   - When styling and modernizing templates, maintaining these exact IDs, input names (`paymentMethod`, `deliveryTimeFilter`), and data attributes (`data-order-id`, `data-id`, `data-filter`, `data-situacion`) is required for existing UI behavior and backward compatibility.
3. **Execution Order of Global Bridges**:
   - `legacy.js` (a classic script) runs its `DOMContentLoaded` listener after `app.js` executes its module body.
   - `legacy.js` relies on `window.FoodJetSession` (line 23), `window.FoodJetValidation` (line 60, 160), and `window.FoodJetMapas` (line 542).
   - Therefore, `window.FoodJetSession`, `window.FoodJetValidation`, and `window.FoodJetMapas` must remain declared at the top-level of `app.js` before DOMContentLoaded.
4. **Resolution of Coupon Support**:
   - R4 requires functional coupon application in Checkout (`PruebaCupon` and `FOODJET20`).
   - Because no backend `/api/coupons` endpoint exists, but backend `POST /api/orders` supports `cupon_id` and the database seeds known coupons with IDs 1 and 2, the frontend can evaluate known coupon codes locally against known active coupons, store them via `state.setActiveCoupon()`, reflect them in `ui.renderCheckoutCart()`, and pass `cupon_id` in the order payload.

---

## 3. Caveats

1. **Backend Read-Only Scope**:
   - No backend code (`backend/`), Prisma schema, database migrations, or server routes may be modified. All UI fixes and bindings must adapt to existing backend contracts.
2. **Third-Party Google Maps API**:
   - Google Maps loading depends on client-side API keys and network access. The dual cascading retry and graceful fallback without interactive maps (GPS/manual text) must be verified under offline/failure conditions.
3. **Caddy Proxy Dependency**:
   - In production and Docker local environments, all requests are served via relative path `/api` behind Caddy reverse proxy. Direct calls to absolute `http://localhost:3000` must remain strictly fallback for Node tests.

---

## 4. Conclusion

The FoodJet frontend is a well-modularized Vanilla JS + Bootstrap 5.3 SPA whose business logic is cleanly segregated into pure domain modules in `frontend/js/domain/`.
The UI redesign can proceed smoothly by:
1. Updating presentation, HTML structure, tokens, and CSS styles while keeping all identified DOM IDs, input attributes, and dynamic rendering hooks intact.
2. Strictly retaining all function signatures and exports in `frontend/js/domain/*.js` and `frontend/js/state.js`.
3. Retaining the global bridges in `app.js` (`window.FoodJetSession`, `window.FoodJetMapas`, `window.FoodJetValidation`, `window.app`, `window.state`, `window.ui`).
4. Wiring the coupon input `#couponCode` and `#applyCouponBtn` in the checkout flow to satisfy requirement R4 without touching backend code.

---

## 5. Verification Method

To independently verify the architecture, contracts, and test baseline:
1. Run full Cucumber test suite:
   ```powershell
   npm test
   ```
   *Expected result*: Both `frontend` and `backend` profiles pass 100% (76 frontend scenarios, 45 backend scenarios, 0 failures).
2. Run white-box unit test suite:
   ```powershell
   npm run test:unit
   ```
   *Expected result*: All 25 domain and cascading loader unit tests pass cleanly.
3. Inspect contract registry in report:
   ```powershell
   Get-Content C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_survey_2\report.md
   ```
