# Baseline Technical Survey Report: Tests, Git State & Runtime Environment

**Date**: 2026-10-29  
**Agent**: Survey Explorer 3 (`explorer_survey_3`)  
**Mission**: Establish technical baseline prior to UI frontend redesign on `feat/UI-frontend-update`.

---

## 1. Executive Summary

This report provides the exhaustive baseline verification of the technical environment for **FoodJet**, establishing pre-existing conditions across Git version control, test suite executions (unit tests, Cucumber frontend/backend features), report generation, Docker/port runtime status, and DOM contract touchpoints.

### Key Takeaways
1. **Git State**: Current branch is `feat/UI-frontend-update` at commit `515e3ad Document Google Maps API keys (#54)`. Working tree is clean (only untracked `.agents/` and a non-functional trailing newline in `AGENTS.md`).
2. **Baseline Tests (100% Passing)**:
   - `npm test`: **121 scenarios (121 passed), 431 steps (431 passed), 0 failures**.
   - `npm run test:frontend`: **76 scenarios (76 passed), 281 steps (281 passed)** across 11 feature files.
   - `npm run test:backend`: **45 scenarios (45 passed), 150 steps (150 passed)** across 5 feature files.
   - `npm run test:unit`: **25 tests (25 passed), 6 suites, 0 failures**, coverage at **79.37% lines / 75.81% branches**.
3. **Runtime Environment**:
   - Docker Desktop Service (`com.docker.service`) is currently **Stopped**.
   - No daemon or container is listening on ports `8081` (`foodjet-web`), `3000` (`foodjet-api`), or `5433` (`foodjet-db`).
   - `http://localhost:8081` is currently unreachable (connection timed out).
4. **Browser Automation Ready**:
   - Chrome DevTools MCP is active, tested, and operational (`about:blank` page ready for responsive inspection and visual testing).
5. **Cucumber HTML Report Nuance**:
   - In `cucumber.js`, both `frontend` and `backend` profiles target `reports/cucumber.html`. Sequential execution in `npm test` overwrites the file, preserving only the backend execution in `reports/cucumber.html`. Running `npm run test:frontend` generates the frontend HTML report.

---

## 2. Git Repository & Branch State

