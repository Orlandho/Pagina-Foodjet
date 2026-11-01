# Explorer M2_2 Specification Report: Search, Filters & Product Cards Grid

**Date**: 2026-10-30T00:44:00Z  
**Author**: Explorer M2_2 (`teamwork_explorer`)  
**Target Milestone**: M2 — Navigation, Header & Home Catalog  
**Target Files**:
- `frontend/index.html`
- `frontend/styles.css`
- `frontend/js/ui.js`
- `frontend/js/domain/catalog.js`
- `frontend/js/app.js`

---

## 1. Executive Summary

This specification defines the complete modernization of the FoodJet catalog interface on the Web frontend, aligning it with the Android Jetpack Compose reference prototype (`HomeScreen.kt`, `FilterSection.kt`, `ProductCard.kt`, `FoodJetUi.kt`) while strictly preserving existing DOM contracts, IDs, and domain test suites.

### Core Enhancements:
1. **Integrated Catalog Search Bar**:
   - Modern search bar with magnifying glass icon (`bi-search`), placeholder `"¿Qué se te antoja hoy?"`, and interactive clear button (`bi-x-circle-fill`).
   - Combined real-time filtering with category pills, price range, and delivery time.
2. **Category Pill Chips (`#filter-food-type-container`)**:
   - Replaced plain checkboxes with pill chips (`.foodjet-pill`, active `.foodjet-pill--active`) styled after Compose `FilterSection.kt`.
   - Dedicated `"Todos"` pill for resetting categories, plus multi-select category toggles.
   - Retains hidden input checkboxes `.filter-food-type` to maintain 100% backward compatibility with `app.js` and existing DOM contracts.
3. **Catalog Feedback States**:
   - **Loading State**: 6 animated skeleton cards (`.foodjet-card--skeleton`) with shimmer effect that respects `prefers-reduced-motion`.
   - **Zero-Results State**: Friendly icon (`bi-search-heart`), message `"No encontramos antojos con esos filtros"`, and an active `"Limpiar filtros"` CTA button.
   - **Error State**: Friendly warning icon (`bi-exclamation-triangle`), descriptive connection message, and a `"Reintentar"` button invoking `ui.loadProducts()`.
4. **Product Card Grid (`#productsGrid`)**:
   - Card container `.foodjet-card`: 20px radius (`var(--radius-card)`), 1px border (`var(--color-border)`), surface background (`var(--color-surface)`), and hover elevation.
   - Floating badges: Yellow pill `"PRECIO ESTUDIANTE"` (`.foodjet-badge--student`) when student discount is applicable; Dark pill `"AGOTADO"` (`.foodjet-badge--soldout`) when `disponibilidad === false`.
   - Floating favorite button: 34x34px circular button (`.favorite-toggle`, `data-id="${product.id}"`) with optimistic toggle and backend sync.
   - Action button: 36x36px primary button (`.foodjet-btn-add`, `.add-to-cart`, `data-id="${product.id}"`) with white plus icon (`bi-plus-lg`), disabled if unavailable.
   - Bulletproof click handling preventing nested icon `<i>` event target traps (`pointer-events: none` on `i`).

---

## 2. Investigation & Baseline Findings

### 2.1 Test Suite Verification
Prior to any modifications, the existing test suites were executed to verify baseline stability:
- `npm run test:frontend`: **86 scenarios passed** (327 steps passed, 0 failures).
- `npm run test:backend`: **45 scenarios passed** (150 steps passed, 0 failures).
- `npm run test:unit`: **25 tests passed** across 6 suites (100% pass rate).

### 2.2 Domain Contract Analysis
In `frontend/js/domain/catalog.js`:
- `filterProducts(products, minPrice, maxPrice, maxTime, selectedCategories)` is directly called in Cucumber tests (`frontend/features/filtros_productos.feature`, scenarios `UT-REST-001` through `UT-REST-006`) and unit tests (`tests/unit/e2e_acceptance_tiers.test.mjs`, `TC-T1-FILT-04`, `TC-T1-FILT-05`, `TC-T3-CMB-04`, `TC-T4-E2E-01`).
- **Critical Requirement**: `filterProducts` must maintain backward compatibility by keeping the first 5 arguments intact and accepting an optional 6th argument `searchQuery = ''`.

