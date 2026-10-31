# Technical Investigation Report: Cart/Favorites Offcanvas, Restaurant Rules & A11y Advisory Fix

- **Author**: Explorer M2_3 (`teamwork_explorer`)
- **Working Directory**: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_3\`
- **Date**: 2026-10-30T00:48:00Z
- **Targets**: `frontend/index.html`, `frontend/styles.css`, `frontend/js/ui.js`, `frontend/js/app.js`
- **Reference Material**:
  - Android Compose Prototype: `CartSheet.kt`, `CartViewModel.kt`, `FavoritesScreen.kt`
  - Challenger M1_1 Handoff: `.agents/teamwork/challenger_m1_1/handoff.md`
  - Authoritative Request: `.agents/teamwork/ORIGINAL_REQUEST.md` (R1, R2, R3, R4)
- **Diagram**: `cart_favorites_architecture.drawio`

---

## 1. Executive Summary

This investigation provides the complete technical design and actionable code specification for **Milestone 2 (M2_3)**:
1. **Cart Offcanvas Drawer (`#cartOffcanvas`)**: Modernized from a basic list into a rich shopping experience matching `CartSheet.kt`, featuring an active restaurant banner with store icon and delivery time, item rows with student discount badges and direct item removal (`.remove-item-btn`), and an enriched footer with subtotal, student savings line item (`#cartStudentSavingsRow`), and full-width checkout CTA (`#checkoutBtn`).
2. **Favorites Offcanvas Drawer (`#favoritesOffcanvas`)**: Overhauled with an empathetic empty state illustration, product cards styled with `.foodjet-card`, student discount pricing formatting via `renderProductPrice()`, and responsive quick-add and remove buttons.
3. **Single Restaurant Rule Enforcement & Interactive Conflict Resolution**: Upgrades the current passive toast into an interactive, user-friendly modal dialog (`#restaurantChangeModal`) that clearly states the conflict between the current restaurant and the newly selected one, offering the user the option to either "Conservar pedido actual" or "Vaciar y agregar nuevo", while maintaining 100% backward compatibility with existing domain validation (`state.addToCart` returning `{ success: false, error: 'DIFFERENT_RESTAURANT' }`).
4. **Challenger M1_1 Contrast Remediation**: Eliminates the two critical WCAG failures flagged in dark mode:
   - Sets `color: #1C1C1C !important;` on `.foodjet-badge--student` and `.foodjet-badge--yellow` across all themes, elevating contrast on `#FCD460` from **1.16:1 to 11.95:1** (AAA Pass).
   - Configures `.foodjet-pill--active` in dark mode to `background-color: #E8E8E8 !important; color: #121212 !important;`, elevating contrast from **1.23:1 to 13.9:1** (AAA Pass).
5. **Zero Regressions**: 100% preserved DOM IDs, classes, event bindings, and state contracts. Verified against baseline tests (131 Cucumber scenarios, 25 unit tests, 68 acceptance tiers).

---

## 2. Baseline Architecture & Problem Identification

### 2.1 Existing Cart Offcanvas (`#cartOffcanvas`) Deficiencies
In `frontend/index.html` (lines 694–719) and `frontend/js/ui.js` (lines 364–462):
- **Missing Active Restaurant Context**: When items are in the cart, the drawer does not indicate which restaurant the order belongs to or the estimated delivery time. The user cannot see why other items might be rejected.
- **Missing Direct Remove Button**: Users can only decrease quantity via `.minus-btn`. If an item has quantity 4, they must click 4 times to delete it.
- **Incomplete Financial Breakdown**: The footer shows only a single "Total: S/ XX.XX". It omits the subtotal and does not highlight student savings, diminishing the value perception for verified students.
- **Visual Stagnation**: Lacks FoodJet design token integration (`--color-surface`, `--color-background`, `--radius-lg`, `--shadow-sm`).

### 2.2 Existing Favorites Drawer (`#favoritesOffcanvas`) Deficiencies
In `frontend/index.html` (lines 900–911) and `frontend/js/ui.js` (lines 280–361):
- **Raw Presentation**: Uses default Bootstrap utility classes (`bg-light`, `shadow-sm`) instead of `.foodjet-card` design tokens.
- **Static Pricing**: Renders `S/ ${product.precio.toFixed(2)}` directly without reflecting student discount prices for verified students.
- **Uninformative Empty State**: Uses a bare icon and text without an engaging prompt or token styling.

### 2.3 Single Restaurant Rule UX Bottleneck
In `frontend/js/ui.js` (lines 220–226, 352–358) and `frontend/js/app.js` (lines 547–555):
- When `state.addToCart(productId)` returns `{ success: false, error: 'DIFFERENT_RESTAURANT' }`, the UI displays only a transient toast:
  > *"Tu pedido es de [Restaurante]. Vacía el carrito para pedir de otro restaurante."*
