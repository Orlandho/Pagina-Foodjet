import * as state from './state.js';
import * as api from './api.js';
import {
    getTrackingViewModel,
    normalizeEstado,
    isTerminal,
    getEstadoBadge,
    deriveSubtotal
} from './domain/orderStatus.js';
import {
    calculateStudentPrice,
    renderProductPrice,
    parseDeliveryTime,
    filterProducts,
    getProductRestaurant,
    getCartRestaurant
} from './domain/catalog.js';
import { lineaDeTiempo, formatearRestante } from './domain/seguimiento.js';
import { mostrarMapaSeguimiento, detenerMapaSeguimiento } from './mapaSeguimiento.js';
import { direccionInicial } from './domain/ubicacion.js';

// UTILIDADES GENERALES DE UI
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Si el mismo aviso ya está en pantalla no se apila otro: al intentar
    // añadir varios productos de otro restaurante se acumulaban seis mensajes
    // idénticos que tapaban la página. Se reinicia el temporizador del que ya
    // hay para que siga visible.
    const yaVisible = Array.from(toastContainer.querySelectorAll('.toast'))
        .find((t) => t.dataset.mensaje === message);

    if (yaVisible) {
        // eslint-disable-next-line no-undef
        bootstrap.Toast.getOrCreateInstance(yaVisible, { delay: 3000 }).show();
        return;
    }

    toast.dataset.mensaje = message;
    toastContainer.appendChild(toast);

    // eslint-disable-next-line no-undef
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

export function showView(viewToShowId) {
    const allViews = ['homeView', 'checkoutView', 'trackingView', 'dashboardView', 'orderHistoryView'];

    allViews.forEach(viewId => {
        const viewElement = document.getElementById(viewId);
        if (viewElement) {
            viewElement.style.display = 'none';
        }
    });

    const viewToShow = document.getElementById(viewToShowId);
    if (viewToShow) {
        viewToShow.style.display = 'block';

        // El foco viaja al encabezado de la vista: sin esto, quien navega con
        // teclado o lector de pantalla se queda donde estaba y no percibe que
        // la página cambió (WCAG 2.4.3, orden del foco).
        viewToShow.querySelector('h1')?.focus();
    }

    // Sin esto el sondeo del pedido seguiría corriendo para siempre en
    // segundo plano, y se acumularía uno nuevo con cada pedido.
    if (viewToShowId !== 'trackingView') {
        stopOrderTracking();
    }
}

/**
 * Explica por qué se rechazó el producto nombrando el restaurante del carrito.
 *
 * QA reportó que el rechazo parecía arbitrario: el mensaje enunciaba la regla
 * pero las tarjetas no decían de qué restaurante era cada producto, así que no
 * había forma de saber cuál era el conflicto.
 */
function mensajeRestauranteDistinto() {
    const restaurante = getCartRestaurant(state.getCart(), state.getProductById);

    return restaurante?.nombre
        ? `Tu pedido es de ${restaurante.nombre}. Vacía el carrito para pedir de otro restaurante.`
        : 'Solo puedes agregar productos de un mismo restaurante al pedido.';
}

/** Nombre legible del método de pago guardado en la transacción. */
function etiquetaMetodoPago(metodo) {
    const etiquetas = { cash: 'Efectivo', card: 'Tarjeta', wallet: 'Billetera digital (Yape/Plin)' };
    return etiquetas[metodo] || 'No registrado';
}

function etiquetaEstadoPago(estado) {
    const etiquetas = { pendiente: 'Pendiente de cobro', completado: 'Pagado' };
    return etiquetas[estado] || 'No registrado';
}

// ==========================================
// CABECERA: DIRECCIÓN DE ENTREGA (REAL VS NEUTRAL)
// ==========================================

export function updateHeaderAddress(addressText) {
    const headerAddressText = document.getElementById('headerAddressText');
    if (headerAddressText) {
        headerAddressText.textContent = addressText || 'Ingresar dirección de entrega';
    }
}

export async function syncHeaderAddress() {
    const headerAddressText = document.getElementById('headerAddressText');
    if (!headerAddressText) return;

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
        updateHeaderAddress('Ingresar dirección de entrega');
    }
}

export function initHeaderAddress() {
    const addressBar = document.getElementById('headerAddressBar');
    if (addressBar && !addressBar.dataset.initialized) {
        addressBar.dataset.initialized = 'true';
        addressBar.addEventListener('click', () => {
            if (window.authToken && typeof bootstrap !== 'undefined') {
                const modalEl = document.getElementById('miCuentaModal');
                if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
            } else if (typeof bootstrap !== 'undefined') {
                const modalEl = document.getElementById('loginModal');
                if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
            }
        });
        addressBar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                addressBar.click();
            }
        });
    }
    syncHeaderAddress();
}

// ==========================================
// MODAL DE CONFLICTO DE RESTAURANTE
// ==========================================

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

export function initRestaurantChangeModal() {
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

// ==========================================
// BUSCADOR Y ESTADOS DE FEEDBACK DEL CATÁLOGO
// ==========================================

export function initCatalogSearch() {
    const searchInput = document.getElementById('catalogSearchInput');
    const clearBtn = document.getElementById('catalogSearchClear');
    if (!searchInput) return;

    if (!searchInput.dataset.initialized) {
        searchInput.dataset.initialized = 'true';
        searchInput.addEventListener('input', () => {
            if (clearBtn) {
                if (searchInput.value.trim().length > 0) {
                    clearBtn.classList.remove('d-none');
                } else {
                    clearBtn.classList.add('d-none');
                }
            }
            renderProducts();
        });
    }

    if (clearBtn && !clearBtn.dataset.initialized) {
        clearBtn.dataset.initialized = 'true';
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.classList.add('d-none');
            renderProducts();
            searchInput.focus();
        });
    }
}