### 2.3 DOM Contract Preservation Checklist
The following DOM IDs and attributes must remain intact:
- `#menu`: Main catalog section.
- `#filter-food-type-container`: Category container.
- `.filter-food-type`: Checkboxes queried by `ui.renderProducts()` and unchecked by `app.js` line 118.
- `#filter-price-min`: Price minimum input.
- `#filter-price-max`: Price maximum input.
- `input[name="deliveryTimeFilter"]`: Delivery time radio inputs (`#time-30`, `#time-60`, `#time-more`).
- `#btn-apply-filters`: Filter submission button.
- `#btn-clear-filters`: Filter reset button.
- `#productsGrid`: Product cards container.
- `.add-to-cart`: Button class with `data-id="${product.id}"`.
- `.favorite-toggle`: Button class with `data-id="${product.id}"`.

---

## 3. Concrete Implementation Specifications

### 3.1 `frontend/index.html` Changes

#### Section `#menu` Redesign:
Replace lines 175–243 of `frontend/index.html` with:

```html
            <section id="menu" class="py-5" aria-label="Menú de productos">
                <div class="container">
                    <!-- Titular & Subtítulo estilo Compose HomeScreen -->
                    <div class="text-center mb-4">
                        <h2 class="display-5 fw-bold mb-2">Tu antojo. Sin escalas.</h2>
                        <p class="text-muted fs-6">Lo mejor del barrio, directo a tu puerta.</p>
                    </div>

                    <!-- Buscador funcional integrado -->
                    <div class="foodjet-search-container mb-4">
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

                    <!-- Fila de Categorías (Pills) -->
                    <div class="mb-4">
                        <div id="filter-food-type-container">
                            <!-- Renderizado dinámico con ui.renderFoodTypeFilters() -->
                        </div>
                    </div>

                    <!-- Cuadrícula Principal con Filtros y Productos -->
                    <div class="row">
                        <!-- Sidebar de Filtros (Desktop: col-lg-3, Mobile: col-12) -->
                        <div class="col-lg-3 mb-4">
                            <div class="foodjet-card p-4">
                                <div class="d-flex align-items-center gap-2 mb-3">
                                    <i class="bi bi-sliders2 fs-5 text-primary" aria-hidden="true"></i>
                                    <h4 class="h5 fw-bold mb-0">Filtros</h4>
                                </div>

                                <hr class="my-3">

                                <div class="mb-3">
                                    <label class="form-label fw-bold small text-muted text-uppercase mb-2">Rango de precio (S/)</label>
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="text-muted small">S/</span>
                                        <input type="number" id="filter-price-min" class="form-control form-control-sm foodjet-input py-1" placeholder="Mín" min="0" aria-label="Precio mínimo">
                                        <span class="text-muted small">-</span>
                                        <span class="text-muted small">S/</span>
                                        <input type="number" id="filter-price-max" class="form-control form-control-sm foodjet-input py-1" placeholder="Máx" min="0" aria-label="Precio máximo">
                                    </div>
                                </div>

                                <hr class="my-3">

                                <div class="mb-3">
                                    <label class="form-label fw-bold small text-muted text-uppercase mb-2">Tiempo de entrega</label>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input filter-delivery-time" type="radio" name="deliveryTimeFilter" id="time-30" value="30 minutos">
                                        <label class="form-check-label text-muted small" for="time-30">
                                            30 minutos o menos
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input filter-delivery-time" type="radio" name="deliveryTimeFilter" id="time-60" value="1 hora">
                                        <label class="form-check-label text-muted small" for="time-60">
                                            Hasta 1 hora
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input filter-delivery-time" type="radio" name="deliveryTimeFilter" id="time-more" value="Más de 1 hora">
                                        <label class="form-check-label text-muted small" for="time-more">
                                            Más de 1 hora
                                        </label>
                                    </div>
                                </div>

                                <div class="d-flex flex-column gap-2 mt-4">
                                    <button class="btn foodjet-btn-primary w-100" id="btn-apply-filters">Aplicar filtros</button>
                                    <button class="btn foodjet-btn-secondary w-100" id="btn-clear-filters">Limpiar filtros</button>
                                </div>
                            </div>
                        </div>

                        <!-- Grid de Productos -->
                        <div class="col-lg-9">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h3 class="h4 fw-bold mb-0">Los favoritos del barrio</h3>
                                <span id="catalogResultsCount" class="text-muted small"></span>
                            </div>
                            <div class="row g-4" id="productsGrid">
                                <!-- Renderizado dinámico con ui.renderProducts() -->
                            </div>
                        </div>
                    </div>
                </div>
            </section>
```

