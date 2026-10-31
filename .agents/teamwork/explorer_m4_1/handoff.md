# Handoff Report: Explorer M4-1 (Feature 16: Authentication & Registration Modals)

## 1. Observation
1. **Existing Web DOM Elements & IDs**:
   - `frontend/index.html:1032`: `<div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">`
   - `frontend/index.html:1036`: `<h5 class="modal-title w-100 text-center" id="loginModalLabel">`
   - `frontend/index.html:1043`: `<form id="loginForm">`
   - `frontend/index.html:1046`: `<input type="email" class="form-control" id="loginEmail" placeholder="tu@email.com" required>`
   - `frontend/index.html:1052`: `<input type="password" class="form-control" id="loginPassword" placeholder="••••••••" required>`
   - `frontend/index.html:1064`: `<div class="modal fade" id="registerModal" tabindex="-1" aria-labelledby="registerModalLabel" aria-hidden="true">`
   - `frontend/index.html:1068`: `<h5 class="modal-title w-100 text-center" id="registerModalLabel">`
   - `frontend/index.html:1075`: `<form id="registerForm">`
   - `frontend/index.html:1080`: `<input type="text" class="form-control" id="registerName" placeholder="" required>`
   - `frontend/index.html:1084`: `<input type="email" class="form-control" id="registerEmail" placeholder="tu@email.com" required>`
   - `frontend/index.html:1085`: `<div id="registerEmailError" class="text-danger mt-1" style="display: none; font-size: 0.875em;">Una cuenta con este correo ya existe</div>`
   - `frontend/index.html:1089`: `<input type="tel" class="form-control" id="registerPhone" placeholder="987654321" inputmode="numeric" autocomplete="tel" maxlength="9" pattern="\d{9}" title="Debe contener exactamente 9 dígitos numéricos" aria-describedby="registerPhoneAyuda registerPhoneError" required>`
   - `frontend/index.html:1093`: `<div id="registerPhoneAyuda" class="form-text">9 dígitos, solo números.</div>`
   - `frontend/index.html:1094`: `<div id="registerPhoneError" class="invalid-feedback"></div>`
   - `frontend/index.html:1100`: `<input type="password" class="form-control" id="registerPassword" placeholder="••••••••" required>`

2. **JavaScript Bindings & Form Handling**:
   - `frontend/js/legacy.js:73-76`: `#loginBtn` listener triggers `bootstrap.Modal.getOrCreateInstance(document.getElementById('loginModal')).show()`.
   - `frontend/js/legacy.js:79`: `document.getElementById('loginForm')?.addEventListener('submit', handleLogin)`.
   - `frontend/js/legacy.js:84`: `registerForm.addEventListener('submit', handleRegister)`.
   - `frontend/js/legacy.js:116-117`: `handleLogin` reads `loginEmail.value` and `loginPassword.value`.
   - `frontend/js/legacy.js:153-156`: `handleRegister` reads `registerName.value`, `registerEmail.value`, `registerPhone.value`, `registerPassword.value`.
   - `frontend/js/legacy.js:192-195`: On 409, `registerEmailError` is set to `style.display = 'block'`.
   - `frontend/js/legacy.js:57-67`: Input listener on `#registerPhone` calls `window.FoodJetValidation?.sanitizePhone(registerPhone.value)` and clears `#registerPhoneError`.
   - `frontend/js/legacy.js:137-141`: On login success, `loginModal.hide()`, `updateUserUI(window.currentUser)` is called, and `document.getElementById('loginForm').reset()`.
   - `frontend/js/legacy.js:183-191`: On register success, `registerModal.hide()`, `loginModal.show()` after 500ms, and `document.getElementById('registerForm').reset()`.
   - `frontend/js/ui.js:169` & `frontend/js/ui.js:530`: Triggers `#loginModal` when unauthenticated users click address bar or favorite heart buttons.
   - `frontend/js/app.js:197`: Triggers `#loginModal` when unauthenticated users click checkout button in cart offcanvas.