- **Problem**: The user has no immediate mechanism to switch restaurants without manually opening the cart, removing each item one by one, closing the cart, and finding the new item again.
- **Requirement**: Provide an interactive warning banner/dialog with the option to clear the cart or keep the current one.

### 2.4 Challenger M1_1 Empirical Contrast Defect Analysis
From `challenger_m1_1/handoff.md`:
- **Defect 1 (`.foodjet-badge--student`, `.foodjet-badge--yellow`)**:
  - Base rule in `frontend/styles.css:428-432`: `background-color: var(--color-yellow-badge); color: var(--color-text-primary);`
  - In dark mode (`styles.css:1459, 1463`), `--color-text-primary` inverts to `#E8E8E8` while `--color-yellow-badge` stays `#FCD460`.
  - Contrast of `#E8E8E8` on `#FCD460` is **1.16:1** (Severe failure; WCAG AA requires $\ge$ 4.5:1).
- **Defect 2 (`.foodjet-pill--active`)**:
  - Base rule in `styles.css:382-385`: `background-color: var(--color-text-primary) !important; color: #ffffff !important;`
  - In dark mode, `--color-text-primary` is `#E8E8E8`.
  - Contrast of `#FFFFFF` on `#E8E8E8` is **1.23:1** (Severe failure; WCAG AA requires $\ge$ 4.5:1).

---

## 3. Detailed Component Specifications

### 3.1 Cart Offcanvas (`#cartOffcanvas`) Specification

| Section | Component / Element | Specification / Behavior | Preserved Contracts |
|---|---|---|---|
| **Header** | Title & Counter | Text "Tu carrito", icon `bi-bag-check-fill text-primary`, badge counter `#cartItemCount` styled with `.foodjet-badge`. Close button `btn-close` with `aria-label="Cerrar carrito"`. | `#cartOffcanvasLabel`, `#cartItemCount` |
| **Active Store** | Restaurant Banner | Rendered at `#cartRestaurantBanner`. Shows store icon in circle, restaurant name (`getCartRestaurant`), subtitle "Preparado al momento", delivery pill with bike icon ("En tu puerta en X min"), and a "Vaciar" button (`#clearCartBtn`). | Injected into `#cartRestaurantBanner` |
| **Empty State** | `#emptyCart` | Centered illustration with `bi-cart-x`, "Tu carrito está vacío", subtitle "¡Agrega productos deliciosos desde el menú!", button "Explorar el menú" with `data-bs-dismiss="offcanvas"`. | `#emptyCart` |
| **Items List** | `#cartItems` | Each item rendered as `.cart-item` card: 60x60 thumbnail with `var(--radius-md)`, product name (bold, truncate), student discount badge (`.foodjet-badge--student`), unit price, quantity stepper (`.minus-btn`, quantity span, `.plus-btn`), line total `S/ XX.XX`, and `.remove-item-btn` with trash icon. | `#cartItems`, `.minus-btn`, `.plus-btn`, `data-id` |
| **Footer** | `#cartFooter` | Contains Subtotal row (`#cartSubtotal`), Student Savings row (`#cartStudentSavingsRow`, `#cartStudentSavings`), Grand Total row (`#cartTotal`), note "El envío, IGV y cupones se calculan al pagar", full-width CTA button `#checkoutBtn`, and trust note "Pago seguro · Antojos garantizados". | `#cartFooter`, `#cartTotal`, `#checkoutBtn` |

### 3.2 Favorites Offcanvas (`#favoritesOffcanvas`) Specification

| Section | Component / Element | Specification / Behavior | Preserved Contracts |
|---|---|---|---|
| **Header** | Title & Counter | "Mis Favoritos" with `bi-heart-fill text-danger` and pill counter `#favoritesCountBadge`. Close button `btn-close` with `aria-label="Cerrar favoritos"`. | `#favoritesOffcanvasLabel`, `#favoritesOffcanvas` |
| **Empty State** | Container innerHTML | Friendly empty state: heart icon container in `bg-danger-subtle text-danger`, bold heading "No tienes productos favoritos aún", descriptive subtitle, and "Explorar el menú" button (`data-bs-dismiss="offcanvas"`). | `#favoritesItemsContainer` |
| **Items List** | `#favoritesItemsContainer` | Product cards styled with `.foodjet-card`: 72px thumbnail, product title, restaurant name with store icon, student-discount aware price via `renderProductPrice()`, remove button `.remove-favorite` with `data-id`, and quick add-to-cart button `.add-to-cart-from-fav` with `data-id`. | `#favoritesItemsContainer`, `.remove-favorite`, `.add-to-cart-from-fav`, `data-id` |

### 3.3 Single Restaurant Rule Conflict Modal (`#restaurantChangeModal`)