### Status & Tracking
- **Active Branch**: `feat/UI-frontend-update` (matches authoritative prompt requirement).
- **Upstream Sync**: Up to date with `origin/feat/UI-frontend-update`.
- **Head Commit**: `515e3ad Document Google Maps API keys (#54)`.
- **Recent Commit History**:
  - `515e3ad` Document Google Maps API keys (#54)
  - `5bf36e8` feat(maps): soporte de cascada de doble API Key con fallback y modo degradado (#52)
  - `0adee28` feat: mapas y reparto simulado (checkout con mapa y seguimiento en vivo) (#51)
  - `c4b0648` docs(ci): agregar comentario de sincronización en notify-mobile-repo (#50)
  - `0fe6999` Fail fast if cross-repo PAT is missing (#49)

### Working Tree Cleanliness
- Changes not staged: `AGENTS.md` (modified: single blank newline at end of file).
- Untracked files: `.agents/` (teamwork metadata directory).
- Source code directories (`frontend/`, `backend/`, `tests/`) are 100% pristine and unmodified.

---

## 3. Runtime Environment & Service Availability

### Docker & Host Port Diagnostics
- Command: `Get-Service *docker*`
  - Result: `com.docker.service` (Docker Desktop Service) is **Stopped**.
- Command: `docker compose ps`
  - Result: Exit code 1 (`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine... The system cannot find the file specified`).
- Port Scanning (`Get-NetTCPConnection -State Listen`):
  - Port `8081` (Caddy web proxy): **Inactive / Not listening**.
  - Port `3000` (Node/Express API): **Inactive / Not listening**.
  - Port `5433` (PostgreSQL DB): **Inactive / Not listening**.
- HTTP Connectivity Test:
  - `Invoke-WebRequest -Uri "http://localhost:8081" -TimeoutSec 3`
  - Result: Connection timed out (*"La operación sobrepasó el tiempo de espera"*).

### Chrome DevTools MCP Availability
- Lazy tool check: `list_pages` on `chrome-devtools`.
- Execution result:
  ```markdown
  ## Pages
  1: about:blank [selected]
  ```
- Verification: Browser automation and visual testing capabilities via Chrome DevTools MCP are operational and ready for automated screenshot captures once the local web container or server is active.

---

## 4. Baseline Test Suite Execution

### 4.1 Unit Tests (`npm run test:unit`)
- **Command**: `node --no-warnings --test --experimental-test-coverage tests/unit/domain.test.mjs`
- **Duration**: ~892 ms
- **Results**: 25 passed, 0 failed, 0 skipped (6 suites).
- **Test Suites Breakdown**:
  1. *White-Box Unit Tests - Order Status Domain (Backend)*: 5 tests passed
     - Normalizes states with accents and uppercase (`'En preparación'` -> `'en_preparacion'`).
     - Validates allowed workflow transitions.
     - Rejects invalid transitions or skipped states.
     - Allows cancellation only in cancelable states (`pendiente`, `confirmado`).
     - Detects terminal states (`entregado`, `cancelado`).
  2. *White-Box Unit Tests - Payment Domain (Backend)*: 2 tests passed
     - Validates supported payment methods (`cash`, `CARD`, `wallet`).
     - Resolves initial payment and order status according to method.
  3. *White-Box Unit Tests - User Validation (Backend)*: 2 tests passed
     - Rejects registration with incomplete data (status 400).
     - Validates exact 9-digit Peruvian phone number format.
  4. *White-Box Unit Tests - Frontend Domain*: 4 tests passed
     - Calculates tracking viewModel (`getTrackingViewModel`).
     - Derives subtotal by deducting taxes and shipping (`deriveSubtotal`).
     - Obtains correct badge by status (`getEstadoBadge`).
     - Constructs order payload correctly (`buildOrderPayload`).
  5. *White-Box Unit Tests - Google Maps Config Domain (Backend)*: 6 tests passed
     - Resolves primary and secondary keys from environment variables.
     - Fallback resolution if primary or secondary key is missing.
     - Deduplication, trimming, and safe handling of non-string values.
  6. *White-Box Unit Tests - Google Maps Cascading Loader (Frontend)*: 6 tests passed
     - Successful load with primary key without touching secondary.
     - Transparent retry with secondary key if primary triggers `gm_authFailure`.
     - Retry with secondary key if primary triggers network `onerror`.
     - Rejection notification and fallback callback execution if all keys fail.
     - Immediate rejection if keys list is empty.
     - Object options format support (`{ apiKey, apiKeys }`).
- **Code Coverage Summary**:
  - `backend/src/domain/mapsConfig.js`: 100.00% lines, 100.00% branches
  - `backend/src/domain/orderStatus.js`: 100.00% lines, 100.00% branches
  - `backend/src/domain/payment.js`: 100.00% lines, 90.00% branches
  - `backend/src/domain/userValidation.js`: 100.00% lines, 88.89% branches
  - `frontend/js/api.js`: 37.45% lines, 40.00% branches
  - `frontend/js/domain/checkout.js`: 100.00% lines, 75.00% branches
  - `frontend/js/domain/orderStatus.js`: 98.63% lines, 69.23% branches
  - `frontend/js/googleMaps.js`: 92.55% lines, 66.10% branches
  - **All Files Overall**: **79.37% lines, 75.81% branches, 73.68% functions**.

### 4.2 Frontend Acceptance Tests (`npm run test:frontend`)
- **Command**: `cucumber-js --profile frontend`
- **Duration**: ~225 ms
- **Scenarios**: **76 passed / 76 total (100%)**
- **Steps**: **281 passed / 281 total (100%)**
- **Features Verified**:
  - `billetera.feature`: 3 scenarios (UT-WALLET-001..003)
  - `carrito.feature`: 6 scenarios (UT-CART-001..006)
  - `descuentos.feature`: 3 scenarios (UT-USER-001..003)
  - `favoritos.feature`: 3 scenarios (UT-FAVO-001..003)
  - `filtros_productos.feature`: 3 scenarios (UT-REST-001..003)
  - `pago_tarjeta.feature`: 3 scenarios (UT-CARD-001..003)
  - `seguimiento.feature`: 5 scenarios (UT-TRACK-001..005)
  - `seguimiento_mapa.feature`: 8 scenarios (UT-SEG-001..008)
  - `sesion.feature`: 5 scenarios (UT-SESS-001..005)
  - `ubicacion_entrega.feature`: 10 scenarios (UT-UBI-001..010)
  - `validacion_telefono.feature`: 5 scenarios (UT-TEL-001..005)

### 4.3 Backend Acceptance Tests (`npm run test:backend`)
- **Command**: `cucumber-js --profile backend`
- **Duration**: ~167 ms
- **Scenarios**: **45 passed / 45 total (100%)**
- **Steps**: **150 passed / 150 total (100%)**
- **Features Verified**:
  - `coordenadas.feature`: 1 scenario (UT-COORD-001)
  - `estado_pedido.feature`: 4 scenarios (EST-001..004)
  - `pago.feature`: 2 scenarios (PAG-001..002)
  - `registro_backend.feature`: 5 scenarios (AUT-001..004)
  - `simulacion.feature`: 8 scenarios (UT-SIM-001..008)

### 4.4 Master Acceptance Suite (`npm test`)
- Executes: `npm run test:frontend && npm run test:backend`
- Cumulative Totals: **121 scenarios passed, 431 steps passed, 0 failures**.

---

## 5. Cucumber Report Mechanism & `reports/cucumber.html`

### File Inspection
- **File**: `reports/cucumber.html` (size: ~1.23 MB to 1.47 MB).
- **Structure**: Standalone HTML application embedding Cucumber message protocol (`window.CUCUMBER_MESSAGES = [...]`).

### Profile Overwrite Behavior
- In `cucumber.js`:
  ```javascript
  const common = {
      format: ['progress-bar', 'html:reports/cucumber.html'],
      formatOptions: { snippetInterface: 'async-await' }
  };
  ```
- Because `npm test` runs sequentially (`npm run test:frontend && npm run test:backend`), the backend cucumber run overwrites `reports/cucumber.html`.
- Verification:
  - After `npm test`: `reports/cucumber.html` contains the 5 backend features.
  - After `npm run test:frontend`: `reports/cucumber.html` contains the 11 frontend features.
- Recommendation: Keep existing scripts intact (as required by R2 zero modification to backend/build config), but document that running `npm run test:frontend` is necessary if user/CI needs the frontend-specific Cucumber HTML report.

---

## 6. Inventory of Frontend Acceptance Tests & DOM/Module Touchpoints

The frontend Cucumber suite does not instantiate a real browser; it tests the underlying **domain modules**, **state management**, and **service contracts** that power `frontend/index.html` and `frontend/js/ui.js`:

| Feature File | Scenarios | Target JavaScript Module | Function / Contract Tested |
|---|---|---|---|
| `billetera.feature` | 3 | `frontend/js/state.js`<br>`frontend/js/domain/checkout.js`<br>`frontend/js/domain/catalog.js` | `buildOrderPayload('wallet')`, restaurant QR resolution, payment abort on missing QR |
| `carrito.feature` | 6 | `frontend/js/state.js`<br>`frontend/js/domain/catalog.js` | `addToCart`, `isCartEmpty`, `getCartItemCount`, single-restaurant restriction (`getCartRestaurant`) |
| `descuentos.feature` | 3 | `frontend/js/domain/catalog.js` | `renderProductPrice` (20% student discount calculation and display) |
| `favoritos.feature` | 3 | `frontend/js/favorites.js`<br>`frontend/js/state.js` | `loadFavorites`, token validation, API error handling |
| `filtros_productos.feature` | 3 | `frontend/js/domain/catalog.js` | `filterProducts` (category match, max prep/delivery time, price filtering) |
| `pago_tarjeta.feature` | 3 | `frontend/js/domain/payment.js` | `validateCard`, `detectBrand` (Luhn algorithm, expiration MM/YY, CVC validation) |
| `seguimiento.feature` | 5 | `frontend/js/domain/orderStatus.js` | `getTrackingViewModel`, state transitions (`pendiente` -> `confirmado` -> `en_preparacion` -> `en_camino` -> `entregado`), `deriveSubtotal`, polling termination |
| `seguimiento_mapa.feature` | 8 | `frontend/js/domain/seguimiento.js` | Timeline estimated vs actual timestamps, route interpolation, ETA distance/time calculation |
| `sesion.feature` | 5 | `frontend/js/domain/session.js` | `isTokenExpired`, `isAuthFailure` (401/403 status detection), `decodeJwtPayload` |
| `ubicacion_entrega.feature` | 10 | `frontend/js/domain/ubicacion.js` | `buscarDireccionGuardada`, `direccionInicial`, `faltaMarcarUbicacion`, `coordenadasValidas` |
| `validacion_telefono.feature` | 5 | `frontend/js/domain/validation.js` | `sanitizePhone`, `validatePhone` (Peruvian 9-digit format) |

---

## 7. DOM Contracts & Architectural Preservation Constraints

From the comprehensive extraction of `frontend/index.html` (165 unique IDs) and `frontend/js/`, the redesign must preserve the following contracts:

### 1. Global Window Bridges
- `window.FoodJetSession = { isTokenExpired, isAuthFailure };` (consumed by auth guards and session refresh)
- `window.FoodJetMapas = { crearMapaSeguimiento, fetchConfigAPI };` (consumed by tracking and maps)
- `window.FoodJetValidation = { sanitizePhone, validatePhone };` (consumed by checkout and registration forms)
- `window.authToken`, `window.currentUser`, `window.app`, `window.state`, `window.ui`.

### 2. Primary Views & DOM Identifiers
- **Home & Catalog**: `homeView`, `heroCarousel`, `menu`, `productsGrid`, `filter-food-type-container`, `filter-price-min`, `filter-price-max`, `time-30`, `time-60`, `time-more`, `btn-apply-filters`, `btn-clear-filters`.
- **Cart & Offcanvas**: `cartOffcanvas`, `cartItemsContainer`, `cartTotal`, `cartCount`, `cartItemCount`, `checkoutBtn`, `emptyCart`.
- **Checkout**: `checkoutView`, `checkoutForm`, `checkoutItems`, `checkoutSubtotal`, `checkoutTaxes`, `checkoutDelivery`, `checkoutDiscount`, `checkoutDiscountRow`, `checkoutTotal`, `customerName`, `customerAddress`, `customerReference`, `customerPhone`, `customerPhoneError`, `deliveryAddressSearch`, `deliveryMapWrapper`, `deliveryMap`, `deliveryMapStatus`, `deliveryMapLocate`, `payCard`, `payCash`, `payWallet`, `cardDetails`, `cardNumber`, `cardExpiry`, `cardCvc`, `couponCode`, `applyCouponBtn`, `couponMessage`.
- **Tracking**: `trackingView`, `trackingLayout`, `statusTitle`, `statusDescription`, `statusIcon`, `step1`..`step4`, `stepTime1`..`stepTime4`, `trackingConnection`, `etaValue`, `etaText`, `trackingMapCard`, `trackingMap`, `trackingRoute`, `orderNumber`, `orderDate`, `orderDelivery`, `orderPayment`, `orderSubtotal`, `orderTaxes`, `orderTotalFinal`, `trackingHistoryBtn`, `backToMenuFromTracking`.
- **Modals**:
  - `loginModal` (`loginEmail`, `loginPassword`, `loginBtn`)
  - `registerModal` (`registerName`, `registerEmail`, `registerPassword`, `registerPhone`, `registerPhoneError`)
  - `miCuentaModal` (`studentStatusContainer`, `verifyStudentFormContainer`, `verifyStudentForm`, `carnetImage`, `verifyStudentSubmitBtn`)
  - `cardAuthModal` (`cardAuthBrand`, `cardNumberError`, `cardExpiryError`, `cardCvcError`)
  - `qrModal` (`qrRestaurantName`, `qrPaymentImage`, `qrTimerText`, `cancelQrPaymentBtn`)
  - `orderDetailModal` (`orderDetailTitle`, `orderDetailBody`, `orderDetailMapCard`, `orderDetailMap`, `orderDetailRoute`)
  - `reviewModal` (`reviewRestaurantName`, `reviewOrderId`, `reviewOrderDate`, `starRatingContainer`, `reviewRating`, `reviewComment`, `submitReviewBtn`)
  - `favoritesOffcanvas` (`favoritesItemsContainer`, `favoritesBtn`, `favoritesNav`)
- **Dashboard / Admin Operations**: `dashboardView`, `operationsFilters`, `operationsTableBody`, `operationsNotice`, `operationsUpdated`, `refreshOperationsBtn`.

---

## 8. Baseline Summary Table

| Category | Component / Suite | Baseline Status | Error / Warning Notes |
|---|---|---|---|
| **Git** | Branch `feat/UI-frontend-update` | Clean (commit `515e3ad`) | Only `.agents/` untracked and trailing newline in `AGENTS.md` |
| **Unit Tests** | `npm run test:unit` | **25/25 PASSED (100%)** | Clean pass, 79.37% coverage; expected mock ECONNREFUSED during offline fallback unit test |
| **Frontend Tests** | `npm run test:frontend` | **76/76 PASSED (100%)** | 281 steps passed; harmless typeless package.json ESM warning for `state.js` |
| **Backend Tests** | `npm run test:backend` | **45/45 PASSED (100%)** | 150 steps passed |
| **Full Suite** | `npm test` | **121/121 PASSED (100%)** | 431 steps passed; overwrites `reports/cucumber.html` with backend run |
| **Docker Engine** | Docker Desktop Service | **Stopped** | Daemon down; containers offline |
| **Ports** | `8081`, `3000`, `5433` | **Closed / Not listening** | No server processes active |
| **Web Server** | `http://localhost:8081` | **Unreachable** | Timeout (expected while Docker daemon is stopped) |
| **DevTools MCP** | `chrome-devtools` | **Connected & Operational** | `list_pages` verified (`about:blank` ready) |