---

### 3.2 `frontend/styles.css` Changes

Append the following scoped CSS rules to `frontend/styles.css`:

```css
/* ==========================================================================
   Catalog Search Bar (.foodjet-search-bar)
   ========================================================================== */
.foodjet-search-container {
    max-width: 640px;
    margin: 0 auto;
}

.foodjet-search-bar {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
}

.foodjet-search-icon {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-secondary);
    font-size: 1.15rem;
    pointer-events: none;
    z-index: 2;
}

.foodjet-search-input {
    width: 100%;
    height: 52px;
    border-radius: var(--radius-input); /* 16px */
    background-color: var(--color-surface);
    border: 1.5px solid var(--color-border);
    padding: 12px 48px 12px 50px;
    font-size: var(--font-body-large);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-sm);
    outline: none;
    transition: border-color var(--transition-fast),
                box-shadow var(--transition-fast),
                background-color var(--transition-fast);
}

.foodjet-search-input:hover {
    border-color: rgba(28, 28, 28, 0.4);
}

.foodjet-search-input:focus,
.foodjet-search-input:focus-visible {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(244, 81, 30, 0.2);
    outline: none !important;
}

.foodjet-search-clear {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    font-size: 1.2rem;
    padding: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    transition: color var(--transition-fast), transform var(--transition-fast);
    z-index: 2;
}

.foodjet-search-clear:hover {
    color: var(--color-text-primary);
    transform: translateY(-50%) scale(1.1);
}

/* ==========================================================================
   Category Pill Chips Row (.foodjet-pills-row)
   ========================================================================== */
.foodjet-pills-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding: 4px 2px 8px;
}

.foodjet-pills-container::-webkit-scrollbar {
    display: none;
}

.foodjet-pills-row {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
}

@media (min-width: 992px) {
    .foodjet-pills-row {
        flex-wrap: wrap;
        justify-content: center;
    }
}

/* ==========================================================================
   Catalog Feedback States (Loading Skeleton, Zero-Results & Error)
   ========================================================================== */
.foodjet-card--skeleton {
    pointer-events: none;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-card);
    overflow: hidden;
    height: 100%;
}

.foodjet-skeleton-box {
    background: linear-gradient(90deg, #ecebe6 0%, #f7f6f2 50%, #ecebe6 100%);
    background-size: 200% 100%;
    animation: foodjet-skeleton-shimmer 1.5s infinite ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
    .foodjet-skeleton-box {
        animation: none;
        background: #ecebe6;
    }
}

@keyframes foodjet-skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.foodjet-skeleton-img {
    width: 100%;
    aspect-ratio: 1.2;
}

.foodjet-skeleton-line {
    border-radius: 4px;
    margin-bottom: 8px;
}
.foodjet-skeleton-line--title {
    width: 75%;
    height: 18px;
}
.foodjet-skeleton-line--meta {
    width: 45%;
    height: 12px;
}
.foodjet-skeleton-line--desc {
    width: 90%;
    height: 12px;
}
.foodjet-skeleton-line--price {
    width: 40%;
    height: 22px;
    margin-bottom: 0;
}
.foodjet-skeleton-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-button);
}

.foodjet-empty-state,
.foodjet-error-state {
    padding: var(--space-8) var(--space-4);
    text-align: center;
}

.foodjet-empty-state__icon,
.foodjet-error-state__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    margin-bottom: var(--space-3);
}

.foodjet-empty-state__icon {
    background-color: var(--color-primary-light);
    color: var(--color-primary);
}

.foodjet-error-state__icon {
    background-color: var(--color-danger-container);
    color: var(--color-danger);
}

/* ==========================================================================
   Product Card Component (.foodjet-card.product-card)
   ========================================================================== */
.product-card.foodjet-card {
    border-radius: var(--radius-card); /* 20px */
    border: 1px solid var(--color-border);
    background-color: var(--color-surface);
    transition: transform var(--transition-smooth),
                box-shadow var(--transition-smooth),
                border-color var(--transition-fast);
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.product-card.foodjet-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: rgba(244, 81, 30, 0.4);
}

.product-card__img-container {
    position: relative;
    width: 100%;
    aspect-ratio: 1.2;
    overflow: hidden;
    background-color: var(--color-background);
}

.product-card__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
}

.product-card.foodjet-card:hover .product-card__img {
    transform: scale(1.05);
}

.product-card__fav-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-full);
    background: #FFFFFF;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 3;
    transition: transform var(--transition-fast), background-color var(--transition-fast);
}

.product-card__fav-btn:hover {
    transform: scale(1.12);
}

.product-card__fav-btn i {
    pointer-events: none;
}

.product-card__badge-container {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 3;
}

.product-card__body {
    padding: var(--space-3) var(--space-4) var(--space-4);
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.product-card__title {
    font-size: 0.9375rem; /* 15px */
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: 2px;
    line-height: 1.3;
}

.product-card__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.75rem; /* 12px */
    color: var(--color-text-secondary);
    margin-bottom: 6px;
}

.product-card__desc {
    font-size: 0.75rem; /* 12px */
    color: var(--color-text-secondary);
    line-height: 1.35;
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex-grow: 1;
}

.product-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px solid var(--color-border-subtle);
}

.product-card__price-orig {
    font-size: 0.6875rem; /* 11px */
    color: var(--color-text-muted);
    text-decoration: line-through;
    display: block;
    line-height: 1;
}

.product-card__price-final {
    font-size: 1.0625rem; /* 17px */
    font-weight: 800;
    line-height: 1.2;
}

.product-card__price-final--student {
    color: var(--color-success-deep);
}

.product-card__price-final--regular {
    color: var(--color-text-primary);
}

.product-card__add-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-button); /* 14px */
    background-color: var(--color-primary);
    color: #FFFFFF !important;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color var(--transition-fast), transform var(--transition-fast);
}

.product-card__add-btn:hover:not(:disabled) {
    background-color: var(--color-primary-dark);
    transform: scale(1.08);
}

.product-card__add-btn:disabled,
.product-card__add-btn.disabled {
    background-color: var(--color-border);
    color: var(--color-text-muted) !important;
    cursor: not-allowed;
    transform: none;
}

.product-card__add-btn i {
    pointer-events: none; /* Prevents event target traps */
}
```