export function resetAllCatalogFilters() {
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

// RENDERIZADO DE PRODUCTOS EN EL INICIO
export function renderProducts() {
    initCatalogSearch();
    initHeaderAddress();

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

    let filteredProducts = filterProducts(
        products,
        minPrice,
        maxPrice,
        maxTime,
        selectedCategories
    );

    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(product => {
            const nameMatch = product.nombre && product.nombre.toLowerCase().includes(searchQuery);
            const descMatch = product.descripcion && product.descripcion.toLowerCase().includes(searchQuery);
            const restName = product.Restaurant?.nombre || product.restaurante?.nombre || '';
            const restMatch = restName && restName.toLowerCase().includes(searchQuery);
            return nameMatch || descMatch || restMatch;
        });
    }

    const resultsCountEl = document.getElementById('catalogResultsCount');
    if (resultsCountEl) {
        resultsCountEl.textContent = `${filteredProducts.length} ${filteredProducts.length === 1 ? 'producto' : 'productos'}`;
    }

    if (filteredProducts.length === 0) {
        renderCatalogZeroResults(menuContainer);
        return;
    }

    filteredProducts.forEach(product => {
        const isFav = state.isFavorite(product.id);
        const iconClass = isFav ? 'bi-heart-fill text-danger' : 'bi-heart text-muted';

        const isStudent = window.currentUser && window.currentUser.es_estudiante && product.descuento_estudiante > 0;
        let badgeHtml = '';
        if (!product.disponibilidad) {
            badgeHtml = '<span class="foodjet-badge foodjet-badge--soldout">AGOTADO</span>';
        } else if (isStudent) {
            badgeHtml = '<span class="foodjet-badge foodjet-badge--student">PRECIO ESTUDIANTE</span>';
        }

        const priceHtml = renderProductPrice(product, window.currentUser);

        const btnClass = product.disponibilidad ? '' : 'disabled';
        const isAvailable = Boolean(product.disponibilidad);

        const col = document.createElement('div');
        col.className = 'col-md-4 col-sm-6 mb-4';
        col.innerHTML = `
            <div class="product-card foodjet-card h-100">
                <div class="product-card__img-container">
                    ${badgeHtml ? `<div class="product-card__badge-container">${badgeHtml}</div>` : ''}
                    <button type="button" class="product-card__fav-btn favorite-toggle" data-id="${product.id}" aria-label="Marcar ${product.nombre} como favorito">
                        <i class="bi ${iconClass}"></i>
                    </button>
                    <img src="${product.imagen_url || product.imagen || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500'}" class="product-card__img" alt="${product.nombre}" loading="lazy">
                </div>
                <div class="product-card__body">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <h5 class="product-card__title text-truncate" title="${product.nombre}">${product.nombre}</h5>
                    </div>
                    <div class="product-card__meta">
                        <span><i class="bi bi-clock me-1" aria-hidden="true"></i>${product.Restaurant?.tiempo_entrega || '30 min'}</span>
                        <span>•</span>
                        <span class="text-truncate" style="max-width: 140px;"><i class="bi bi-shop me-1" aria-hidden="true"></i>${product.Restaurant?.nombre || product.restaurante?.nombre || 'Restaurante'}</span>
                    </div>
                    <p class="product-card__desc">${product.descripcion || 'Delicioso plato preparado con los mejores ingredientes.'}</p>
                    <div class="product-card__footer">
                        <div class="price-container">
                            ${priceHtml}
                        </div>
                        <button type="button" class="product-card__add-btn add-to-cart ${btnClass}" data-id="${product.id}" ${!isAvailable ? 'disabled' : ''} aria-label="Agregar ${product.nombre} al carrito" title="Agregar al carrito">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        menuContainer.appendChild(col);
    });

    // Event listeners para 'add to cart'
    menuContainer.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            if (btn.disabled || btn.classList.contains('disabled')) return;
            const productId = parseInt(btn.dataset.id);
            const result = state.addToCart(productId);
            if (result.success) {
                renderCartOffcanvas();
                if (typeof bootstrap !== 'undefined') {
                    const cartEl = document.getElementById('cartOffcanvas');
                    if (cartEl) {
                        const cartOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(cartEl);
                        cartOffcanvas.show();
                    }
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

    // Event listeners para favoritos
    menuContainer.querySelectorAll('.favorite-toggle').forEach(button => {
        button.addEventListener('click', async (e) => {
            if (!window.authToken) {
                showToast('Inicia sesión para guardar favoritos', 'warning');
                if (typeof bootstrap !== 'undefined') {
                    const loginModalEl = document.getElementById('loginModal');
                    if (loginModalEl) {
                        const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalEl);
                        loginModal.show();
                    }
                }
                return;
            }

            const productId = parseInt(e.currentTarget.dataset.id);
            const icon = e.currentTarget.querySelector('i');

            // Toggle visual optimista
            const isCurrentlyFav = icon.classList.contains('bi-heart-fill');
            if (isCurrentlyFav) {
                icon.classList.replace('bi-heart-fill', 'bi-heart');
                icon.classList.replace('text-danger', 'text-muted');
                state.removeFavorite(productId);
            } else {
                icon.classList.replace('bi-heart', 'bi-heart-fill');
                icon.classList.replace('text-muted', 'text-danger');
                const product = state.getProductById(productId);
                if (product) state.addFavorite(product);
            }

            // Llamada al backend
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
                if (result.data?.isFavorite) {
                    showToast('Añadido a favoritos');
                } else {
                    showToast('Eliminado de favoritos');
                }
            }
        });
    });

    initRestaurantChangeModal();
}

// RENDERIZADO DEL OFFCANVAS DE FAVORITOS
export function renderFavoritesOffcanvas() {
    initHeaderAddress();

    const favorites = state.getFavorites();
    const container = document.getElementById('favoritesItemsContainer');
    const badgeNavbar = document.getElementById('favoritesCount');
    const badgeDrawer = document.getElementById('favoritesCountBadge');

    const count = Array.isArray(favorites) ? favorites.length : 0;
    if (badgeNavbar) {
        badgeNavbar.textContent = count.toString();
        badgeNavbar.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    if (badgeDrawer) {
        badgeDrawer.textContent = count.toString();
        badgeDrawer.style.display = count > 0 ? 'inline-block' : 'none';
    }

    if (!container) return;
    container.innerHTML = '';

    if (count === 0) {
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
                    <img src="${product.imagen_url || product.imagen || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500'}" class="img-fluid rounded-3 object-fit-cover w-100" style="height: 72px;" alt="${product.nombre}">
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
            const button = e.currentTarget;
            if (button.disabled || button.classList.contains('disabled')) return;
            const productId = parseInt(button.dataset.id);
            const result = state.addToCart(productId);

            if (result.success) {
                if (typeof bootstrap !== 'undefined') {
                    const favOffcanvasEl = document.getElementById('favoritesOffcanvas');
                    if (favOffcanvasEl) {
                        const favOffcanvas = bootstrap.Offcanvas.getInstance(favOffcanvasEl);
                        if (favOffcanvas) favOffcanvas.hide();
                    }
                    renderCartOffcanvas();
                    const cartOffcanvasEl = document.getElementById('cartOffcanvas');
                    if (cartOffcanvasEl) {
                        const cartOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(cartOffcanvasEl);
                        cartOffcanvas.show();
                    }
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

// RENDERIZADO DEL CARRITO (OFFCANVAS)
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
            <div class="foodjet-cart-restaurant card border-0 p-3 mb-2">
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
    } else if (restaurantBanner) {
        restaurantBanner.style.display = 'none';
        restaurantBanner.innerHTML = '';
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
                <img src="${product.imagen_url || product.imagen || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500'}" alt="${product.nombre}" class="rounded-3 me-3 object-fit-cover flex-shrink-0" style="width: 60px; height: 60px;">
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

// Auto-inicialización si el DOM ya está listo
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initHeaderAddress();
            initCatalogSearch();
        });
    } else {
        initHeaderAddress();
        initCatalogSearch();
    }
}

// RENDERIZADO DEL CARRITO (VISTA CHECKOUT)
export function renderCheckoutCart() {
    const cart = state.getCart();
    const checkoutCartItems = document.getElementById('checkoutCartItems') || document.getElementById('checkoutItems');
    const fallbackCheckoutItems = document.getElementById('checkoutItems');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const checkoutDiscount = document.getElementById('checkoutDiscount');
    const checkoutDiscountRow = document.getElementById('checkoutDiscountRow');
    const couponDiscountRate = document.getElementById('couponDiscountRate');
    const studentDiscountRow = document.getElementById('studentDiscountRow');
    const studentDiscountAmount = document.getElementById('studentDiscountAmount');
    const checkoutTax = document.getElementById('checkoutTax') || document.getElementById('checkoutTaxes');
    const checkoutTaxesEl = document.getElementById('checkoutTaxes');
    const checkoutDeliveryFee = document.getElementById('checkoutDeliveryFee') || document.getElementById('checkoutDelivery');
    const checkoutDeliveryEl = document.getElementById('checkoutDelivery');
    const walletAmountDisplay = document.getElementById('walletAmountDisplay');

    if (!checkoutCartItems) return;

    checkoutCartItems.innerHTML = '';
    if (fallbackCheckoutItems && fallbackCheckoutItems !== checkoutCartItems) {
        fallbackCheckoutItems.innerHTML = '';
    }

    if (state.isCartEmpty()) {
        const emptyMsg = '<div class="text-center text-muted py-4">Tu carrito está vacío</div>';
        checkoutCartItems.innerHTML = emptyMsg;
        if (fallbackCheckoutItems && fallbackCheckoutItems !== checkoutCartItems) {
            fallbackCheckoutItems.innerHTML = emptyMsg;
        }
        if (checkoutSubtotal) checkoutSubtotal.textContent = 'S/ 0.00';
        if (checkoutTotal) checkoutTotal.textContent = 'S/ 0.00';
        if (checkoutDiscount) checkoutDiscount.textContent = '-S/ 0.00';
        if (checkoutTax) checkoutTax.textContent = 'S/ 0.00';
        if (checkoutTaxesEl) checkoutTaxesEl.textContent = 'S/ 0.00';
        if (checkoutDeliveryFee) checkoutDeliveryFee.textContent = 'S/ 5.00';
        if (checkoutDeliveryEl) checkoutDeliveryEl.textContent = 'S/ 5.00';
        if (checkoutDiscountRow) checkoutDiscountRow.style.display = 'none';
        if (studentDiscountRow) studentDiscountRow.style.display = 'none';
        if (walletAmountDisplay) walletAmountDisplay.textContent = 'S/ 0.00';
        return;
    }

    let subtotalRegular = 0;
    let subtotalEffective = 0;
    let studentSavings = 0;
    const isStudent = Boolean(window.currentUser && window.currentUser.es_estudiante);

    Object.entries(cart).forEach(([productId, quantity]) => {
        const product = state.getProductById(productId);
        if (!product) return;

        const regularPrice = product.precio;
        let effectivePrice = regularPrice;
        let hasStudentDiscount = false;

        if (isStudent && product.descuento_estudiante > 0) {
            effectivePrice = regularPrice - (regularPrice * (product.descuento_estudiante / 100));
            hasStudentDiscount = true;
        }

        const regularItemTotal = regularPrice * quantity;
        const effectiveItemTotal = effectivePrice * quantity;

        subtotalRegular += regularItemTotal;
        subtotalEffective += effectiveItemTotal;
        if (hasStudentDiscount) {
            studentSavings += (regularItemTotal - effectiveItemTotal);
        }

        const itemRow = document.createElement('div');
        itemRow.className = 'd-flex justify-content-between align-items-center py-2 border-bottom';
        itemRow.innerHTML = `
            <div class="d-flex align-items-center flex-grow-1 min-w-0 me-3">
                <img src="${product.imagen_url || product.imagen || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500'}" alt="${product.nombre}" class="rounded-3 me-3 object-fit-cover flex-shrink-0" style="width: 50px; height: 50px;">
                <div class="min-w-0">
                    <h6 class="my-0 fw-bold text-truncate" style="font-size: 0.95rem;">${product.nombre}</h6>
                    <small class="text-muted d-block">${getProductRestaurant(product)?.nombre || 'Restaurante'} · <span class="badge bg-secondary-subtle text-dark rounded-pill">x${quantity}</span></small>
                    ${hasStudentDiscount ? '<small class="text-success fw-semibold"><i class="bi bi-mortarboard-fill me-1"></i>Precio estudiante</small>' : ''}
                </div>
            </div>
            <span class="fw-bold flex-shrink-0 text-nowrap">S/ ${effectiveItemTotal.toFixed(2)}</span>
        `;
        checkoutCartItems.appendChild(itemRow);
        if (fallbackCheckoutItems && fallbackCheckoutItems !== checkoutCartItems) {
            fallbackCheckoutItems.appendChild(itemRow.cloneNode(true));
        }
    });

    // Student Discount Row
    if (studentDiscountRow) {
        if (isStudent && studentSavings > 0) {
            studentDiscountRow.style.display = 'flex';
            if (studentDiscountAmount) studentDiscountAmount.textContent = `-S/ ${studentSavings.toFixed(2)}`;
        } else {
            studentDiscountRow.style.display = 'none';
        }
    }

    // Coupon Discount
    const activeCoupon = state.getActiveCoupon();
    let couponDiscount = 0;

    if (activeCoupon) {
        if (activeCoupon.tipo === 'porcentaje') {
            couponDiscount = subtotalEffective * (activeCoupon.valor / 100);
        } else if (activeCoupon.tipo === 'fijo') {
            couponDiscount = activeCoupon.valor;
        }

        if (checkoutDiscountRow) {
            checkoutDiscountRow.style.display = couponDiscount > 0 ? 'flex' : 'none';
            if (checkoutDiscount) checkoutDiscount.textContent = `-S/ ${couponDiscount.toFixed(2)}`;
            if (couponDiscountRate) couponDiscountRate.textContent = `${activeCoupon.valor}%`;
        }
    } else {
        if (checkoutDiscountRow) checkoutDiscountRow.style.display = 'none';
    }

    // Financial calculations matching backend orderController.js
    const subtotalAfterCoupon = Math.max(0, subtotalEffective - couponDiscount);
    const taxRate = 0.18; // 18% IGV (Perú)
    const tax = subtotalAfterCoupon * taxRate;
    const deliveryFee = 5.00; // Tarifa fija de entrega
    const total = subtotalAfterCoupon + tax + deliveryFee;

    if (checkoutSubtotal) checkoutSubtotal.textContent = `S/ ${subtotalEffective.toFixed(2)}`;
    if (checkoutTax) checkoutTax.textContent = `S/ ${tax.toFixed(2)}`;
    if (checkoutTaxesEl) checkoutTaxesEl.textContent = `S/ ${tax.toFixed(2)}`;
    if (checkoutDeliveryFee) checkoutDeliveryFee.textContent = `S/ ${deliveryFee.toFixed(2)}`;
    if (checkoutDeliveryEl) checkoutDeliveryEl.textContent = `S/ ${deliveryFee.toFixed(2)}`;
    if (checkoutTotal) checkoutTotal.textContent = `S/ ${total.toFixed(2)}`;
    if (walletAmountDisplay) walletAmountDisplay.textContent = `S/ ${total.toFixed(2)}`;
}

export function renderCheckoutSummary() {
    renderCheckoutCart();
}

export async function fillCheckoutUserData() {
    const user = window.currentUser;
    const customerName = document.getElementById('customerName');
    const customerPhone = document.getElementById('customerPhone');

    if (customerName && user?.nombre) {
        customerName.value = user.nombre;
    }

    if (customerPhone && user?.telefono) {
        customerPhone.value = user.telefono;
    }

    // Populate saved addresses if available
    const container = document.getElementById('savedAddressesContainer');
    const list = document.getElementById('savedAddressesList');
    if (container && list && window.authToken) {
        try {
            const addresses = await api.fetchMyAddressesAPI(window.authToken);
            if (Array.isArray(addresses) && addresses.length > 0) {
                list.innerHTML = '';
                container.hidden = false;
                addresses.forEach((addr, idx) => {
                    const chip = document.createElement('button');
                    chip.type = 'button';
                    chip.className = 'saved-address-chip' + (idx === 0 ? ' saved-address-chip--selected' : '');
                    chip.dataset.id = addr.id;
                    chip.innerHTML = `<i class="bi bi-house-door-fill me-1" aria-hidden="true"></i><span class="text-truncate">${addr.direccion_detallada}</span>`;
                    chip.addEventListener('click', () => {
                        list.querySelectorAll('.saved-address-chip').forEach(c => c.classList.remove('saved-address-chip--selected'));
                        chip.classList.add('saved-address-chip--selected');
                        const addrInput = document.getElementById('customerAddress');
                        const refInput = document.getElementById('customerReference');
                        if (addrInput) addrInput.value = addr.direccion_detallada;
                        if (refInput && addr.referencia) refInput.value = addr.referencia;
                        if (addr.latitud && addr.longitud && window.FoodJetMapas?.moverMapa) {
                            window.FoodJetMapas.moverMapa({ lat: addr.latitud, lng: addr.longitud });
                        }
                    });
                    list.appendChild(chip);
                });
            } else {
                container.hidden = true;
            }
        } catch {
            container.hidden = true;
        }
    }
}

export function requestUserLocation() {
    const addressInput = document.getElementById('customerAddress');
    if (!addressInput || addressInput.value.trim()) return;

    if (!navigator.geolocation) {
        showToast('Geolocalización no soportada por el navegador.', 'warning');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
                const data = await response.json();

                if (data && data.display_name) {
                    addressInput.value = data.display_name;
                    // Se conservan para guardarlas junto con la dirección.
                    addressInput.dataset.lat = lat;
                    addressInput.dataset.lon = lon;
                } else {
                    showToast('No se pudo determinar la dirección de la ubicación actual.', 'warning');
                }
            } catch (error) {
                console.error("Error fetching address:", error);
                showToast('Error al obtener la dirección.', 'warning');
            }
        },
        (error) => {
            console.error("Error getting location:", error);
        }
    );
}

const CAMPOS_TARJETA = {
    numero: 'cardNumber',
    expiracion: 'cardExpiry',
    cvc: 'cardCvc'
};

/** Quita la marca de error de un campo concreto. */
export function clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.classList.remove('is-invalid');
    const feedback = document.getElementById(`${inputId}Error`);
    if (feedback) feedback.textContent = '';
}

/**
 * Marca los campos inválidos de la tarjeta y lleva el foco al primero.
 * Mover el foco es lo que hace que el error sea perceptible para quien navega
 * con teclado o lector de pantalla (WCAG 3.3.1 y 3.3.3).
 */
export function showCardErrors(errors = {}) {
    let primerInvalido = null;

    Object.entries(CAMPOS_TARJETA).forEach(([clave, inputId]) => {
        const input = document.getElementById(inputId);
        const feedback = document.getElementById(`${inputId}Error`);
        const mensaje = errors[clave];

        if (!input) return;

        input.classList.toggle('is-invalid', Boolean(mensaje));
        if (feedback) feedback.textContent = mensaje || '';

        if (mensaje && !primerInvalido) primerInvalido = input;
    });

    primerInvalido?.focus();
}

/** Simula la autorización con el banco. No viaja ningún dato de la tarjeta. */
export function runCardAuthorization(marca, duracionMs = 2500) {
    return new Promise((resolve) => {
        const modalElement = document.getElementById('cardAuthModal');

        if (!modalElement) {
            setTimeout(resolve, duracionMs);
            return;
        }

        const etiquetas = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express' };
        const detalle = document.getElementById('cardAuthBrand');
        if (detalle) detalle.textContent = etiquetas[marca] ? `Tarjeta ${etiquetas[marca]}` : '';

        // eslint-disable-next-line no-undef
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

        modalElement.addEventListener('hidden.bs.modal', () => resolve(), { once: true });
        modal.show();

        setTimeout(() => modal.hide(), duracionMs);
    });
}

export function toggleCardDetails() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash';

    document.querySelectorAll('.payment-option').forEach(option => {
        const input = option.querySelector('input[type="radio"]');
        const tile = option.querySelector('.foodjet-payment-tile');
        if (input && tile) {
            tile.classList.toggle('is-selected', input.checked);
        }
    });

    const cashInfo = document.getElementById('paymentCashInfo');
    const walletInfo = document.getElementById('paymentWalletInfo');
    const cardDetails = document.getElementById('cardDetails');
    const confirmBtnText = document.getElementById('confirmOrderText');

    if (cashInfo) cashInfo.style.display = selectedMethod === 'cash' ? 'block' : 'none';
    if (walletInfo) walletInfo.style.display = selectedMethod === 'wallet' ? 'block' : 'none';
    if (cardDetails) cardDetails.style.display = selectedMethod === 'card' ? 'block' : 'none';

    if (confirmBtnText) {
        confirmBtnText.textContent = selectedMethod === 'wallet' ? 'Pagar con QR' : 'Confirmar Pedido';
    }
}


// RENDERIZADO DEL HISTORIAL DE PEDIDOS (CON PAGINACIÓN)
export async function renderOrderHistory() {
    if (!window.authToken) return;

    const container = document.getElementById('orderHistoryContainer');
    if (!container) return;

    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando pedidos...</p></div>';

    try {
        const orders = await api.fetchMyOrdersAPI(window.authToken);

        if (!Array.isArray(orders)) {
            console.error("El backend no devolvió una lista, devolvió esto:", orders);
            container.innerHTML = '<div class="alert alert-danger">Error: El formato de los datos del servidor es incorrecto. Revisa F12.</div>';
            return;
        }

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5 foodjet-card p-5">
                    <i class="bi bi-bag-x fs-1 text-secondary mb-3 d-block" aria-hidden="true"></i>
                    <h5 class="fw-bold text-dark">No tienes pedidos anteriores</h5>
                    <p class="text-secondary small mb-3">Tus pedidos confirmados y entregados aparecerán aquí.</p>
                    <button class="btn foodjet-btn-primary rounded-pill px-4" onclick="window.ui.showView('homeView')">Empezar a pedir</button>
                </div>`;
            return;
        }

        // --- CONFIGURACIÓN DE PAGINACIÓN ---
        const itemsPerPage = 10;
        const totalPages = Math.ceil(orders.length / itemsPerPage);

        // Función interna para dibujar una página específica
        const renderPage = (page) => {
            container.innerHTML = ''; // Limpiar contenedor
            
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedOrders = orders.slice(startIndex, endIndex);

            // Dibujar las tarjetas de esta página
            paginatedOrders.forEach(order => {
                // El modelo guarda 'fecha'; 'fecha_creacion' no existe, así que
                // antes todos los pedidos aparecían con la fecha de hoy.
                const date = order.fecha ? new Date(order.fecha).toLocaleDateString('es-PE', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
                }) : 'Fecha desconocida';

                const badge = getEstadoBadge(order.estado);
                const statusColor = badge.color;
                const statusIcon = badge.icon;
                const estadoStr = normalizeEstado(order.estado) || 'pendiente';

                // Reseñas
                // Al seguimiento solo se llegaba justo despues de comprar: si el
                // usuario salia de la vista, no habia forma de volver. Desde aqui
                // puede retomar el de cualquier pedido que siga en curso.
                const seguimientoHtml = isTerminal(estadoStr)
                    ? ''
                    : `
                        <button class="btn btn-sm foodjet-btn-primary mt-3 me-2 btn-ver-seguimiento px-3 py-2"
                            data-order-id="${order.id}">
                            <i class="bi bi-geo-alt-fill me-1" aria-hidden="true"></i>Ver seguimiento
                        </button>
                    `;

                let reviewHtml = '';
                // La relación se llama Review y es uno a uno: 'reviews' no existe,
                // así que el botón salía incluso en pedidos ya reseñados.
                const resena = order.Review || (Array.isArray(order.reviews) ? order.reviews[0] : null);

                if (estadoStr === 'entregado' && !resena) {
                    reviewHtml = `
                        <button class="btn btn-sm btn-outline-warning foodjet-btn-pill mt-3 btn-leave-review px-3 py-2"
                            data-bs-toggle="modal" data-bs-target="#reviewModal"
                            data-order-id="${order.id}"
                            data-restaurant-name="${order.Restaurant?.nombre || 'Restaurante'}"
                            data-order-date="${date}">
                            <i class="bi bi-star-fill me-1" aria-hidden="true"></i>Dejar una Reseña
                        </button>
                    `;
                } else if (resena) {
                    const r = resena;
                    let stars = '';
                    for(let i=1; i<=5; i++) {
                        stars += `<i class="bi bi-star${i<=r.puntuacion?'-fill text-warning':''} me-1" aria-hidden="true"></i>`;
                    }
                    reviewHtml = `
                        <div class="foodjet-review-badge-card mt-3">
                            <div class="d-flex align-items-center mb-1">
                                <span class="badge bg-warning text-dark me-2">Tu reseña</span>
                                ${stars}
                            </div>
                            <p class="mb-0 text-secondary small fst-italic">"${r.comentario || 'Sin comentario'}"</p>
                        </div>
                    `;
                }

                // Prisma devuelve la relación como OrderItem; 'items' no existe, y
                // por eso el historial siempre decía "No hay detalles de artículos".
                const itemsArray = order.OrderItem || order.items || [];
                const itemsHtml = itemsArray.map(item => {
                    const nombreProd = item.producto?.nombre || item.Product?.nombre || item.Producto?.nombre || 'Producto Desconocido';
                    const precioStr = item.precio_unitario || item.precio || 0;
                    return `
                        <li class="d-flex justify-content-between align-items-center mb-2">
                            <span>
                                <span class="badge rounded-pill bg-light text-dark border me-2">${item.cantidad || 1}x</span>
                                <span class="text-dark">${nombreProd}</span>
                            </span>
                            <span class="text-secondary fw-medium">S/ ${Number(precioStr).toFixed(2)}</span>
                        </li>
                    `;
                }).join('');

                const card = document.createElement('div');
                card.className = 'card foodjet-card foodjet-order-card mb-4';
                card.innerHTML = `
                    <div class="foodjet-order-card-header d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 p-md-4 border-bottom">
                        <div>
                            <span class="fw-bold fs-6" style="color: var(--color-primary-dark);">Pedido #FJ${String(order.id || 0).padStart(4, '0')}</span>
                            <small class="text-secondary d-block mt-1"><i class="bi bi-calendar3 me-1" aria-hidden="true"></i>${date}</small>
                        </div>
                        <span class="foodjet-status-badge foodjet-status-badge--${estadoStr}">
                            <i class="bi ${statusIcon} me-1" aria-hidden="true"></i>${badge.label.toUpperCase()}
                        </span>
                    </div>
                    <div class="card-body p-3 p-md-4">
                        <div class="row g-4">
                            <div class="col-12 col-md-7 col-lg-8">
                                <h6 class="fw-bold mb-3 text-secondary text-uppercase small letter-spacing-1">Artículos</h6>
                                <ul class="list-unstyled mb-0">
                                    ${itemsHtml || '<li class="text-muted">No hay detalles de artículos</li>'}
                                </ul>
                            </div>
                            <div class="col-12 col-md-5 col-lg-4 border-start-md ps-md-4">
                                <h6 class="fw-bold mb-3 text-secondary text-uppercase small letter-spacing-1">Resumen</h6>
                                <div class="d-flex justify-content-between small text-secondary mb-1">
                                    <span>Restaurante</span>
                                    <span class="fw-medium text-dark">${order.Restaurant?.nombre || '-'}</span>
                                </div>
                                <div class="d-flex justify-content-between small text-secondary mb-1">
                                    <span>Método de pago</span>
                                    <span class="fw-medium text-dark">${etiquetaMetodoPago(order.Transaction?.metodo_pago)}</span>
                                </div>
                                <div class="d-flex justify-content-between small text-secondary mb-1">
                                    <span>Estado del pago</span>
                                    <span class="fw-medium text-dark">${etiquetaEstadoPago(order.Transaction?.estado_pago)}</span>
                                </div>
                                <hr class="my-2 border-subtle">
                                <div class="d-flex justify-content-between small text-secondary mb-1">
                                    <span>Subtotal</span>
                                    <span>S/ ${deriveSubtotal(order).toFixed(2)}</span>
                                </div>
                                <div class="d-flex justify-content-between small text-secondary mb-1">
                                    <span>IGV (18%)</span>
                                    <span>S/ ${Number(order.impuestos || 0).toFixed(2)}</span>
                                </div>
                                <div class="d-flex justify-content-between small text-secondary mb-1">
                                    <span>Envío</span>
                                    <span>S/ ${Number(order.costo_envio || 0).toFixed(2)}</span>
                                </div>
                                ${(parseFloat(order.descuento) > 0) ? `
                                    <div class="d-flex justify-content-between small text-success fw-medium mb-1">
                                        <span>Descuento</span>
                                        <span>-S/ ${order.descuento}</span>
                                    </div>
                                ` : ''}
                                <hr class="my-2 border-subtle">
                                <div class="d-flex justify-content-between fw-bold fs-5 text-dark mt-2">
                                    <span>Total</span>
                                    <span style="color: var(--color-primary-dark);">S/ ${Number(order.total || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 pt-2 border-top">
                            ${seguimientoHtml}${reviewHtml}
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

            // Controles de Paginación (solo se muestran si hay más de 1 página)
            if (totalPages > 1) {
                const paginationNav = document.createElement('nav');
                paginationNav.className = 'w-100 mt-4 d-flex justify-content-center';
                
                let paginationHtml = '<ul class="pagination">';
                
                // Botón Anterior
                paginationHtml += `
                    <li class="page-item ${page === 1 ? 'disabled' : ''}">
                        <a class="page-link pagination-btn" href="#" data-page="${page - 1}">Anterior</a>
                    </li>
                `;
                
                // Números de página
                for (let i = 1; i <= totalPages; i++) {
                    paginationHtml += `
                        <li class="page-item ${page === i ? 'active' : ''}">
                            <a class="page-link pagination-btn" href="#" data-page="${i}">${i}</a>
                        </li>
                    `;
                }
                
                // Botón Siguiente
                paginationHtml += `
                    <li class="page-item ${page === totalPages ? 'disabled' : ''}">
                        <a class="page-link pagination-btn" href="#" data-page="${page + 1}">Siguiente</a>
                    </li>
                `;
                
                paginationHtml += '</ul>';
                paginationNav.innerHTML = paginationHtml;
                container.appendChild(paginationNav);

                // Escuchar clics en los botones de paginación
                document.querySelectorAll('.pagination-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const newPage = parseInt(e.target.dataset.page);
                        if (newPage >= 1 && newPage <= totalPages) {
                            renderPage(newPage);
                            // Scroll suave hacia arriba para ver los nuevos resultados
                            document.getElementById('orderHistoryView').scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                });
            }

            document.querySelectorAll('.btn-ver-seguimiento').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const orderId = Number(e.currentTarget.dataset.orderId);
                    const pedido = orders.find((o) => o.id === orderId);
                    if (!pedido) return;

                    showView('trackingView');
                    startOrderTracking(pedido.Transaction?.metodo_pago, pedido);
                });
            });

            // Asignar order ID al modal de reseñas para los elementos de esta página
            document.querySelectorAll('.btn-leave-review').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const orderId = e.currentTarget.dataset.orderId;
                    const form = document.getElementById('reviewForm');
                    if(form) form.dataset.orderId = orderId;

                    document.querySelectorAll('.star-rating i').forEach((s) => {
                        s.classList.replace('bi-star-fill', 'bi-star');
                    });
                    if(form) form.reset();
                });
            });
        };

        // Iniciar dibujando la página 1
        renderPage(1);

    } catch (error) {
        console.error("================ ERROR AL DIBUJAR HISTORIAL ================");
        console.error(error);
        container.innerHTML = '<div class="alert alert-danger">Error al cargar el historial de pedidos. Por favor presiona F12 y revisa la pestaña Consola.</div>';
    }
}
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

// ==========================================
// SEGUIMIENTO DE PEDIDOS (VERSIÓN DEFINITIVA)
// ==========================================
// ==========================================
// SEGUIMIENTO DEL PEDIDO EN TIEMPO REAL
// ==========================================

const POLL_MS = 4000;
const MAX_FALLOS = 5;

let trackingIntervalId = null;
let trackingOrderId = null;
let trackingFallos = 0;

/** Pinta los datos del pedido que no cambian mientras avanza la entrega. */
function renderOrderDetails(orderData, paymentMethod) {
    const set = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    };

    const metodos = { card: 'Tarjeta', cash: 'Efectivo', wallet: 'Billetera Digital' };

    set('orderNumber', `#FJ${String(orderData?.id || '0000').padStart(4, '0')}`);
    set('orderPayment', metodos[paymentMethod] || paymentMethod || '-');

    // El modelo tiene 'fecha'; 'fecha_creacion' no existe.
    const fecha = orderData?.fecha ? new Date(orderData.fecha) : new Date();
    set('orderDate', fecha.toLocaleDateString('es-PE'));

    set('orderSubtotal', `S/ ${deriveSubtotal(orderData).toFixed(2)}`);
    set('orderTaxes', `S/ ${(Number(orderData?.impuestos) || 0).toFixed(2)}`);
    set('orderDelivery', `S/ ${(Number(orderData?.costo_envio) || 0).toFixed(2)}`);
    set('orderTotalFinal', `S/ ${(Number(orderData?.total) || 0).toFixed(2)}`);
}

const formatoHora = new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit' });

/** Diferencia entre el reloj del servidor y el del navegador. */
let desfaseServidorMs = 0;

/**
 * Actualiza el indicador de conexión en vivo con su badge correspondiente.
 * @param {'live'|'reconnecting'|'disconnected'} status
 * @param {string} [message]
 */
export function updateLiveIndicator(status, message) {
    const indicator = document.getElementById('liveIndicator');
    const textEl = document.getElementById('liveIndicatorText');
    if (!indicator) return;

    indicator.classList.remove(
        'foodjet-badge--live',
        'foodjet-badge--reconnecting',
        'foodjet-badge--disconnected'
    );

    if (status === 'live') {
        indicator.classList.add('foodjet-badge--live');
        indicator.setAttribute('aria-label', 'Conexión activa: actualizando en vivo');
        if (textEl) textEl.textContent = message || 'Actualizando en vivo';
    } else if (status === 'reconnecting') {
        indicator.classList.add('foodjet-badge--reconnecting');
        indicator.setAttribute('aria-label', 'Problema de red: reconectando');
        if (textEl) textEl.textContent = message || 'Reconectando…';
    } else if (status === 'disconnected') {
        indicator.classList.add('foodjet-badge--disconnected');
        indicator.setAttribute('aria-label', 'Desconectado: no se pudo actualizar');
        if (textEl) textEl.textContent = message || 'Sin conexión';
    }
}

/**
 * Vuelca el modelo de vista sobre la cabecera y la línea de tiempo.
 *
 * @param {Object} vm Modelo de getTrackingViewModel (títulos e iconos).
 * @param {Object} [pedido] Pedido completo de la API: de su historial y su
 *        plan salen las horas de cada etapa. Sin él, solo se marcan etapas.
 */
function applyTrackingViewModel(vm, pedido = null) {
    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    const statusDesc = document.getElementById('statusDescription');
    const trackingHeadline = document.getElementById('trackingHeadline');
    const trackingSubtitle = document.getElementById('trackingSubtitle');
    const cancelBtn = document.getElementById('cancelOrderBtn');

    // Dynamic Headline & Subtitle
    if (trackingHeadline) {
        trackingHeadline.textContent = vm.estado === 'en_camino'
            ? '¡Tu antojo va volando!'
            : (vm.terminal ? (vm.cancelled ? 'Pedido cancelado' : '¡Pedido entregado!') : 'Sigue tu pedido');
    }
    if (trackingSubtitle && pedido?.id) {
        trackingSubtitle.textContent = `Pedido #FJ${String(pedido.id).padStart(4, '0')} · Sigue cada parte del viaje en tiempo real.`;
    }

    // Cancel Order Button Visibility
    if (cancelBtn) {
        const cancelable = ['pendiente', 'confirmado'].includes(vm.estado);
        cancelBtn.style.display = cancelable ? 'inline-flex' : 'none';
        cancelBtn.dataset.orderId = pedido?.id || '';
    }

    if (statusIcon) {
        const color = vm.cancelled ? 'text-danger' : (vm.terminal ? 'text-success' : 'text-primary');
        statusIcon.innerHTML = `<i class="bi ${vm.iconClass} fs-2 ${color}" aria-hidden="true"></i>`;
        statusIcon.classList.toggle('delivered', vm.terminal);
    }
    if (statusTitle) statusTitle.textContent = vm.title;
    if (statusDesc) statusDesc.textContent = vm.description;

    const ahora = Date.now() + desfaseServidorMs;
    const linea = lineaDeTiempo({ estado: vm.estado, ...(pedido || {}) }, ahora);

    pintarLlegada(vm, linea, ahora);

    linea.etapas.forEach((etapa, i) => {
        const paso = document.getElementById(`step${i + 1}`);
        if (!paso) return;

        paso.dataset.situacion = etapa.situacion;
        if (etapa.situacion === 'en_curso') {
            paso.setAttribute('aria-current', 'step');
        } else {
            paso.removeAttribute('aria-current');
        }

        const marca = paso.querySelector('.linea-tiempo__marca');
        if (marca) {
            const icono = etapa.situacion === 'hecha' ? 'bi-check-lg' : ICONOS_ETAPA[i];
            marca.innerHTML = `<i class="bi ${icono}"></i>`;
        }

        const hora = document.getElementById(`stepTime${i + 1}`);
        if (hora) {
            hora.innerHTML = etapa.hora === null ? '' : `<time datetime="${new Date(etapa.hora).toISOString()}">${
                etapa.estimada ? 'aprox. ' : ''}${formatoHora.format(etapa.hora)}</time>`;
        }
    });
}

/** La cifra grande: cuánto falta para que llegue el pedido. */
function pintarLlegada(vm, linea, ahora) {
    const bloque = document.getElementById('estimatedTime');
    const cifra = document.getElementById('etaValue');
    const texto = document.getElementById('etaText');
    if (!bloque || !cifra || !texto) return;

    if (vm.terminal) {
        bloque.hidden = true;
        return;
    }

    bloque.hidden = false;
    if (linea.llegada) {
        cifra.textContent = formatearRestante(linea.llegada.hora - ahora);
        texto.textContent = `Llegada aprox. ${formatoHora.format(linea.llegada.hora)}`;
    } else {
        // Pedidos sin plan de tiempos: queda la estimación genérica.
        cifra.textContent = '';
        texto.textContent = vm.etaText;
    }
}

const ICONOS_ETAPA = ['bi-hourglass-split', 'bi-box-seam', 'bi-bicycle', 'bi-house-door'];

function setConnectionNotice(texto) {
    const el = document.getElementById('trackingConnection');
    if (el) el.textContent = texto;
}

/** Consulta el estado actual del pedido y refleja el resultado en pantalla. */
async function pollOnce() {
    if (!trackingOrderId) return;

    const resultado = await api.fetchOrderByIdAPI(trackingOrderId, window.authToken);

    if (!resultado.ok) {
        trackingFallos += 1;
        updateLiveIndicator('reconnecting', 'Reconectando…');
        setConnectionNotice('Sin conexión con el servidor, reintentando…');

        if (trackingFallos >= MAX_FALLOS) {
            updateLiveIndicator('disconnected', 'Sin conexión');
            setConnectionNotice('No se pudo actualizar el estado del pedido.');
            stopOrderTracking();
        }
        return;
    }

    trackingFallos = 0;
    updateLiveIndicator('live', 'Actualizando en vivo');
    setConnectionNotice('');

    const pedido = resultado.data;
    if (pedido.servidor_ahora) {
        desfaseServidorMs = new Date(pedido.servidor_ahora).getTime() - Date.now();
    }

    const vm = getTrackingViewModel(pedido.estado);
    applyTrackingViewModel(vm, pedido);

    const config = await api.fetchConfigAPI();
    const mapKeys = config.googleMapsApiKeys?.length ? config.googleMapsApiKeys : config.googleMapsApiKey;
    mostrarMapaSeguimiento(pedido, mapKeys);

    if (vm.terminal) {
        updateLiveIndicator('live', vm.cancelled ? 'Cancelado' : 'Entregado');
        showToast(
            vm.cancelled ? '❌ Tu pedido fue cancelado.' : '✅ ¡Tu pedido ha sido entregado! Buen provecho.',
            vm.cancelled ? 'warning' : 'success'
        );
        stopOrderTracking();
    }
}

export async function pollTrackingOnce() {
    return pollOnce();
}

/**
 * Arranca el seguimiento de un pedido.
 *
 * Antes esto era una animación: dos setTimeout que movían los iconos a los 10
 * y 20 segundos sin consultar nada. Ahora sondea el estado real del pedido
 * contra la API, de modo que la línea de tiempo refleja lo que de verdad está
 * pasando con la entrega.
 */
export function startOrderTracking(paymentMethod, orderData) {
    renderOrderDetails(orderData, paymentMethod);
    applyTrackingViewModel(getTrackingViewModel(orderData?.estado), orderData);
    updateLiveIndicator('live', 'Actualizando en vivo');

    stopOrderTracking();

    trackingOrderId = orderData?.id;
    trackingFallos = 0;

    if (!trackingOrderId) return;

    pollOnce();
    trackingIntervalId = setInterval(pollOnce, POLL_MS);
}

/** Detiene el sondeo. Es idempotente: se puede llamar siempre. */
export function stopOrderTracking() {
    detenerMapaSeguimiento();
    if (trackingIntervalId !== null) {
        clearInterval(trackingIntervalId);
        trackingIntervalId = null;
    }
    trackingOrderId = null;
    trackingFallos = 0;
}

// No tiene sentido seguir preguntando por el pedido con la pestaña oculta.
// El guard permite importar este módulo desde Node (las pruebas) sin DOM.
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (trackingIntervalId !== null) {
                clearInterval(trackingIntervalId);
                trackingIntervalId = null;
            }
        } else if (trackingOrderId && trackingIntervalId === null) {
            pollOnce();
            trackingIntervalId = setInterval(pollOnce, POLL_MS);
        }
    });
}

