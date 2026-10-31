# Report: Feature 16 — Authentication & Registration Modals (#loginModal, #registerModal)

## Executive Summary
This report provides a comprehensive, read-only architectural and UI analysis of Feature 16 (Authentication & Registration Modals) for Milestone 4 of the FoodJet Web Frontend UI Modernization. It maps all preserved DOM contracts, analyzes the current Web implementation, inspects the Jetpack Compose reference prototype (`Modals.kt`), and delivers concrete HTML/CSS structural recommendations using the established CSS design tokens system (`frontend/styles.css`).

---

## 1. Inventory of Preserved DOM Contracts

Every DOM ID, name attribute, form submission event, and data contract in the authentication flow was traced across `frontend/index.html`, `frontend/styles.css`, `frontend/js/legacy.js`, `frontend/js/ui.js`, `frontend/js/app.js`, and Cucumber test suites (`frontend/features/`).

### 1.1 Complete DOM IDs Map

| DOM ID | Element Type | Role & Contract Function | Consumers / References |
|--------|--------------|--------------------------|------------------------|
| `loginBtn` | `<button>` | Main navbar button to trigger login modal | `index.html:90`, `legacy.js:73` (`addEventListener('click')`) |
| `loginModal` | `<div>` (modal) | Bootstrap modal container for login | `index.html:1032`, `legacy.js:74, 137, 187`, `ui.js:169, 530`, `app.js:197`, trigger target in `index.html:90, 1105` |
| `loginModalLabel` | `<h5>` | Accessible title for `loginModal` (`aria-labelledby`) | `index.html:1036` |
| `loginForm` | `<form>` | Login form intercepted via `preventDefault()` | `index.html:1043`, `legacy.js:79, 141` |
| `loginEmail` | `<input type="email">` | Email input field for login | `index.html:1046`, `legacy.js:116` |
| `loginPassword` | `<input type="password">` | Password input field for login | `index.html:1052`, `legacy.js:117` |
| `registerModal` | `<div>` (modal) | Bootstrap modal container for user registration | `index.html:1064`, `legacy.js:183`, trigger target in `index.html:1057` |
| `registerModalLabel` | `<h5>` | Accessible title for `registerModal` (`aria-labelledby`) | `index.html:1068` |
| `registerForm` | `<form>` | Registration form intercepted via `preventDefault()` | `index.html:1075`, `legacy.js:82, 84, 191` |
| `registerName` | `<input type="text">` | Full name input field | `index.html:1080`, `legacy.js:153` |
| `registerEmail` | `<input type="email">` | Registration email input field | `index.html:1084`, `legacy.js:154` |
| `registerEmailError` | `<div>` | Inline error displayed when email is duplicated (409) | `index.html:1085`, `legacy.js:193-195` (`style.display = 'block'`) |
| `registerPhone` | `<input type="tel">` | Phone input field (9 numeric digits, sanitized) | `index.html:1089`, `legacy.js:57, 155, 162` |
| `registerPhoneAyuda` | `<div>` | Help text for phone format (`aria-describedby`) | `index.html:1093` |
| `registerPhoneError` | `<div>` | Invalid feedback container for phone validation | `index.html:1094`, `legacy.js:64, 163` |
| `registerPassword` | `<input type="password">` | Password input field for registration (min 6 chars) | `index.html:1100`, `legacy.js:156` |

### 1.2 Connected Navigation & Session State DOM IDs
- `#loginNav`: Container in navbar holding `#loginBtn`; hidden when `currentUser !== null` (`legacy.js:230, 242`).
- `#userMenu`: Dropdown in navbar displaying logged-in user profile and actions (`legacy.js:229, 241`).
- `#userNameDropdown`: Span displaying user's name in navbar (`legacy.js:231, 238`).
- `#dashboardBtn`: Admin Operations button in dropdown; visible strictly when `user.rol === 'admin'` (`legacy.js:234, 244`).
- `#favoritesNav`: Favorites offcanvas trigger in navbar; visible when user is authenticated (`legacy.js:235, 254`).
- `#headerAddressBar`: Unauthenticated click directs to `#loginModal` (`ui.js:169`).
- `.favorite-toggle`: Unauthenticated click displays warning toast and opens `#loginModal` (`ui.js:530`).
- `#checkoutBtn`: Unauthenticated click in cart offcanvas hides cart and opens `#loginModal` (`app.js:197`).

---