---

### 3.3 `frontend/js/domain/catalog.js` Updates

Enhance `filterProducts` to support the optional 6th parameter `searchQuery`:

```javascript
/**
 * Filtra la lista de productos por rango de precio, tiempo de entrega,
 * categorías seleccionadas y búsqueda de texto.
 *
 * Mantiene compatibilidad total con llamadas anteriores de 5 parámetros.
 */
export function filterProducts(products, minPrice = 0, maxPrice = 999999, maxTime = 999999, selectedCategories = [], searchQuery = '') {
    const q = (searchQuery || '').trim().toLowerCase();

    return (products || []).filter(product => {
        const minP = typeof minPrice === 'number' && !isNaN(minPrice) ? minPrice : 0;
        const maxP = typeof maxPrice === 'number' && !isNaN(maxPrice) ? maxPrice : 999999;
        const matchesPrice = product.precio >= minP && product.precio <= maxP;

        const productTime = parseDeliveryTime(product.Restaurant?.tiempo_entrega);
        const limitTime = typeof maxTime === 'number' && !isNaN(maxTime) ? maxTime : 999999;
        const matchesTime = productTime <= limitTime;

        const categoryName = product.categoria?.nombre || product.tipo_comida;
        const matchesCategory =
            !selectedCategories || selectedCategories.length === 0 || selectedCategories.includes(categoryName);

        const matchesSearch = !q ||
            (product.nombre && product.nombre.toLowerCase().includes(q)) ||
            (product.descripcion && product.descripcion.toLowerCase().includes(q)) ||
            (product.Restaurant?.nombre && product.Restaurant.nombre.toLowerCase().includes(q));

        return matchesPrice && matchesTime && matchesCategory && matchesSearch;
    });
}
```

---

### 3.4 `frontend/js/ui.js` Implementation