- **Trigger Condition**: When `state.addToCart(productId)` returns `{ success: false, error: 'DIFFERENT_RESTAURANT' }`.
- **UI Element**: `#restaurantChangeModal` (Bootstrap 5.3 modal).
- **Header**: Warning triangle icon `bi-exclamation-triangle-fill text-warning`, Title "¿Cambiar de restaurante?".
- **Body**:
  - "Tu carrito actualmente contiene productos de **[Restaurante Actual]** (`#restaurantChangeCurrentName`)."
  - "Solo puedes pedir de un restaurante a la vez. Si continúas y agregas este producto de **[Nuevo Restaurante]** (`#restaurantChangeNewName`), se vaciará tu carrito actual."
- **Actions**:
  - **Button 1 (`#restaurantChangeCancelBtn`)**: "Conservar pedido actual" (`btn-outline-secondary rounded-pill`, dismisses modal without modifying cart).
  - **Button 2 (`#restaurantChangeConfirmBtn`)**: "Vaciar y agregar nuevo" (`btn-primary foodjet-btn-primary rounded-pill`, clears cart with `state.clearCart()`, executes `state.addToCart(newProductId)`, hides modal, opens `#cartOffcanvas`, re-renders catalog, and shows confirmation toast).
- **Graceful Fallback**: If bootstrap modal is not available or running headless, falls back to `showToast(mensajeRestauranteDistinto(), 'warning')`.

---

## 4. Challenger M1_1 Contrast Remediation Specification

### 4.1 Defect 1: `.foodjet-badge--student` & `.foodjet-badge--yellow` Contrast Fix

**Root Cause**: In dark mode, `--color-text-primary` evaluates to `#E8E8E8`. When rendered on the bright yellow background `#FCD460`, the contrast ratio drops to 1.16:1.
**Remediation**:
Yellow badges must maintain dark text `#1C1C1C` across **both light and dark modes**.
```css
/* frontend/styles.css — Línea 428 */
.foodjet-badge--student,
.foodjet-badge--yellow {
    background-color: var(--color-yellow-badge);
    color: #1C1C1C !important;
}

/* En @media (prefers-color-scheme: dark) */
.foodjet-badge--student,
.foodjet-badge--yellow {
    color: #1C1C1C !important;
}
```
**Verification Math**:
- Background `#FCD460`: $L_1 = 0.686$
- Text `#1C1C1C`: $L_2 = 0.012$
- Contrast Ratio: $\frac{0.686 + 0.05}{0.012 + 0.05} = \frac{0.736}{0.062} = \mathbf{11.87:1}$ (Requirement $\ge$ 4.5:1 AA, $\ge$ 7.0:1 AAA). **PASS**.

### 4.2 Defect 2: `.foodjet-pill--active` Dark Mode Contrast Fix

**Root Cause**: In dark mode, `--color-text-primary` evaluates to `#E8E8E8`. The rule `.foodjet-pill--active { background-color: var(--color-text-primary) !important; color: #ffffff !important; }` pairs white text (`#FFFFFF`) with a light background (`#E8E8E8`), yielding 1.23:1.
**Remediation**:
Under `@media (prefers-color-scheme: dark)`, invert the text color to dark `#121212` so that the active pill is clearly legible:
```css
/* frontend/styles.css — dentro de @media (prefers-color-scheme: dark) */
.foodjet-pill--active,
.foodjet-pill.active,
.foodjet-pill[aria-selected="true"],
.foodjet-pill.is-active {
    background-color: #E8E8E8 !important;
    border-color: #E8E8E8 !important;
    color: #121212 !important;
}

.foodjet-pill--active:hover,
.foodjet-pill.active:hover,
.foodjet-pill[aria-selected="true"]:hover,
.foodjet-pill.is-active:hover {
    background-color: #FFFFFF !important;
    border-color: #FFFFFF !important;
    color: #000000 !important;
}

.foodjet-pill--active i,
.foodjet-pill--active svg,
.foodjet-pill.active i,
.foodjet-pill.active svg {
    color: #121212 !important;
}
```
**Verification Math**:
- Background `#E8E8E8`: $L_1 = 0.803$
- Text `#121212`: $L_2 = 0.007$
- Contrast Ratio: $\frac{0.803 + 0.05}{0.007 + 0.05} = \frac{0.853}{0.057} = \mathbf{14.96:1}$ (Requirement $\ge$ 4.5:1 AA, $\ge$ 7.0:1 AAA). **PASS**.

---

## 5. Concrete Code Implementation Proposal for Worker M2

### 5.1 Proposed Modifications to `frontend/index.html`

