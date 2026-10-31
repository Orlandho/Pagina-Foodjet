# Task Assignment — Worker M4: Milestone 4 Implementation

**Milestone**: Milestone 4 — Secondary Views, Modals & Operations Panel  
**Agent Role**: Worker M4 (Implementation & QA)  
**Assigned Subagent**: `teamwork_worker`  
**Working Directory**: `.agents/teamwork/worker_m4/`  

## Mandatory Integrity Warning
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Write Ownership Boundaries
Worker M4 has exclusive write ownership of:
- `frontend/index.html`
- `frontend/styles.css`
- `frontend/js/ui.js`
- `frontend/js/app.js`
- `frontend/js/legacy.js`

**PROHIBITED**: You MUST NOT touch `backend/`, `prisma/`, seeds, migrations, `docker-compose.yml`, or `Caddyfile`. Zero backend changes allowed.

## Inputs & Specifications
Read and follow:
1. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md` (MANDATORY)
2. `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md`
3. Explorer Reports:
   - `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m4_1\report.md` (Auth & Registration Modals)
   - `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m4_2\report.md` (My Account & Student Verification)
   - `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m4_3\report.md` (Secondary Modals, History, Admin Panel)
4. Reference Compose mobile prototype at:
   `C:\Users\ORLANDO\Desktop\ciclo 9\frontend para actualizar foodjet para app moviles y adm de proyec de software\proyecto-app-movil-UPN-2026-2-main`

## Specific Implementation Requirements

### 1. Feature 16: Authentication & Registration Modals
- Update `#loginModal` and `#registerModal` in `frontend/index.html` and `frontend/styles.css`:
  - Preserve 100% of the 16 DOM IDs: `#loginModal`, `#loginModalLabel`, `#loginForm`, `#loginEmail`, `#loginPassword`, `#loginBtn`, `#registerModal`, `#registerModalLabel`, `#registerForm`, `#registerName`, `#registerEmail`, `#registerEmailError`, `#registerPhone`, `#registerPhoneAyuda`, `#registerPhoneError`, `#registerPassword`.
  - Apply Compose modal styling: 20px card border-radius, warm cream/surface backgrounds, centered 56dp circular avatar icon (`.foodjet-modal-avatar`), outlined inputs with leading icons.
  - Add accessible password visibility toggles (`.foodjet-password-toggle`) wired in `frontend/js/legacy.js` or `app.js`.
  - Add quick test account buttons (`.foodjet-quick-login-btn`) for Admin, Estudiante, Cliente in `#loginModal`.
  - Style `#loginError` and `#registerEmailError` inline error banners matching Compose `errorContainer`.

### 2. Feature 17: My Account & Student Verification
- Update `#miCuentaModal` in `frontend/index.html` and `frontend/styles.css`:
  - Preserve 100% of DOM IDs: `#miCuentaModal`, `#miCuentaModalLabel`, `#studentStatusContainer`, `#verifyStudentFormContainer`, `#verifyStudentForm`, `#carnetImage`, `#verifyStudentSubmitBtn`, `#miCuentaBtn`.
  - Apply 60dp circular avatar in peach/orange tint, user display name/email/phone, student status banner (styling `#studentStatusContainer.alert-success` and `#studentStatusContainer.alert-secondary`), file dropzone card, discount eligibility callout.
  - In `frontend/js/app.js` or `ui.js`: Add synchronization on `show.bs.modal` for `#miCuentaModal` so user details update reliably regardless of whether opened via `#headerAddressBar` or `#miCuentaBtn`.

### 3. Feature 18: Digital Wallet & Bank Auth Modals
- Update `#qrModal` and `#cardAuthModal` in `frontend/index.html` and `frontend/styles.css`:
  - Preserve IDs: `#qrModal`, `#qrModalLabel`, `#qrRestaurantName`, `#qrPaymentImage`, `#qrTimerText`, `#cancelQrPaymentBtn`, `#cardAuthModal`, `#cardAuthModalLabel`, `#cardAuthBrand`.
  - Dedicated 200dp square container with `border: 2px solid var(--color-primary)` for the QR image, timer pill, 48dp cancel button with clean interval cleanup.
  - Card authorization modal with branded badge and centered spinner.

### 4. Feature 19: Order History View & Review Modal
- Update `#orderHistoryView` and `#reviewModal`:
  - Preserve IDs: `#orderHistoryView`, `#backToMenuFromHistory`, `#orderHistoryContainer`, `#reviewModal`, `#reviewModalLabel`, `#reviewRestaurantName`, `#reviewOrderDate`, `#reviewForm`, `#reviewOrderId`, `#starRatingContainer`, `#reviewRating`, `#reviewComment`, `#submitReviewBtn`.
  - In `frontend/js/ui.js` (`renderOrderHistory`): Enhance card template with Compose-aligned status badges, tracking CTA button (`.btn-ver-seguimiento`), review CTA button (`.btn-leave-review`), and pagination.
  - Enhance `#reviewModal` with interactive 5-star rating hover/active states.