#### 1. Add Feedback State Renderers:
```javascript
export function renderCatalogLoading() {
    const menuContainer = document.getElementById('productsGrid');
    if (!menuContainer) return;

    menuContainer.innerHTML = Array.from({ length: 6 }).map(() => `
        <div class="col-md-4 col-sm-6 mb-4">
            <div class="foodjet-card--skeleton">
                <div class="foodjet-skeleton-box foodjet-skeleton-img"></div>
                <div class="p-3">
                    <div class="foodjet-skeleton-box foodjet-skeleton-line foodjet-skeleton-line--title"></div>
                    <div class="foodjet-skeleton-box foodjet-skeleton-line foodjet-skeleton-line--meta"></div>
                    <div class="foodjet-skeleton-box foodjet-skeleton-line foodjet-skeleton-line--desc"></div>
                    <div class="d-flex justify-content-between align-items-center mt-3 pt-2">
                        <div class="foodjet-skeleton-box foodjet-skeleton-line foodjet-skeleton-line--price"></div>
                        <div class="foodjet-skeleton-box foodjet-skeleton-btn"></div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

export function renderCatalogZeroResults(menuContainer) {
    if (!menuContainer) return;
    menuContainer.innerHTML = `
        <div class="col-12 py-5 text-center">
            <div class="foodjet-empty-state mx-auto" style="max-width: 440px;">
                <div class="foodjet-empty-state__icon mb-3">
                    <i class="bi bi-search-heart fs-1"></i>
                </div>
                <h4 class="h5 fw-bold mb-2">No encontramos antojos con esos filtros</h4>
                <p class="text-muted small mb-4">Prueba ajustando el texto de búsqueda, cambiando el rango de precio o explorando todas las categorías.</p>
                <button type="button" class="btn foodjet-btn-primary btn-sm px-4 rounded-pill" id="btn-zero-clear-filters">
                    <i class="bi bi-arrow-counterclockwise me-1"></i>Limpiar filtros
                </button>
            </div>
        </div>
    `;

    document.getElementById('btn-zero-clear-filters')?.addEventListener('click', () => {
        resetAllCatalogFilters();
    });
}

export function renderCatalogError(message) {
    const menuContainer = document.getElementById('productsGrid');
    if (!menuContainer) return;

    menuContainer.innerHTML = `
        <div class="col-12 py-5 text-center">
            <div class="foodjet-error-state mx-auto" style="max-width: 460px;">
                <div class="foodjet-error-state__icon mb-3">
                    <i class="bi bi-exclamation-triangle fs-1"></i>
                </div>
                <h4 class="h5 fw-bold mb-2 text-danger">No pudimos cargar los antojos</h4>
                <p class="text-muted small mb-4">${message || 'Ocurrió un inconveniente al conectar con el servidor.'}</p>
                <button type="button" class="btn foodjet-btn-primary px-4 rounded-pill" id="btn-catalog-retry">
                    <i class="bi bi-arrow-repeat me-1"></i>Reintentar
                </button>
            </div>
        </div>
    `;

    document.getElementById('btn-catalog-retry')?.addEventListener('click', () => {
        loadProducts();
    });
}