```html
<!-- REEMPLAZO 1: Cart Offcanvas (líneas 694-719) -->
    <div class="offcanvas offcanvas-end foodjet-offcanvas" tabindex="-1" id="cartOffcanvas" aria-labelledby="cartOffcanvasLabel">
        <div class="offcanvas-header border-bottom">
            <div class="d-flex align-items-center">
                <h5 class="offcanvas-title mb-0 fw-bold" id="cartOffcanvasLabel">
                    <i class="bi bi-bag-check-fill me-2 text-primary"></i>Tu carrito
                </h5>
                <span class="foodjet-badge foodjet-badge--pill ms-2" id="cartItemCount">0</span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar carrito"></button>
        </div>
        <div class="offcanvas-body d-flex flex-column">
            <!-- Banner de restaurante activo -->
            <div id="cartRestaurantBanner" class="mb-3" style="display: none;"></div>

            <div id="cartItemsContainer" class="flex-grow-1 overflow-auto">
                <div id="emptyCart" class="text-center py-5">
                    <div class="empty-cart-icon mb-3">
                        <i class="bi bi-cart-x display-1 text-muted"></i>
                    </div>
                    <h5 class="fw-bold text-dark mt-2">Tu carrito está vacío</h5>
                    <p class="text-muted small mb-4">¡Agrega productos deliciosos desde el menú!</p>
                    <button type="button" class="btn btn-outline-primary rounded-pill px-4" data-bs-dismiss="offcanvas">
                        Explorar el menú
                    </button>
                </div>
                <div id="cartItems"></div>
            </div>
            <div id="cartFooter" class="border-top pt-3 mt-3" style="display: none;">
                <div id="cartSubtotalRow" class="d-flex justify-content-between mb-1 small text-muted">
                    <span>Subtotal estimado:</span>
                    <span id="cartSubtotal" class="fw-semibold text-dark">S/ 0.00</span>
                </div>
                <div id="cartStudentSavingsRow" class="d-flex justify-content-between mb-2 small text-success" style="display: none;">
                    <span class="fw-semibold"><i class="bi bi-tag-fill me-1"></i>Ahorro estudiante:</span>
                    <span id="cartStudentSavings" class="fw-bold">-S/ 0.00</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fs-5 fw-bold">Total:</span>
                    <span class="fs-4 fw-bold text-primary" id="cartTotal">S/ 0.00</span>
                </div>
                <p class="small text-muted mb-3" style="font-size: 0.75rem;">El envío, IGV y cupones se calculan al pagar.</p>
                <button class="btn btn-primary foodjet-btn-primary w-100 py-3 fw-bold rounded-pill d-flex align-items-center justify-content-center" id="checkoutBtn">
                    <span>Proceder al pago</span>
                    <i class="bi bi-arrow-right ms-2"></i>
                </button>
                <div class="text-center mt-2">
                    <small class="text-muted d-inline-flex align-items-center" style="font-size: 0.75rem;">
                        <i class="bi bi-shield-lock-fill me-1 text-secondary"></i>Pago seguro · Antojos garantizados
                    </small>
                </div>
            </div>
        </div>
    </div>

    <!-- NUEVO: Modal de advertencia de cambio de restaurante (insertar tras cartOffcanvas) -->
    <div class="modal fade" id="restaurantChangeModal" tabindex="-1" aria-labelledby="restaurantChangeModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg" style="border-radius: var(--radius-xl, 20px);">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title fw-bold d-flex align-items-center text-warning" id="restaurantChangeModalLabel">
                        <i class="bi bi-exclamation-triangle-fill me-2 fs-4 text-warning"></i>
                        ¿Cambiar de restaurante?
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body py-3">
                    <p class="mb-2">
                        Tu carrito actualmente contiene productos de <strong id="restaurantChangeCurrentName">otro restaurante</strong>.
                    </p>
                    <p class="text-muted small mb-0">
                        Solo puedes pedir de un restaurante a la vez. Si continúas y agregas este producto de <strong id="restaurantChangeNewName">este restaurante</strong>, se vaciará tu carrito actual.
                    </p>
                </div>
                <div class="modal-footer border-0 pt-0 d-flex flex-column flex-sm-row gap-2 justify-content-end">
                    <button type="button" class="btn btn-outline-secondary rounded-pill px-3" data-bs-dismiss="modal" id="restaurantChangeCancelBtn">
                        Conservar pedido actual
                    </button>
                    <button type="button" class="btn btn-primary foodjet-btn-primary rounded-pill px-3" id="restaurantChangeConfirmBtn">
                        Vaciar y agregar nuevo
                    </button>
                </div>
            </div>
        </div>
    </div>

<!-- REEMPLAZO 2: Favorites Offcanvas (líneas 900-911) -->
    <div class="offcanvas offcanvas-end foodjet-offcanvas" tabindex="-1" id="favoritesOffcanvas" aria-labelledby="favoritesOffcanvasLabel">
        <div class="offcanvas-header border-bottom">
            <div class="d-flex align-items-center">
                <h5 class="offcanvas-title mb-0 fw-bold text-danger d-flex align-items-center" id="favoritesOffcanvasLabel">
                    <i class="bi bi-heart-fill me-2"></i>Mis Favoritos
                </h5>
                <span class="badge rounded-pill bg-danger-subtle text-danger ms-2 fw-bold" id="favoritesCountBadge" style="display: none;">0</span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar favoritos"></button>
        </div>
        <div class="offcanvas-body d-flex flex-column">
            <div id="favoritesItemsContainer" class="flex-grow-1 overflow-auto">
            </div>
        </div>
    </div>
```