3. **Jetpack Compose Reference Prototype (`Modals.kt`)**:
   - `Modals.kt:59-63`: `Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface))` with `Modifier.padding(24.dp)`.
   - `Modals.kt:69-76`: Centered circular badge (`size(56.dp)`, `CircleShape`, background `FoodJetPrimary.copy(alpha = 0.2f)`, icon tint `FoodJetPrimaryDark` #D94310, size 32dp).
   - `Modals.kt:78`: Title `Text("Iniciar Sesión", fontWeight = FontWeight.Bold, fontSize = 20.sp)`.
   - `Modals.kt:112-136`: Error container `Surface(shape = RoundedCornerShape(8.dp), color = MaterialTheme.colorScheme.errorContainer)` with icon and error text.
   - `Modals.kt:140-161`: Full width 48dp button `Button(..., shape = RoundedCornerShape(24.dp), colors = ButtonDefaults.buttonColors(containerColor = FoodJetPrimary, contentColor = Color.Black))`.
   - `Modals.kt:202-210`: Register modal avatar badge (`size(56.dp)`, `Icons.Default.PersonAdd`).

4. **CSS Design Tokens System (`frontend/styles.css`)**:
   - Tokens exist: `--color-primary` (#F4511E), `--color-primary-dark` (#D94310), `--color-primary-light` (#FCF0E4), `--color-surface` (#FFFFFF), `--color-background` (#F8F8F4), `--color-border` (#E6E4DC), `--color-text-primary` (#1C1C1C), `--color-text-secondary` (#6B6B66), `--color-text-accessible-orange` (#D03D0A), `--color-danger-container` (#F8D7DA), `--color-danger-text` (#721C24).
   - Radius tokens: `--radius-card` (20px), `--radius-input` (16px), `--radius-button` (14px), `--radius-cta` (18px), `--radius-full` (9999px).
   - Components available: `.foodjet-pill`, `.foodjet-btn-primary`, `.foodjet-btn-cta`, `.foodjet-input`, `.foodjet-input-group`.

---

## 2. Logic Chain
1. Based on Observation 1 and 2, all 16 DOM IDs (`#loginModal`, `#loginModalLabel`, `#loginForm`, `#loginEmail`, `#loginPassword`, `#registerModal`, `#registerModalLabel`, `#registerForm`, `#registerName`, `#registerEmail`, `#registerEmailError`, `#registerPhone`, `#registerPhoneAyuda`, `#registerPhoneError`, `#registerPassword`, `#loginBtn`) are actively queried by Vanilla JS and must remain unchanged in the DOM to avoid breaking login, registration, phone sanitization, and duplicate email error display.
2. Based on Observation 3, the Jetpack Compose prototype presents a cohesive, warm aesthetic characterized by 20dp card corners, a 56dp circular top badge with orange tint on a peach background, bold titles with helpful subtitles, outlined inputs with leading icons, and an inline error container.
3. Based on Observation 4, the existing design tokens in `frontend/styles.css` (`--color-primary`, `--color-primary-light`, `--radius-card`, `--radius-input`, `--color-border`, `--color-danger-container`) match the Jetpack Compose prototype tokens (`FoodJetPrimary`, `FoodJetPrimaryLight`, `RoundedCornerShape(20.dp)`, `errorContainer`).
4. Modern web accessibility and UX require password inputs to offer a toggle button (`.foodjet-password-toggle`) so users on touch and mobile devices can verify password entry.
5. In the Compose prototype (`Modals.kt:50-51`), test credentials (`cliente1@mail.com` / `Cliente123!`) are pre-populated. Providing role quick-fill pills (Estudiante, Cliente, Admin) in the login modal facilitates immediate testing of role-aware UI navigation without modifying backend authentication logic or schemas.
6. Therefore, the HTML structure in `frontend/index.html` and the CSS in `frontend/styles.css` can be upgraded to match the Compose reference while preserving 100% of the existing DOM IDs and JavaScript event contracts.

---

## 3. Caveats
- No changes to `backend/` or database schemas were analyzed, as backend modification is strictly out of scope.
- `miCuentaModal`, `qrModal`, `cardAuthModal`, and `reviewModal` were cataloged as peer modals under Milestone 4, but detailed exploration was scoped specifically to `loginModal` and `registerModal` per dispatch instructions.
- Backend registration strictly forces `rol: 'cliente'` in `backend/src/controllers/authController.js:43`; the quick-fill pills in login modal allow testing existing seeded accounts (`admin@foodjet.com`, `cliente1@mail.com`, `cliente2@mail.com`).

---

## 4. Conclusion
Feature 16 can be completely modernized to match the Jetpack Compose prototype by:
1. Retaining all 16 existing DOM IDs and event listeners without alteration.
2. Applying `.foodjet-modal .modal-content` with `--radius-card` (20px), `--color-surface`, `--color-border`, and `--shadow-lg`.
3. Adding the centered circular icon badge (`.foodjet-modal-avatar`) with `--color-primary-light` and `--color-primary-dark`.
4. Upgrading inputs to `.foodjet-input` with leading icons and adding accessible password visibility toggles (`.foodjet-password-toggle`).
5. Introducing an inline error banner (`#loginError` / `#registerError`) styled with `--color-danger-container` and `--color-danger-text` to replicate Compose's `errorContainer`.
6. Adding quick test account pills (`.foodjet-quick-login-btn`) for rapid role-aware verification.

---

## 5. Verification Method
1. **DOM ID Preservation Verification**:
   Inspect `frontend/index.html` and verify that all 16 IDs exist:
   ```bash
   grep -E "loginModal|loginModalLabel|loginForm|loginEmail|loginPassword|registerModal|registerModalLabel|registerForm|registerName|registerEmail|registerEmailError|registerPhone|registerPhoneAyuda|registerPhoneError|registerPassword|loginBtn" frontend/index.html
   ```
2. **Automated Test Suite**:
   Run the test commands to ensure zero regressions:
   ```bash
   npm run test:frontend
   npm test
   ```
   Confirm that `frontend/features/sesion.feature` (5 scenarios) and `frontend/features/validacion_telefono.feature` (5 scenarios) pass with 100% success.
3. **Manual / Browser Inspection**:
   - Open http://localhost:8081.
   - Click `#loginBtn` in header: `#loginModal` appears with 20px corners, top avatar badge, test credentials pills, and clean inputs.
   - Click the eye icon on password input: toggles between password dots and plain text.
   - Click "Regístrate aquí": smoothly transitions to `#registerModal` with phone validation and identical design system tokens.