function resetAllCatalogFilters() {
    const searchInput = document.getElementById('catalogSearchInput');
    if (searchInput) {
        searchInput.value = '';
        document.getElementById('catalogSearchClear')?.classList.add('d-none');
    }
    document.querySelectorAll('.filter-food-type, .filter-delivery-time').forEach(cb => cb.checked = false);
    document.querySelectorAll('#filter-food-type-container label.foodjet-pill').forEach(l => l.classList.remove('foodjet-pill--active'));
    document.getElementById('filter-cat-all')?.classList.add('foodjet-pill--active');

    const minPrice = document.getElementById('filter-price-min');
    if (minPrice) minPrice.value = '';
    const maxPrice = document.getElementById('filter-price-max');
    if (maxPrice) maxPrice.value = '';

    renderProducts();
}
```

#### 2. Update `loadProducts()`:
```javascript
export async function loadProducts() {
    renderCatalogLoading();
    try {
        const products = await api.fetchProductsAPI();
        if (!products || products.length === 0) {
            renderCatalogError('El catálogo de productos está vacío o no respondió el servicio.');
            return;
        }
        state.setProducts(products);
        renderFoodTypeFilters();
        renderProducts();
    } catch (err) {
        console.error('Error al cargar productos:', err);
        renderCatalogError(err?.message || 'Error de conexión con el servidor.');
    }
}
```

#### 3. Update `renderFoodTypeFilters()`:
```javascript
export function renderFoodTypeFilters() {
    const products = state.getProducts();
    const categories = [...new Set(products.map(p => p.categoria?.nombre || p.tipo_comida).filter(Boolean))];
    const container = document.getElementById('filter-food-type-container');
    if (!container) return;

    container.innerHTML = `
        <div class="foodjet-pills-container w-100">
            <div class="foodjet-pills-row">
                <button type="button" class="foodjet-pill foodjet-pill--active" id="filter-cat-all" data-category="all" aria-pressed="true">
                    Todos
                </button>
                ${categories.map(cat => {
                    const safeId = 'filter-cat-' + cat.replace(/\s+/g, '-');
                    return `
                        <label class="foodjet-pill" for="${safeId}" data-category="${cat}">
                            <input class="form-check-input filter-food-type visually-hidden" type="checkbox" value="${cat}" id="${safeId}">
                            <span>${cat}</span>
                        </label>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    const btnAll = document.getElementById('filter-cat-all');
    if (btnAll) {
        btnAll.addEventListener('click', () => {
            document.querySelectorAll('.filter-food-type').forEach(cb => cb.checked = false);
            document.querySelectorAll('#filter-food-type-container label.foodjet-pill').forEach(l => l.classList.remove('foodjet-pill--active'));
            btnAll.classList.add('foodjet-pill--active');
            btnAll.setAttribute('aria-pressed', 'true');
            renderProducts();
        });
    }

    container.querySelectorAll('.filter-food-type').forEach(cb => {
        cb.addEventListener('change', () => {
            const label = cb.closest('label');
            if (cb.checked) {
                label?.classList.add('foodjet-pill--active');
                btnAll?.classList.remove('foodjet-pill--active');
                btnAll?.setAttribute('aria-pressed', 'false');
            } else {
                label?.classList.remove('foodjet-pill--active');
                const anyChecked = container.querySelector('.filter-food-type:checked');
                if (!anyChecked && btnAll) {
                    btnAll.classList.add('foodjet-pill--active');
                    btnAll.setAttribute('aria-pressed', 'true');
                }
            }
            renderProducts();
        });
    });
}
```

#### 4. Update `renderProducts()`:
```javascript
export function renderProducts() {
    const products = state.getProducts();
    const menuContainer = document.getElementById('productsGrid');
    if (!menuContainer) return;

    menuContainer.innerHTML = '';

    const minPriceInput = document.getElementById('filter-price-min');
    const maxPriceInput = document.getElementById('filter-price-max');
    const timeFilterInput = document.querySelector('input[name="deliveryTimeFilter"]:checked');
    const foodTypeCheckboxes = document.querySelectorAll('.filter-food-type:checked');
    const searchInput = document.getElementById('catalogSearchInput');

    let minPrice = 0;
    let maxPrice = 999999;
    if (minPriceInput && minPriceInput.value) {
        minPrice = parseFloat(minPriceInput.value);
    }
    if (maxPriceInput && maxPriceInput.value) {
        maxPrice = parseFloat(maxPriceInput.value);
    }

    let maxTime = 999999;
    if (timeFilterInput && timeFilterInput.value) {
        if (timeFilterInput.value.includes("30")) maxTime = 30;
        else if (timeFilterInput.value.includes("1 hora") && !timeFilterInput.value.includes("Más")) maxTime = 60;
    }

    const selectedCategories = Array.from(foodTypeCheckboxes).map(cb => cb.value);
    const searchQuery = searchInput ? searchInput.value.trim() : '';

    const filteredProducts = filterProducts(
        products,
        minPrice,
        maxPrice,
        maxTime,
        selectedCategories,
        searchQuery
    );

    const countEl = document.getElementById('catalogResultsCount');
    if (countEl) {
        countEl.textContent = `${filteredProducts.length} ${filteredProducts.length === 1 ? 'antojo' : 'antojos'}`;
    }

    if (filteredProducts.length === 0) {
        renderCatalogZeroResults(menuContainer);
        return;
    }

    filteredProducts.forEach(product => {
        const isFav = state.isFavorite(product.id);
        const iconClass = isFav ? 'bi-heart-fill text-danger' : 'bi-heart text-dark';

        const priceData = calculateStudentPrice(product, window.currentUser);
        const hasStudentDiscount = priceData.hasDiscount;

        let badgeHtml = '';
        if (!product.disponibilidad) {
            badgeHtml = '<span class="foodjet-badge foodjet-badge--soldout">AGOTADO</span>';
        } else if (product.descuento_estudiante > 0) {
            badgeHtml = '<span class="foodjet-badge foodjet-badge--student">PRECIO ESTUDIANTE</span>';
        }

        const priceHtml = hasStudentDiscount
            ? `<span class="product-card__price-orig">S/ ${priceData.originalPrice.toFixed(2)}</span>
               <span class="product-card__price-final product-card__price-final--student">S/ ${priceData.finalPrice.toFixed(2)}</span>`
            : `<span class="product-card__price-final product-card__price-final--regular">S/ ${priceData.originalPrice.toFixed(2)}</span>`;

        const tiempoEntrega = (product.Restaurant?.tiempo_entrega || '30 min').replace(' minutos', ' min');
        const restauranteNombre = product.Restaurant?.nombre || 'Restaurante';

        const col = document.createElement('div');
        col.className = 'col-lg-4 col-md-6 mb-4';
        col.innerHTML = `
            <div class="product-card foodjet-card">
                <div class="product-card__img-container">
                    ${badgeHtml ? `<div class="product-card__badge-container">${badgeHtml}</div>` : ''}
                    <button class="product-card__fav-btn favorite-toggle" data-id="${product.id}" 
                            aria-label="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
                            title="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                        <i class="bi ${iconClass}"></i>
                    </button>
                    <img src="${product.imagen_url}" class="product-card__img" alt="${product.nombre}" loading="lazy">
                </div>
                <div class="product-card__body">
                    <h5 class="product-card__title text-truncate" title="${product.nombre}">${product.nombre}</h5>
                    <div class="product-card__meta">
                        <span><i class="bi bi-clock me-1" aria-hidden="true"></i>${tiempoEntrega}</span>
                        <span>•</span>
                        <span class="text-truncate" style="max-width: 140px;" title="${restauranteNombre}">
                            <i class="bi bi-shop me-1" aria-hidden="true"></i>${restauranteNombre}
                        </span>
                    </div>
                    <p class="product-card__desc">${product.descripcion || 'Delicioso plato preparado con los mejores ingredientes.'}</p>
                    <div class="product-card__footer">
                        <div class="price-container">
                            ${priceHtml}
                        </div>
                        <button class="product-card__add-btn add-to-cart ${!product.disponibilidad ? 'disabled' : ''}" 
                                data-id="${product.id}" 
                                ${!product.disponibilidad ? 'disabled' : ''} 
                                aria-label="${product.disponibilidad ? `Agregar ${product.nombre} al carrito` : `${product.nombre} agotado`}"
                                title="${product.disponibilidad ? 'Agregar al carrito' : 'Agotado'}">
                            <i class="bi ${product.disponibilidad ? 'bi-plus-lg' : 'bi-dash-lg'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        menuContainer.appendChild(col);
    });

    // Event listeners para 'add to cart' con defensa contra nested icons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget || e.target.closest('.add-to-cart');
            if (!btn || btn.classList.contains('disabled') || btn.disabled) return;
            const productId = parseInt(btn.dataset.id);
            const result = state.addToCart(productId);
            if (result.success) {
                renderCartOffcanvas();
                const cartEl = document.getElementById('cartOffcanvas');
                if (cartEl && window.bootstrap) {
                    const cartOffcanvas = bootstrap.Offcanvas.getInstance(cartEl) || new bootstrap.Offcanvas(cartEl);
                    cartOffcanvas.show();
                }
            } else {
                if (result.error === 'DIFFERENT_RESTAURANT') {
                    showToast(mensajeRestauranteDistinto(), 'warning');
                } else if (result.error === 'UNAVAILABLE') {
                    showToast('Este producto no está disponible.', 'warning');
                }
            }
        });
    });

    // Event listeners para favoritos con defensa contra nested icons
    document.querySelectorAll('.favorite-toggle').forEach(button => {
        button.addEventListener('click', async (e) => {
            const btn = e.currentTarget || e.target.closest('.favorite-toggle');
            if (!btn) return;

            if (!window.authToken) {
                showToast('Inicia sesión para guardar favoritos', 'warning');
                const modalEl = document.getElementById('loginModal');
                if (modalEl && window.bootstrap) {
                    const loginModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                    loginModal.show();
                }
                return;
            }

            const productId = parseInt(btn.dataset.id);
            const icon = btn.querySelector('i');
            const isCurrentlyFav = icon.classList.contains('bi-heart-fill');

            if (isCurrentlyFav) {
                icon.classList.replace('bi-heart-fill', 'bi-heart');
                icon.classList.replace('text-danger', 'text-dark');
                btn.setAttribute('aria-label', 'Agregar a favoritos');
                btn.setAttribute('title', 'Agregar a favoritos');
                state.removeFavorite(productId);
            } else {
                icon.classList.replace('bi-heart', 'bi-heart-fill');
                icon.classList.replace('text-dark', 'text-danger');
                btn.setAttribute('aria-label', 'Quitar de favoritos');
                btn.setAttribute('title', 'Quitar de favoritos');
                const product = state.getProductById(productId);
                if (product) state.addFavorite(product);
            }

            const result = await api.toggleFavoriteAPI(productId, window.authToken);
            if (!result.ok) {
                showToast('Error al actualizar favorito en el servidor', 'warning');
                if (window.app && window.app.loadFavorites) {
                    window.app.loadFavorites();
                }
            } else {
                if (window.app && window.app.loadFavorites) {
                    window.app.loadFavorites();
                }
                if (result.data.isFavorite) {
                    showToast('Añadido a favoritos');
                } else {
                    showToast('Eliminado de favoritos');
                }
            }
        });
    });
}
```

---

### 3.5 `frontend/js/app.js` Wiring

In `initEventListeners()`:
```javascript
    // Buscador interactivo en tiempo real
    const catalogSearchInput = document.getElementById('catalogSearchInput');
    const catalogSearchClear = document.getElementById('catalogSearchClear');
    if (catalogSearchInput) {
        catalogSearchInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (catalogSearchClear) {
                if (val.length > 0) {
                    catalogSearchClear.classList.remove('d-none');
                } else {
                    catalogSearchClear.classList.add('d-none');
                }
            }
            ui.renderProducts();
        });
    }

    if (catalogSearchClear) {
        catalogSearchClear.addEventListener('click', () => {
            if (catalogSearchInput) {
                catalogSearchInput.value = '';
                catalogSearchClear.classList.add('d-none');
                catalogSearchInput.focus();
            }
            ui.renderProducts();
        });
    }
```
And replace the direct catalog initialization in `app.js` line 75 with:
```javascript
async function initCatalog() {
    await ui.loadProducts();
}
```

---

## 4. Verification & Testing Matrix

| Requirement | Test Method | Expected Result |
|---|---|---|
| Search bar filters by product name | Enter `"Pizza"` in `#catalogSearchInput` | Only pizzas are displayed; results count updates |
| Search bar filters by description | Enter `"artesanal"` in `#catalogSearchInput` | Matching products with description appear |
| Search clear button | Type in search bar, click `#catalogSearchClear` | Input clears, clear button hides, full catalog reloads |
| Category pill toggle | Click `"Hamburguesas"` pill | Only burgers appear, pill becomes dark active (`.foodjet-pill--active`) |
| Category pill "Todos" | Click `"Todos"` pill | All categories deselect, full catalog displays |
| Zero-Results State | Search `"XYZNONEXISTENT"` | Friendly zero-state icon, text, and `"Limpiar filtros"` button render |
| Zero-Results Reset | Click `"Limpiar filtros"` button | All filters and search reset, catalog renders |
| Error & Retry State | Simulate fetch failure | Error icon and message render with `"Reintentar"` button invoking `loadProducts()` |
| Product Card Badges | Student account vs regular | Shows `"PRECIO ESTUDIANTE"` with discount green price |
| Product Card Sold Out | Set `disponibilidad: false` | Shows `"AGOTADO"` badge, button disabled with dash icon |
| Add to Cart Button | Click "+" button on card | Item added to cart, cart offcanvas opens |
| Favorite Toggle | Click heart button on card | Heart turns red/outline, updates state and calls backend API |
| Cucumber Regression | `npm run test:frontend` | 86/86 scenarios PASS |
| Backend Regression | `npm run test:backend` | 45/45 scenarios PASS |
| Unit Regression | `npm run test:unit` | 25/25 tests PASS |