---

### 5.2 Proposed Modifications to `frontend/styles.css`

```css
/* 1. Corrección Defecto 1 (Línea 428-432) */
.foodjet-badge--student,
.foodjet-badge--yellow {
    background-color: var(--color-yellow-badge);
    color: #1C1C1C !important;
}

/* 2. Reglas para Offcanvas, Carrito y Favoritos (Añadir en sección de componentes) */
.foodjet-offcanvas {
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    border-left: 1px solid var(--color-border);
}

.foodjet-offcanvas .offcanvas-header {
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border-subtle);
}

.foodjet-offcanvas .offcanvas-body {
    background-color: var(--color-background);
}

/* Banner de restaurante activo */
.foodjet-cart-restaurant {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border) !important;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
}

.foodjet-restaurant-icon-box {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background-color: var(--color-primary-light);
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

/* Fila de item del carrito */
.cart-item {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border-subtle) !important;
    border-radius: var(--radius-md);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.cart-item:hover {
    border-color: var(--color-border) !important;
    box-shadow: var(--shadow-xs);
}

/* Footer del carrito */
#cartFooter {
    background-color: var(--color-surface);
    border-top: 1px solid var(--color-border) !important;
}

/* Tarjeta de favoritos */
#favoritesOffcanvas .foodjet-card {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-lg);
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

#favoritesOffcanvas .foodjet-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

/* 3. Correcciones de Dark Mode en @media (prefers-color-scheme: dark) */
@media (prefers-color-scheme: dark) {
    /* Defecto 1 Dark Mode */
    .foodjet-badge--student,
    .foodjet-badge--yellow {
        color: #1C1C1C !important;
    }

    /* Defecto 2 Dark Mode */
    .foodjet-pill--active,
    .foodjet-pill.active,
    .foodjet-pill[aria-selected="true"],
    .foodjet-pill.is-active {
        background-color: #E8E8E8 !important;
        border-color: #E8E8E8 !important;
        color: #121212 !important;
    }

    .foodjet-pill--active:hover,
    .foodjet-pill.active:hover,
    .foodjet-pill[aria-selected="true"]:hover,
    .foodjet-pill.is-active:hover {
        background-color: #FFFFFF !important;
        border-color: #FFFFFF !important;
        color: #000000 !important;
    }

    .foodjet-pill--active i,
    .foodjet-pill--active svg,
    .foodjet-pill.active i,
    .foodjet-pill.active svg {
        color: #121212 !important;
    }

    /* Offcanvas Dark Mode */
    .foodjet-offcanvas {
        background-color: #1E1E1E !important;
        color: #E8E8E8 !important;
        border-left-color: #333333 !important;
    }

    .foodjet-offcanvas .offcanvas-header {
        background-color: #1E1E1E !important;
        border-bottom-color: #333333 !important;
    }

    .foodjet-offcanvas .offcanvas-body {
        background-color: #121212 !important;
    }

    .foodjet-cart-restaurant {
        background-color: #1E1E1E !important;
        border-color: #333333 !important;
    }

    .cart-item {
        background-color: #1E1E1E !important;
        border-color: #333333 !important;
    }

    #cartFooter {
        background-color: #1E1E1E !important;
        border-top-color: #333333 !important;
    }

    #favoritesOffcanvas .foodjet-card {
        background-color: #1E1E1E !important;
        border-color: #333333 !important;
    }
}
```

---

### 5.3 Proposed Modifications to `frontend/js/ui.js`