## 2. Analysis of Jetpack Compose Reference Prototype

The reference prototype was inspected directly at:
`C:\Users\ORLANDO\Desktop\ciclo 9\frontend para actualizar foodjet para app moviles y adm de proyec de software\proyecto-app-movil-UPN-2026-2-main\app-movil\app\src\main\java\com\example\foodjeetapp\ui\screens\Modals.kt`

### 2.1 Visual Anatomy of `LoginDialog` (lines 40–171)
1. **Container**:
   - `Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface))`
   - Padding: 24dp internal padding (`Modifier.padding(24.dp)`).
   - Centered circular icon badge: `size(56.dp)`, `CircleShape`, background `FoodJetPrimary.copy(alpha = 0.2f)`, icon tint `FoodJetPrimaryDark` (#D94310), size 32dp (`Icons.Default.Person`).
2. **Typography**:
   - Title: `Text("Iniciar Sesión", fontWeight = FontWeight.Bold, fontSize = 20.sp)`
   - Subtitle: `Text("Ingresa a tu cuenta para pedir tus antojos", fontSize = 13.sp)`
3. **Form Fields**:
   - Outlined text fields with rounded corners (16dp), leading icon (`Icons.Default.Email`, `Icons.Default.Lock`), single line.
   - Pre-populated test credentials for rapid testing: `email = "cliente1@mail.com"`, `password = "Cliente123!"`.
4. **Inline Error State (`activeError`)**:
   - When an error occurs (local validation or server rejection):
     ```kotlin
     Surface(
         shape = RoundedCornerShape(8.dp),
         color = MaterialTheme.colorScheme.errorContainer, // Soft red/pink container
         modifier = Modifier.fillMaxWidth()
     ) {
         Row(modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
             Icon(Icons.Default.ErrorOutline, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(16.dp))
             Spacer(modifier = Modifier.width(8.dp))
             Text(text = activeError, color = MaterialTheme.colorScheme.onErrorContainer, fontSize = 12.sp)
         }
     }
     ```
5. **Primary Action**:
   - `Button(..., shape = RoundedCornerShape(24.dp), colors = ButtonDefaults.buttonColors(containerColor = FoodJetPrimary, contentColor = Color.Black))`
   - Height: 48dp, full width, disabled during loading or when form is invalid.
   - Spinner: `CircularProgressIndicator` (size 20dp, strokeWidth 2dp).
6. **Switch Flow**:
   - `TextButton` with `Text("¿No tienes cuenta? Regístrate aquí", fontSize = 13.sp)`.

### 2.2 Visual Anatomy of `RegisterDialog` (lines 173–304)
1. **Container & Badge**:
   - Card with 20dp radius, 24dp padding.
   - 56dp circular badge with `FoodJetPrimary.copy(alpha = 0.2f)` and `Icons.Default.PersonAdd`.
   - Title: `Text("Crear Cuenta", fontWeight = FontWeight.Bold, fontSize = 20.sp)`.
2. **Form Fields**:
   - Name: `OutlinedTextField` (`Icons.Default.Person`, min 3 chars).
   - Email: `OutlinedTextField` (`Icons.Default.Email`, contains `@` and `.`).
   - Phone: `OutlinedTextField` (`Icons.Default.Phone`, 9 digits numeric).
   - Password: `OutlinedTextField` (`Icons.Default.Lock`, min 6 chars, `PasswordVisualTransformation()`).
3. **Validation & Inline Errors**:
   - Individual field error borders (`isError = true`) when invalid.
   - Inline server error box (`Surface` with `errorContainer`).
4. **Primary Action**:
   - Full-width 48dp button with `FoodJetPrimary`, label "Registrarse".
5. **Switch Flow**:
   - `TextButton` with `Text("¿Ya tienes cuenta? Inicia sesión aquí", fontSize = 13.sp)`.

---

## 3. Comparison: Current Web Implementation vs. Compose Reference

| Feature | Current Web (`frontend/index.html`) | Compose Reference (`Modals.kt`) | Gap & Recommendation |
|---------|------------------------------------|---------------------------------|----------------------|
| **Modal Shape & Background** | Default Bootstrap modal dialog (`border-radius: 0.5rem`, harsh white box) | 20dp rounded corners (`RoundedCornerShape(20.dp)`), warm card elevation, subtle border | Apply `.foodjet-modal .modal-content` with `--radius-card` (20px), `--color-surface` (#FFF), `--color-border` (#E6E4DC), `--shadow-lg`. |
| **Header Badge** | Plain `<i class="bi bi-person-circle me-2"></i>` inside title | Centered 56px/64px circular badge with peach background (`--color-primary-light`) and orange icon | Add `.foodjet-modal-avatar` with 56px/64px circle, `--color-primary-light` (#FCF0E4), icon `--color-primary-dark` (#D94310). |
| **Typography** | Generic Bootstrap `<h5>` with black text | Hierarchy: Bold title (20px/22px, `--font-headline-medium`), subtitle (13px, `--color-text-secondary`) | Structure with `.foodjet-modal-title` and `.foodjet-modal-subtitle`. |
| **Inputs & Icons** | Basic `.form-control` (rectangular, gray border) | Outlined inputs (16px radius, height 48px, leading icons, warm focus ring) | Wrap with `.foodjet-input-group`, `.foodjet-input` (height 48px, `--radius-input` 16px, `--color-border`), leading icons. |
| **Password Visibility Toggle** | None (standard hidden `<input type="password">`) | Mobile has standard password masking | Implement accessible eye button (`.foodjet-password-toggle`) to toggle `type="password"` / `type="text"` with `bi-eye` / `bi-eye-slash`. |
| **Inline Error Feedback** | Login has NO inline error (only toast). Register only has `#registerEmailError` and `#registerPhoneError` | Inline alert surface with warning icon and red container (`errorContainer`) | Add `#loginError` and `#registerError` matching Compose's inline error banner (`.foodjet-inline-alert--danger`). |
| **Role Awareness & Quick Testing** | Manual typing of credentials required | Pre-fills test credentials (`cliente1@mail.com`) | Provide role quick-fill pills (Estudiante, Cliente, Admin) to instantly test role-aware navigation and student discounts. |
| **Submit Button** | Bootstrap `.btn-primary` (40px height, default radius) | High-emphasis 48dp rounded button (`RoundedCornerShape(24.dp)`), orange background, bold text | Style with `.foodjet-btn-cta` / `.foodjet-btn-primary` (48px height, `--radius-cta` 18px or `--radius-full`, bold text). |
| **Switch Links** | Simple text link with standard blue `text-primary` | Centered text button with high-contrast accessible typography | Use `.foodjet-modal-footer-link` with `--color-text-accessible-orange` (#D03D0A, WCAG AA 4.85:1). |

---

## 4. Proposed HTML Structure

### 4.1 Login Modal (`#loginModal`)
```html
    <!-- Login Modal -->
    <div class="modal fade foodjet-modal" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0">
                <div class="modal-header border-0 pb-0">
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    <div class="foodjet-modal-avatar" aria-hidden="true">
                        <i class="bi bi-person-fill"></i>
                    </div>
                    <h2 class="modal-title foodjet-modal-title" id="loginModalLabel">Iniciar Sesión</h2>
                    <p class="foodjet-modal-subtitle">Ingresa a tu cuenta para pedir tus antojos sin escalas.</p>
                </div>
                <div class="modal-body pt-2">
                    <!-- Quick Test Credentials Helper (Role-Aware Testing) -->
                    <div class="foodjet-auth-quick-fill mb-3 text-center" aria-label="Cuentas de prueba">
                        <span class="foodjet-auth-quick-label">Acceso rápido de prueba:</span>
                        <div class="d-flex justify-content-center gap-2 mt-1 flex-wrap">
                            <button type="button" class="foodjet-pill foodjet-pill--sm foodjet-quick-login-btn"
                                    data-email="cliente1@mail.com" data-pass="Cliente123!" data-role="Estudiante"
                                    title="Cliente con descuento de estudiante">
                                <i class="bi bi-mortarboard-fill text-warning me-1" aria-hidden="true"></i>Estudiante
                            </button>
                            <button type="button" class="foodjet-pill foodjet-pill--sm foodjet-quick-login-btn"
                                    data-email="cliente2@mail.com" data-pass="Cliente123!" data-role="Cliente"
                                    title="Cliente regular">
                                <i class="bi bi-person-fill text-primary me-1" aria-hidden="true"></i>Cliente
                            </button>
                            <button type="button" class="foodjet-pill foodjet-pill--sm foodjet-quick-login-btn"
                                    data-email="admin@foodjet.com" data-pass="Admin123!" data-role="Admin"
                                    title="Administrador de operaciones">
                                <i class="bi bi-shield-lock-fill text-danger me-1" aria-hidden="true"></i>Admin
                            </button>
                        </div>
                    </div>

                    <!-- Inline Error Banner (Matches Compose errorContainer) -->
                    <div id="loginError" class="foodjet-inline-alert foodjet-inline-alert--danger mb-3" role="alert" style="display: none;">
                        <i class="bi bi-exclamation-circle-fill me-2" aria-hidden="true"></i>
                        <span id="loginErrorText">Credenciales inválidas.</span>
                    </div>

                    <form id="loginForm" novalidate>
                        <!-- Email Input -->
                        <div class="foodjet-input-group mb-3">
                            <label for="loginEmail" class="foodjet-input-group__label">
                                <i class="bi bi-envelope me-1" aria-hidden="true"></i>Email
                            </label>
                            <div class="foodjet-input-wrapper position-relative">
                                <input type="email" class="form-control foodjet-input" id="loginEmail"
                                       placeholder="tu@email.com" required autocomplete="email">
                            </div>
                        </div>

                        <!-- Password Input with Visibility Toggle -->
                        <div class="foodjet-input-group mb-4">
                            <label for="loginPassword" class="foodjet-input-group__label">
                                <i class="bi bi-lock me-1" aria-hidden="true"></i>Contraseña
                            </label>
                            <div class="foodjet-input-wrapper position-relative">
                                <input type="password" class="form-control foodjet-input pe-5" id="loginPassword"
                                       placeholder="••••••••" required autocomplete="current-password">
                                <button type="button" class="foodjet-password-toggle position-absolute top-50 end-0 translate-middle-y me-2"
                                        aria-label="Mostrar contraseña" data-target="loginPassword">
                                    <i class="bi bi-eye" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>

                        <button type="submit" class="btn foodjet-btn-cta w-100" id="loginSubmitBtn">
                            <span class="foodjet-btn-cta__text">Ingresar</span>
                        </button>
                    </form>

                    <div class="foodjet-modal-footer-link">
                        ¿No tienes cuenta?
                        <a href="#" class="text-primary fw-semibold" data-bs-toggle="modal" data-bs-target="#registerModal">Regístrate aquí</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
```

### 4.2 Register Modal (`#registerModal`)
```html
    <!-- Register Modal -->
    <div class="modal fade foodjet-modal" id="registerModal" tabindex="-1" aria-labelledby="registerModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0">
                <div class="modal-header border-0 pb-0">
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    <div class="foodjet-modal-avatar" aria-hidden="true">
                        <i class="bi bi-person-plus-fill"></i>
                    </div>
                    <h2 class="modal-title foodjet-modal-title" id="registerModalLabel">Crear Cuenta</h2>
                    <p class="foodjet-modal-subtitle">Únete a FoodJet y disfruta de delivery rápido y promociones.</p>
                </div>
                <div class="modal-body pt-2">
                    <!-- Inline General Error Banner -->
                    <div id="registerError" class="foodjet-inline-alert foodjet-inline-alert--danger mb-3" role="alert" style="display: none;">
                        <i class="bi bi-exclamation-circle-fill me-2" aria-hidden="true"></i>
                        <span id="registerErrorText">Error al registrar el usuario.</span>
                    </div>

                    <form id="registerForm" novalidate>
                        <!-- Name Input -->
                        <div class="foodjet-input-group mb-3">
                            <label for="registerName" class="foodjet-input-group__label">
                                <i class="bi bi-person me-1" aria-hidden="true"></i>Nombre completo
                            </label>
                            <input type="text" class="form-control foodjet-input" id="registerName"
                                   placeholder="Juan Pérez" required autocomplete="name">
                        </div>

                        <!-- Email Input with Duplicate Feedback -->
                        <div class="foodjet-input-group mb-3">
                            <label for="registerEmail" class="foodjet-input-group__label">
                                <i class="bi bi-envelope me-1" aria-hidden="true"></i>Email
                            </label>
                            <input type="email" class="form-control foodjet-input" id="registerEmail"
                                   placeholder="tu@email.com" required autocomplete="email">
                            <div id="registerEmailError" class="foodjet-input-group__error mt-1" style="display: none;">
                                <i class="bi bi-exclamation-circle me-1" aria-hidden="true"></i>Una cuenta con este correo ya existe
                            </div>
                        </div>

                        <!-- Phone Input with Sanitize & Length Validation -->
                        <div class="foodjet-input-group mb-3">
                            <label for="registerPhone" class="foodjet-input-group__label">
                                <i class="bi bi-telephone me-1" aria-hidden="true"></i>Teléfono
                            </label>
                            <input type="tel" class="form-control foodjet-input" id="registerPhone" placeholder="987654321"
                                   inputmode="numeric" autocomplete="tel" maxlength="9" pattern="\d{9}"
                                   title="Debe contener exactamente 9 dígitos numéricos"
                                   aria-describedby="registerPhoneAyuda registerPhoneError" required>
                            <div id="registerPhoneAyuda" class="foodjet-input-group__hint">9 dígitos, solo números.</div>
                            <div id="registerPhoneError" class="invalid-feedback foodjet-input-group__error"></div>
                        </div>

                        <!-- Password Input with Visibility Toggle -->
                        <div class="foodjet-input-group mb-4">
                            <label for="registerPassword" class="foodjet-input-group__label">
                                <i class="bi bi-lock me-1" aria-hidden="true"></i>Contraseña (mínimo 6 caracteres)
                            </label>
                            <div class="foodjet-input-wrapper position-relative">
                                <input type="password" class="form-control foodjet-input pe-5" id="registerPassword"
                                       placeholder="••••••••" minlength="6" required autocomplete="new-password">
                                <button type="button" class="foodjet-password-toggle position-absolute top-50 end-0 translate-middle-y me-2"
                                        aria-label="Mostrar contraseña" data-target="registerPassword">
                                    <i class="bi bi-eye" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>

                        <button type="submit" class="btn foodjet-btn-cta w-100" id="registerSubmitBtn">
                            <span class="foodjet-btn-cta__text">Registrarse</span>
                        </button>
                    </form>

                    <div class="foodjet-modal-footer-link">
                        ¿Ya tienes cuenta?
                        <a href="#" class="text-primary fw-semibold" data-bs-toggle="modal" data-bs-target="#loginModal">Inicia sesión aquí</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
```

---

## 5. Proposed CSS Classes & Token Integration

The following CSS rules should be added to `frontend/styles.css` under the Milestone 4 Modals section:

```css
/* ==========================================================================
   Milestone 4: Modals & Authentication Components (#loginModal, #registerModal)
   ========================================================================== */

/* 1. Modal Surface & Card Container */
.foodjet-modal .modal-content {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card); /* 20px */
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    padding: var(--space-2) var(--space-4) var(--space-4);
}

@media (min-width: 576px) {
    .foodjet-modal .modal-content {
        padding: var(--space-4) var(--space-6) var(--space-6);
    }
}

.foodjet-modal .modal-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    padding: var(--space-4) var(--space-2) var(--space-2);
}

.foodjet-modal .modal-header .btn-close {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    background-color: var(--color-background);
    opacity: 0.65;
    padding: 8px;
    transition: opacity var(--transition-fast), transform var(--transition-fast), background-color var(--transition-fast);
}

.foodjet-modal .modal-header .btn-close:hover {
    opacity: 1;
    transform: scale(1.06);
    background-color: var(--color-border);
}

.foodjet-modal .modal-header .btn-close:focus-visible {
    box-shadow: var(--shadow-focus);
    outline: none;
}

/* 2. Modal Centered Avatar Badge (Matches Compose Icon Badge) */
.foodjet-modal-avatar {
    width: 60px;
    height: 60px;
    border-radius: var(--radius-full);
    background-color: var(--color-primary-light);
    color: var(--color-primary-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    margin-bottom: var(--space-3);
    box-shadow: 0 4px 14px rgba(244, 81, 30, 0.15);
}

.foodjet-modal-title {
    font-size: var(--font-size-headline-medium); /* 22px / 1.375rem */
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
    text-align: center;
    line-height: 1.25;
}

.foodjet-modal-subtitle {
    font-size: var(--font-size-body-medium); /* 13px */
    color: var(--color-text-secondary);
    margin: 6px 0 0 0;
    text-align: center;
    line-height: 1.4;
}

/* 3. Quick Test Credentials Helper */
.foodjet-auth-quick-fill {
    background-color: var(--color-background);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-input);
    padding: 10px 12px;
}

.foodjet-auth-quick-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text-secondary);
}

.foodjet-quick-login-btn {
    border-color: var(--color-border);
    background-color: var(--color-surface);
    transition: all var(--transition-fast);
}

.foodjet-quick-login-btn:hover {
    background-color: var(--color-primary-light);
    border-color: var(--color-primary);
    color: var(--color-primary-dark);
}

.foodjet-quick-login-btn.is-active {
    background-color: var(--color-primary) !important;
    border-color: var(--color-primary) !important;
    color: #ffffff !important;
}

/* 4. Password Visibility Toggle Button */
.foodjet-password-toggle {
    background: transparent;
    border: none;
    padding: 8px 12px;
    color: var(--color-text-secondary);
    font-size: 18px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    line-height: 1;
    z-index: 5;
    transition: color var(--transition-fast), transform var(--transition-fast);
}

.foodjet-password-toggle:hover {
    color: var(--color-text-primary);
    transform: translateY(-50%) scale(1.08);
}

.foodjet-password-toggle:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
}

/* 5. Inline Error Alerts (Matches Compose Surface errorContainer) */
.foodjet-inline-alert {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    border-radius: var(--radius-badge);
    font-size: var(--font-body-small);
    line-height: 1.35;
}

.foodjet-inline-alert--danger {
    background-color: var(--color-danger-container);
    color: var(--color-danger-text);
    border: 1px solid rgba(220, 53, 69, 0.25);
}

.foodjet-inline-alert--danger i {
    color: var(--color-danger);
    font-size: 16px;
    flex-shrink: 0;
}

/* 6. Switch to Login / Register Link */
.foodjet-modal-footer-link {
    font-size: var(--font-body-medium);
    color: var(--color-text-secondary);
    text-align: center;
    margin-top: var(--space-4);
}

.foodjet-modal-footer-link a {
    color: var(--color-text-accessible-orange) !important;
    text-decoration: none;
    transition: text-decoration var(--transition-fast);
}

.foodjet-modal-footer-link a:hover,
.foodjet-modal-footer-link a:focus {
    text-decoration: underline;
}
```

---

## 6. JavaScript Integration Recommendations (Non-Destructive)

The implementer can wire the visual enhancements in `frontend/js/legacy.js` or `frontend/js/ui.js` with simple, non-destructive handlers:

1. **Password Toggle Handler**:
   ```javascript
   document.querySelectorAll('.foodjet-password-toggle').forEach(btn => {
       btn.addEventListener('click', () => {
           const targetId = btn.dataset.target;
           const input = document.getElementById(targetId);
           if (!input) return;
           const isPassword = input.type === 'password';
           input.type = isPassword ? 'text' : 'password';
           const icon = btn.querySelector('i');
           if (icon) {
               icon.classList.toggle('bi-eye', !isPassword);
               icon.classList.toggle('bi-eye-slash', isPassword);
           }
           btn.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
       });
   });
   ```

2. **Quick Login Credentials Helper**:
   ```javascript
   document.querySelectorAll('.foodjet-quick-login-btn').forEach(btn => {
       btn.addEventListener('click', () => {
           const emailInput = document.getElementById('loginEmail');
           const passwordInput = document.getElementById('loginPassword');
           if (emailInput) emailInput.value = btn.dataset.email;
           if (passwordInput) passwordInput.value = btn.dataset.pass;
           document.querySelectorAll('.foodjet-quick-login-btn').forEach(b => b.classList.remove('is-active'));
           btn.classList.add('is-active');
           const loginError = document.getElementById('loginError');
           if (loginError) loginError.style.display = 'none';
       });
   });
   ```

3. **Inline Error Display in `handleLogin`**:
   In `legacy.js:143`, when login fails:
   ```javascript
   const loginError = document.getElementById('loginError');
   const loginErrorText = document.getElementById('loginErrorText');
   if (loginError && loginErrorText) {
       loginErrorText.textContent = data.error || 'Credenciales inválidas.';
       loginError.style.display = 'flex';
   }
   ```
   And clear the error upon typing:
   ```javascript
   ['loginEmail', 'loginPassword'].forEach(id => {
       document.getElementById(id)?.addEventListener('input', () => {
           const loginError = document.getElementById('loginError');
           if (loginError) loginError.style.display = 'none';
       });
   });
   ```

4. **Preservation of Existing Contracts**:
   - `window.handleLogin`, `window.handleRegister`, `window.handleLogout` signatures remain 100% intact.
   - All 16 mapped DOM IDs remain unchanged in position and identifier.
   - All tests in `frontend/features/sesion.feature` and `frontend/features/validacion_telefono.feature` remain fully valid and regression-free.