### 5. Feature 20: Admin Operations Panel
- Update `#dashboardView` and `#orderDetailModal`:
  - Preserve IDs: `#dashboardView`, `#backToMenuFromDashboard`, `#dashboardUserName`, `#dashboardUserEmail`, `#refreshOperationsBtn`, `#logoutBtnDashboard`, `#operationsUpdated`, `#operationsFilters`, `#operationsTableBody`, `#operationsNotice`, `#orderDetailModal`, `#orderDetailMap`.
  - Fix `.operaciones__filtro` in `frontend/styles.css` to use `var(--color-border)` and replace `btn-close-white` with `btn-close` on `#orderDetailModal`.
  - Add horizontal scrolling container (`.operaciones__filtros-wrapper`) on mobile screens to prevent overflow.

## Verification & Completion Criteria
Worker M4 must execute and verify:
1. `npm run test:unit`: 25/25 pass.
2. `node tests/unit/e2e_acceptance_tiers.test.mjs`: 68/68 pass.
3. `node tests/unit/challenger_m3_1_empirical.test.mjs`: 30/30 pass.
4. `node tests/unit/challenger_m3_2_empirical.test.mjs`: 26/26 pass.
5. `npm run test:frontend`: 86/86 scenarios pass.
6. `npm test`: 131/131 scenarios pass.
7. Verify all baseline DOM IDs remain intact.
8. Verify git status of `backend/`, `prisma/`, `docker-compose.yml`, `Caddyfile` is 100% clean.
9. Deliver `report.md` and `handoff.md` in `.agents/teamwork/worker_m4/`.


## 2026-10-31T00:27:10Z
You are Worker M4 (teamwork_worker) for Milestone 4 (Secondary Views, Modals & Operations Panel).
Your working directory is: C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m4\

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

READ FIRST:
1. C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\ORIGINAL_REQUEST.md (MANDATORY: read before starting)
2. C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\PROJECT.md
3. C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\worker_m4\DISPATCH.md
4. Explorer reports:
   - C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m4_1\report.md (Auth & Registration Modals)
   - C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m4_2\report.md (My Account & Student Verification)
   - C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m4_3\report.md (Secondary Modals, History, Admin Panel)
5. Compose mobile prototype reference at:
   C:\Users\ORLANDO\Desktop\ciclo 9\frontend para actualizar foodjet para app moviles y adm de proyec de software\proyecto-app-movil-UPN-2026-2-main

WRITE OWNERSHIP:
You have exclusive write ownership of:
- frontend/index.html
- frontend/styles.css
- frontend/js/ui.js
- frontend/js/app.js
- frontend/js/legacy.js
DO NOT touch backend/, prisma/, docker-compose.yml, or Caddyfile. Zero backend changes!

IMPLEMENTATION TASKS:
1. Feature 16: Authentication & Registration Modals (#loginModal, #registerModal):
   - Preserve 100% of the 16 DOM IDs.
   - Apply Compose styling: 20px card border radius, warm cream surface, centered 56dp avatar icon (.foodjet-modal-avatar), outlined inputs with leading icons.
   - Add password visibility toggle (.foodjet-password-toggle) wired in legacy.js or app.js.
   - Add quick test account buttons (.foodjet-quick-login-btn) in #loginModal.
   - Inline error banners (#loginError, #registerEmailError, #registerPhoneError) styled matching Compose errorContainer.
2. Feature 17: My Account & Student Verification (#miCuentaModal):
   - Preserve all DOM IDs (#miCuentaModal, #miCuentaModalLabel, #studentStatusContainer, #verifyStudentFormContainer, #verifyStudentForm, #carnetImage, #verifyStudentSubmitBtn, #miCuentaBtn).
   - Apply 60dp circular avatar in peach/orange, user info, student status banner (styling #studentStatusContainer.alert-success and #studentStatusContainer.alert-secondary), file dropzone, discount eligibility callout.
   - Add show.bs.modal synchronization hook for #miCuentaModal.
3. Feature 18: Digital Wallet (#qrModal) & Bank Auth (#cardAuthModal):
   - Preserve all DOM IDs. Dedicated 200dp square container with 2px primary orange border for QR image, timer pill, 48dp cancellation button with interval cleanup. Card auth modal with brand badge and spinner.
4. Feature 19: Order History View (#orderHistoryView) & Review Modal (#reviewModal):
   - Preserve all DOM IDs. Enhanced card template in ui.js with Compose status badges, tracking CTA button (.btn-ver-seguimiento), review CTA button (.btn-leave-review), and pagination.
   - Review modal with interactive 5-star rating hover/click states.
5. Feature 20: Admin Operations Panel (#dashboardView & #orderDetailModal):
   - Preserve all DOM IDs. Fix .operaciones__filtro border to use var(--color-border) and replace btn-close-white with btn-close on #orderDetailModal.
   - Horizontally scrollable filter chips wrapper (.operaciones__filtros-wrapper) on mobile viewports.

VERIFICATION REQUIREMENTS:
Run test commands:
- npm run test:unit
- node tests/unit/e2e_acceptance_tiers.test.mjs
- node tests/unit/challenger_m3_1_empirical.test.mjs
- node tests/unit/challenger_m3_2_empirical.test.mjs
- npm run test:frontend
- npm test
Verify 0 modifications to backend/, prisma/, docker-compose.yml, Caddyfile.
Verify all 165+ preserved DOM IDs exist.
Write report.md and handoff.md in your working directory and notify parent via send_message.