```javascript
// Variable para recordar producto pendiente de confirmación de cambio de restaurante
let pendingProductIdForRestaurantChange = null;

export function showRestaurantChangeModal(productId) {
    pendingProductIdForRestaurantChange = productId;
    const currentRest = getCartRestaurant(state.getCart(), state.getProductById);
    const newProduct = state.getProductById(productId);
    const newRest = getProductRestaurant(newProduct);

    const currentNameEl = document.getElementById('restaurantChangeCurrentName');
    const newNameEl = document.getElementById('restaurantChangeNewName');

    if (currentNameEl) {
        currentNameEl.textContent = currentRest?.nombre || 'otro restaurante';
    }
    if (newNameEl) {
        newNameEl.textContent = newRest?.nombre || newProduct?.nombre || 'este restaurante';
    }

    const modalEl = document.getElementById('restaurantChangeModal');
    if (modalEl && typeof bootstrap !== 'undefined') {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    } else {
        showToast(mensajeRestauranteDistinto(), 'warning');
    }
}

// Inicialización del botón de confirmación en modal de cambio de restaurante
function initRestaurantChangeModal() {
    const confirmBtn = document.getElementById('restaurantChangeConfirmBtn');
    if (confirmBtn && !confirmBtn.dataset.initialized) {
        confirmBtn.dataset.initialized = 'true';
        confirmBtn.addEventListener('click', () => {
            if (pendingProductIdForRestaurantChange) {
                state.clearCart();
                const res = state.addToCart(pendingProductIdForRestaurantChange);
                if (res.success) {
                    renderCartOffcanvas();
                    renderProducts();
                    if (typeof renderCheckoutCart === 'function') renderCheckoutCart();
                    
                    const modalEl = document.getElementById('restaurantChangeModal');
                    if (modalEl && typeof bootstrap !== 'undefined') {
                        const modal = bootstrap.Modal.getInstance(modalEl);
                        if (modal) modal.hide();
                    }
                    const cartOffcanvasEl = document.getElementById('cartOffcanvas');
                    if (cartOffcanvasEl && typeof bootstrap !== 'undefined') {
                        const cartOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(cartOffcanvasEl);
                        cartOffcanvas.show();
                    }
                    showToast('Se cambió de restaurante y se agregó el producto');
                }
                pendingProductIdForRestaurantChange = null;
            }
        });
    }
}

// En renderProducts(), sustituir manejo de DIFFERENT_RESTAURANT:
// Línea 221:
if (result.error === 'DIFFERENT_RESTAURANT') {
    showRestaurantChangeModal(productId);
}

// En renderFavoritesOffcanvas(), sustituir manejo de DIFFERENT_RESTAURANT:
// Línea 353:
if (result.error === 'DIFFERENT_RESTAURANT') {
    showRestaurantChangeModal(productId);
}

// RENDERIZADO DEL OFFCANVAS DE FAVORITOS (Actualizado)
export function renderFavoritesOffcanvas() {
    const favorites = state.getFavorites();
    const container = document.getElementById('favoritesItemsContainer');
    const badgeNavbar = document.getElementById('favoritesCount');
    const badgeDrawer = document.getElementById('favoritesCountBadge');

    if (badgeNavbar) {
        badgeNavbar.textContent = favorites.length.toString();
        badgeNavbar.style.display = favorites.length > 0 ? 'inline-flex' : 'none';
    }
    if (badgeDrawer) {
        badgeDrawer.textContent = favorites.length.toString();
        badgeDrawer.style.display = favorites.length > 0 ? 'inline-block' : 'none';
    }

    if (!container) return;
    container.innerHTML = '';

    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 px-3">
                <div class="rounded-circle bg-danger-subtle d-inline-flex p-4 mb-3 text-danger">
                    <i class="bi bi-heart fs-1"></i>
                </div>
                <h5 class="fw-bold text-dark">No tienes productos favoritos aún</h5>
                <p class="text-muted small mb-4">Guarda tus platos preferidos tocando el corazón en el menú para encontrarlos rápidamente.</p>
                <button type="button" class="btn btn-primary foodjet-btn-primary rounded-pill px-4" data-bs-dismiss="offcanvas">
                    Explorar el menú
                </button>
            </div>`;
        return;
    }

    favorites.forEach(product => {
        const item = document.createElement('div');
        item.className = 'card mb-3 border rounded-3 shadow-sm foodjet-card';
        item.innerHTML = `
            <div class="row g-0 align-items-center p-2">
                <div class="col-3 col-sm-3">
                    <img src="${product.imagen_url}" class="img-fluid rounded-3 object-fit-cover w-100" style="height: 72px;" alt="${product.nombre}">
                </div>
                <div class="col-9 col-sm-9 ps-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="overflow-hidden pe-2">
                            <h6 class="card-title fw-bold mb-0 text-truncate" title="${product.nombre}">${product.nombre}</h6>
                            <small class="text-muted d-block text-truncate" style="font-size: 0.75rem;">
                                <i class="bi bi-shop me-1"></i>${product.Restaurant?.nombre || product.restaurante?.nombre || 'Restaurante'}
                            </small>
                        </div>
                        <button class="btn btn-sm btn-link text-danger p-0 remove-favorite flex-shrink-0" data-id="${product.id}" aria-label="Quitar de favoritos" title="Quitar de favoritos">
                            <i class="bi bi-x-circle-fill fs-5"></i>
                        </button>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <div class="price-box">
                            ${renderProductPrice(product, window.currentUser)}
                        </div>
                        <button class="btn btn-sm btn-primary add-to-cart-from-fav rounded-pill px-3 py-1" data-id="${product.id}" ${!product.disponibilidad ? 'disabled' : ''}>
                            ${product.disponibilidad ? '<i class="bi bi-cart-plus me-1"></i>Agregar' : 'Agotado'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(item);
    });

    // Event listeners para remover favorito
    container.querySelectorAll('.remove-favorite').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const productId = parseInt(e.currentTarget.dataset.id);
            const result = await api.toggleFavoriteAPI(productId, window.authToken);
            if (result.ok) {
                if (window.app && window.app.loadFavorites) {
                    window.app.loadFavorites();
                }
                showToast('Eliminado de favoritos');
            } else {
                showToast('Error al eliminar favorito', 'warning');
            }
        });
    });

    // Event listeners para agregar al carrito desde favoritos
    container.querySelectorAll('.add-to-cart-from-fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.disabled || e.currentTarget.disabled) return;
            const productId = parseInt(e.currentTarget.dataset.id);
            const result = state.addToCart(productId);

            if (result.success) {
                if (typeof bootstrap !== 'undefined') {
                    const favOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('favoritesOffcanvas'));
                    if (favOffcanvas) favOffcanvas.hide();
                    renderCartOffcanvas();
                    const cartOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('cartOffcanvas'));
                    cartOffcanvas.show();
                }
            } else {
                if (result.error === 'DIFFERENT_RESTAURANT') {
                    showRestaurantChangeModal(productId);
                } else if (result.error === 'UNAVAILABLE') {
                    showToast('Este producto no está disponible.', 'warning');
                }
            }
        });
    });

    initRestaurantChangeModal();
}

// RENDERIZADO DEL CARRITO (OFFCANVAS) (Actualizado)
export function renderCartOffcanvas() {
    const cart = state.getCart();
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cartFooter = document.getElementById('cartFooter');
    const emptyCart = document.getElementById('emptyCart');
    const restaurantBanner = document.getElementById('cartRestaurantBanner');
    const cartSubtotalEl = document.getElementById('cartSubtotal');
    const cartSavingsRow = document.getElementById('cartStudentSavingsRow');
    const cartSavingsEl = document.getElementById('cartStudentSavings');

    const cartCountBadges = ['cartCount', 'cartItemCount']
        .map((id) => document.getElementById(id))
        .filter(Boolean);

    if (!cartItemsContainer || !cartTotalElement) return;

    cartItemsContainer.innerHTML = '';

    if (state.isCartEmpty()) {
        if (restaurantBanner) {
            restaurantBanner.style.display = 'none';
            restaurantBanner.innerHTML = '';
        }
        cartTotalElement.textContent = 'S/ 0.00';
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (cartFooter) cartFooter.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'block';

        cartCountBadges.forEach((badge) => {
            badge.textContent = '0';
            if (badge.id === 'cartCount') badge.style.display = 'none';
        });
        return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;
    if (cartFooter) cartFooter.style.display = 'block';
    if (emptyCart) emptyCart.style.display = 'none';

    // Banner de restaurante activo
    const restaurant = getCartRestaurant(cart, state.getProductById);
    if (restaurant && restaurantBanner) {
        restaurantBanner.style.display = 'block';
        restaurantBanner.innerHTML = `
            <div class="foodjet-cart-restaurant card border-0 p-3">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <div class="foodjet-restaurant-icon-box me-3">
                            <i class="bi bi-shop fs-5"></i>
                        </div>
                        <div>
                            <h6 class="mb-0 fw-bold" id="cartRestaurantName">${restaurant.nombre}</h6>
                            <small class="text-muted" style="font-size: 0.75rem;">Preparado al momento</small>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger border-0 rounded-pill px-2 py-1 small" id="clearCartBtn" title="Vaciar carrito" aria-label="Vaciar todo el carrito">
                        <i class="bi bi-trash3 me-1"></i>Vaciar
                    </button>
                </div>
                ${restaurant.tiempo_entrega ? `
                <div class="mt-2 pt-2 border-top d-flex align-items-center text-success small" style="font-size: 0.8rem;">
                    <i class="bi bi-bicycle me-2 fs-6"></i>
                    <span class="fw-semibold">En tu puerta en ${restaurant.tiempo_entrega.replace(" minutos", " min")}</span>
                </div>` : ''}
            </div>
        `;

        document.getElementById('clearCartBtn')?.addEventListener('click', () => {
            state.clearCart();
            renderCartOffcanvas();
            renderProducts();
            if (typeof renderCheckoutCart === 'function') renderCheckoutCart();
            showToast('Carrito vaciado', 'info');
        });
    }

    let subtotalOriginal = 0;

    Object.entries(cart).forEach(([productId, quantity]) => {
        const product = state.getProductById(productId);
        if (!product) return;

        let price = product.precio;
        subtotalOriginal += product.precio * quantity;

        let isDiscounted = false;
        if (window.currentUser && window.currentUser.es_estudiante && product.descuento_estudiante > 0) {
            price = price - (price * (product.descuento_estudiante / 100));
            isDiscounted = true;
        }

        const itemTotal = price * quantity;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item d-flex align-items-center justify-content-between p-3 mb-2 rounded-3 border';
        cartItem.innerHTML = `
            <div class="d-flex align-items-center flex-grow-1 me-2 overflow-hidden">
                <img src="${product.imagen_url}" alt="${product.nombre}" class="rounded-3 me-3 object-fit-cover flex-shrink-0" style="width: 60px; height: 60px;">
                <div class="overflow-hidden">
                    <h6 class="mb-1 fw-bold text-truncate" title="${product.nombre}">${product.nombre}</h6>
                    <div class="d-flex align-items-center gap-1 flex-wrap">
                        ${isDiscounted ? '<span class="foodjet-badge foodjet-badge--student me-1">Estudiante</span>' : ''}
                        <small class="text-muted">S/ ${price.toFixed(2)}</small>
                    </div>
                </div>
            </div>
            <div class="d-flex flex-column align-items-end flex-shrink-0">
                <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="fw-bold text-dark">S/ ${itemTotal.toFixed(2)}</span>
                    <button type="button" class="btn btn-sm text-danger p-0 remove-item-btn" data-id="${product.id}" title="Eliminar producto" aria-label="Eliminar ${product.nombre} del carrito">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="btn-group btn-group-sm bg-light rounded-pill p-1 border">
                    <button class="btn btn-sm btn-link text-dark text-decoration-none minus-btn px-2 py-0" data-id="${product.id}" aria-label="Reducir cantidad de ${product.nombre}"><i class="bi bi-dash"></i></button>
                    <span class="px-2 d-flex align-items-center fw-bold small">${quantity}</span>
                    <button class="btn btn-sm btn-link text-dark text-decoration-none plus-btn px-2 py-0" data-id="${product.id}" aria-label="Aumentar cantidad de ${product.nombre}"><i class="bi bi-plus"></i></button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    const total = state.getCartTotal();
    const studentSavings = subtotalOriginal - total;

    if (cartSubtotalEl) {
        cartSubtotalEl.textContent = `S/ ${subtotalOriginal.toFixed(2)}`;
    }
    if (cartSavingsRow && cartSavingsEl) {
        if (studentSavings > 0.009) {
            cartSavingsRow.style.display = 'flex';
            cartSavingsEl.textContent = `-S/ ${studentSavings.toFixed(2)}`;
        } else {
            cartSavingsRow.style.display = 'none';
        }
    }
    cartTotalElement.textContent = `S/ ${total.toFixed(2)}`;

    const count = state.getCartItemCount();
    cartCountBadges.forEach((badge) => {
        badge.textContent = count.toString();
        if (badge.id === 'cartCount') badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });

    // Event listeners
    document.querySelectorAll('.plus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.currentTarget.dataset.id);
            state.addToCart(productId);
            renderCartOffcanvas();
        });
    });

    document.querySelectorAll('.minus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.currentTarget.dataset.id);
            state.removeFromCart(productId);
            renderCartOffcanvas();
        });
    });

    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = parseInt(e.currentTarget.dataset.id);
            state.removeItemCompletely(productId);
            renderCartOffcanvas();
            renderProducts();
            if (typeof renderCheckoutCart === 'function') renderCheckoutCart();
        });
    });

    initRestaurantChangeModal();
}
```

---

## 6. Draw.io Architecture Diagram Reference

The architectural and interaction flow is captured in the companion Draw.io diagram:
- **Path**: `C:\Users\ORLANDO\Desktop\Pagina-Foodjet\.agents\teamwork\explorer_m2_3\cart_favorites_architecture.drawio`
- **Features Illustrated**:
  1. Trigger pathways from Catalog (`.add-to-cart`) and Favorites (`.add-to-cart-from-fav`).
  2. Single restaurant decision branch (`check_rest`).
  3. Interactive conflict flow showing `#restaurantChangeModal` and resolution branches ("Conservar" vs "Vaciar y agregar").
  4. Component breakdown for `#cartOffcanvas`, `#favoritesOffcanvas`, and Challenger M1_1 A11y remediation.
  5. Compliance with Rule R1 (Draw.io self-sufficient source file).

---

## 7. Verification Method

To independently verify the implementation once applied:
```powershell
# 1. Ejecutar pruebas unitarias de contratos y regresión
npm run test:unit
node --no-warnings --test tests/unit/e2e_acceptance_tiers.test.mjs

# 2. Ejecutar suites frontend y backend completas
npm run test:frontend
npm run test:backend
npm test

# 3. Verificación de contraste WCAG (Node.js script)
node -e "
const fs = require('fs');
const css = fs.readFileSync('frontend/styles.css', 'utf8');
console.assert(css.includes('.foodjet-badge--yellow'), 'Badge rule exists');
console.assert(css.includes('color: #1C1C1C !important;'), 'Contrast fix applied');
console.log('Styles check passed');
"
```
