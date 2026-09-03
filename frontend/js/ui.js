import * as state from './state.js';
import * as api from './api.js';
import {
    getTrackingViewModel,
    normalizeEstado,
    isLineCompleted,
    getEstadoBadge,
    deriveSubtotal,
    ETAPAS
} from './domain/orderStatus.js';

// ==========================================
// HELPERS DE PRECIO Y DESCUENTO
// ==========================================

// Función pura de cálculo
function calculateStudentPrice(product, user) {
    let finalPrice = product.precio;
    let hasDiscount = false;

    if (
        user &&
        user.es_estudiante &&
        product.descuento_estudiante > 0
    ) {
        finalPrice =
            product.precio -
            (product.precio * (product.descuento_estudiante / 100));

        hasDiscount = true;
    }

    return {
        originalPrice: product.precio,
        finalPrice,
        hasDiscount
    };
}

// Función de presentación UI
function renderProductPrice(product, user) {
    const priceData = calculateStudentPrice(product, user);

    if (priceData.hasDiscount) {
        return `
            <span class="text-decoration-line-through text-muted fs-6">
                S/ ${priceData.originalPrice.toFixed(2)}
            </span>
            <span class="text-success fw-bold ms-2">
                S/ ${priceData.finalPrice.toFixed(2)}
            </span>
        `;
    }

    return `S/ ${priceData.originalPrice.toFixed(2)}`;
}


// ==========================================
// HELPERS DE FILTRADO
// ==========================================

// Función auxiliar para parsear tiempo de entrega
function parseDeliveryTime(tiempoStr) {
    if (!tiempoStr) return 999999;

    if (tiempoStr.includes("30")) return 30;

    if (
        tiempoStr.includes("1 hora") &&
        !tiempoStr.includes("Más")
    ) {
        return 60;
    }

    if (tiempoStr.includes("Más de 1 hora")) {
        return 90;
    }

    return parseInt(tiempoStr) || 0;
}


// Función principal de filtrado
function filterProducts(
    products,
    minPrice,
    maxPrice,
    maxTime,
    selectedCategories
) {
    return products.filter(product => {

        const matchesPrice =
            product.precio >= minPrice &&
            product.precio <= maxPrice;

        const productTime = parseDeliveryTime(
            product.Restaurant?.tiempo_entrega
        );

        const matchesTime = productTime <= maxTime;

        const categoryName =
            product.categoria?.nombre ||
            product.tipo_comida;

        const matchesCategory =
            selectedCategories.length === 0 ||
            selectedCategories.includes(categoryName);

        return (
            matchesPrice &&
            matchesTime &&
            matchesCategory
        );
    });
}


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
    }

    // Sin esto el sondeo del pedido seguiría corriendo para siempre en
    // segundo plano, y se acumularía uno nuevo con cada pedido.
    if (viewToShowId !== 'trackingView') {
        stopOrderTracking();
    }
}

// RENDERIZADO DE PRODUCTOS EN EL INICIO
export function renderProducts() {
    const products = state.getProducts();
    const menuContainer = document.getElementById('productsGrid');
    if (!menuContainer) return;

    menuContainer.innerHTML = '';

    const minPriceInput = document.getElementById('filter-price-min');
    const maxPriceInput = document.getElementById('filter-price-max');
    const timeFilterInput = document.querySelector('input[name="deliveryTimeFilter"]:checked');
    const foodTypeCheckboxes = document.querySelectorAll('.filter-food-type:checked');

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

    const filteredProducts = filterProducts(
    products,
    minPrice,
    maxPrice,
    maxTime,
    selectedCategories
    );

    if (filteredProducts.length === 0) {
        menuContainer.innerHTML = '<p class="col-12 text-center text-muted">No se encontraron productos con los filtros seleccionados.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const isFav = state.isFavorite(product.id);
        const iconClass = isFav ? 'bi-heart-fill text-danger' : 'bi-heart text-muted';

        const priceHtml = renderProductPrice(product, window.currentUser);

        const btnClass = product.disponibilidad ? 'btn-primary' : 'btn-secondary disabled';
        const btnText = product.disponibilidad ? 'Agregar' : 'Agotado';

        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        col.innerHTML = `
            <div class="card product-card h-100 shadow-sm border-0">
                <div class="position-absolute top-0 end-0 p-2">
                    <button class="btn btn-sm btn-light rounded-circle shadow-sm favorite-toggle" data-id="${product.id}" aria-label="Marcar como favorito">
                        <i class="bi ${iconClass}"></i>
                    </button>
                </div>
                <img src="${product.imagen_url}" class="card-img-top" alt="${product.nombre}" style="height: 200px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0 fw-bold">${product.nombre}</h5>
                        <span class="badge bg-light text-dark shadow-sm border"><i class="bi bi-clock me-1"></i>${product.Restaurant.tiempo_entrega} min</span>
                    </div>
                    <p class="card-text text-muted small flex-grow-1">${product.descripcion || 'Delicioso plato preparado con los mejores ingredientes.'}</p>
                    <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                        <div class="price-container">
                            <span class="fs-5 fw-bold text-dark">${priceHtml}</span>
                        </div>
                        <button class="btn ${btnClass} btn-sm add-to-cart px-3 rounded-pill" data-id="${product.id}">
                            ${btnText}
                        </button>
                    </div>
                </div>
            </div>
        `;
        menuContainer.appendChild(col);
    });

    // Event listeners para 'add to cart'
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            if (e.target.classList.contains('disabled')) return;
            const productId = parseInt(e.target.dataset.id);
            const result = state.addToCart(productId);
            if (result.success) {
                renderCartOffcanvas();
                // eslint-disable-next-line no-undef
                const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
                cartOffcanvas.show();
            } else {
                if (result.error === 'DIFFERENT_RESTAURANT') {
                    showToast('Solo puedes agregar productos de un mismo restaurante al pedido.', 'warning');
                } else if (result.error === 'UNAVAILABLE') {
                    showToast('Este producto no está disponible.', 'warning');
                }
            }
        });
    });

    // Event listeners para favoritos
    document.querySelectorAll('.favorite-toggle').forEach(button => {
        button.addEventListener('click', async (e) => {
            if (!window.authToken) {
                showToast('Inicia sesión para guardar favoritos', 'warning');
                // eslint-disable-next-line no-undef
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
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
                // Revertir estado si falló
                if (window.app && window.app.loadFavorites) {
                    window.app.loadFavorites();
                }
            } else {
                if (window.app && window.app.loadFavorites) {
                    window.app.loadFavorites();
                }
                if(result.data.isFavorite) {
                    showToast('Añadido a favoritos');
                } else {
                    showToast('Eliminado de favoritos');
                }
            }
        });
    });
}

// RENDERIZADO DEL OFFCANVAS DE FAVORITOS
export function renderFavoritesOffcanvas() {
    const favorites = state.getFavorites();
    const container = document.getElementById('favoritesItemsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted p-4">
                <i class="bi bi-heart fs-1 mb-3 d-block"></i>
                <p>No tienes productos favoritos aún.</p>
                <button type="button" class="btn btn-outline-primary btn-sm mt-2" data-bs-dismiss="offcanvas">Explorar el menú</button>
            </div>`;
        return;
    }

    favorites.forEach(product => {
        const item = document.createElement('div');
        item.className = 'card mb-3 shadow-sm border-0';
        item.innerHTML = `
            <div class="row g-0 align-items-center">
                <div class="col-4">
                    <img src="${product.imagen_url}" class="img-fluid rounded-start h-100 object-fit-cover" alt="${product.nombre}">
                </div>
                <div class="col-8">
                    <div class="card-body py-2 px-3 position-relative">
                        <button class="btn btn-sm btn-link text-danger position-absolute top-0 end-0 p-1 remove-favorite" data-id="${product.id}">
                            <i class="bi bi-x-circle-fill"></i>
                        </button>
                        <h6 class="card-title fw-bold mb-1 pe-4 text-truncate">${product.nombre}</h6>
                        <p class="card-text text-success fw-bold mb-2 small">S/ ${product.precio.toFixed(2)}</p>
                        <button class="btn btn-sm btn-primary add-to-cart-from-fav w-100 rounded-pill" data-id="${product.id}" ${!product.disponibilidad ? 'disabled' : ''}>
                            ${product.disponibilidad ? '<i class="bi bi-cart-plus me-1"></i>Agregar' : 'Agotado'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(item);
    });

    // Remover de favoritos desde el offcanvas
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

    // Agregar al carrito desde favoritos
    container.querySelectorAll('.add-to-cart-from-fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.disabled || e.currentTarget.disabled) return;
            const productId = parseInt(e.currentTarget.dataset.id);
            const result = state.addToCart(productId);

            if (result.success) {
                // eslint-disable-next-line no-undef
                bootstrap.Offcanvas.getInstance(document.getElementById('favoritesOffcanvas')).hide();
                renderCartOffcanvas();
                // eslint-disable-next-line no-undef
                const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
                cartOffcanvas.show();
            } else {
                if (result.error === 'DIFFERENT_RESTAURANT') {
                    showToast('Solo puedes agregar productos de un mismo restaurante al pedido.', 'warning');
                } else if (result.error === 'UNAVAILABLE') {
                    showToast('Este producto no está disponible.', 'warning');
                }
            }
        });
    });
}

// RENDERIZADO DEL CARRITO (OFFCANVAS)
export function renderCartOffcanvas() {
    const cart = state.getCart();
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cartFooter = document.getElementById('cartFooter');
    const emptyCart = document.getElementById('emptyCart');
    const cartCountBadge = document.getElementById('cartCount') || document.getElementById('cartItemCount');

    if (!cartItemsContainer || !cartTotalElement) return;

    cartItemsContainer.innerHTML = '';

    if (state.isCartEmpty()) {
        cartItemsContainer.innerHTML = '<div class="text-center p-4 text-muted"><i class="bi bi-cart-x fs-1 d-block mb-3"></i>Tu carrito está vacío</div>';
        cartTotalElement.textContent = 'S/ 0.00';
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (cartFooter) cartFooter.style.display = 'none';
        if (emptyCart) emptyCart.style.display = 'block';

        if (cartCountBadge) {
            cartCountBadge.textContent = '0';
            cartCountBadge.style.display = 'none';
        }
        return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;
    if (cartFooter) cartFooter.style.display = 'block';
    if (emptyCart) emptyCart.style.display = 'none';

    Object.entries(cart).forEach(([productId, quantity]) => {
        const product = state.getProductById(productId);
        if (!product) return;

        let price = product.precio;
        let isDiscounted = false;
        if (window.currentUser && window.currentUser.es_estudiante && product.descuento_estudiante > 0) {
            price = price - (price * (product.descuento_estudiante / 100));
            isDiscounted = true;
        }

        const itemTotal = price * quantity;

        const cartItem = document.createElement('div');
        cartItem.className = 'd-flex justify-content-between align-items-center border-bottom py-3';
        cartItem.innerHTML = `
            <div class="d-flex align-items-center w-75">
                <img src="${product.imagen_url}" alt="${product.nombre}" class="rounded me-3 object-fit-cover" style="width: 60px; height: 60px;">
                <div>
                    <h6 class="mb-0 fw-bold text-truncate" style="max-width: 150px;">${product.nombre}</h6>
                    <small class="text-muted">${isDiscounted ? '<span class="badge bg-warning text-dark me-1">Estudiante</span>' : ''}S/ ${price.toFixed(2)} x ${quantity}</small>
                </div>
            </div>
            <div class="text-end w-25">
                <span class="fw-bold d-block mb-2">S/ ${itemTotal.toFixed(2)}</span>
                <div class="btn-group btn-group-sm bg-light rounded-pill p-1">
                    <button class="btn btn-sm btn-link text-dark text-decoration-none minus-btn" data-id="${product.id}"><i class="bi bi-dash"></i></button>
                    <span class="px-2 d-flex align-items-center">${quantity}</span>
                    <button class="btn btn-sm btn-link text-dark text-decoration-none plus-btn" data-id="${product.id}"><i class="bi bi-plus"></i></button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    const total = state.getCartTotal();
    cartTotalElement.textContent = `S/ ${total.toFixed(2)}`;

    const count = state.getCartItemCount();
    if (cartCountBadge) {
        cartCountBadge.textContent = count.toString();
        cartCountBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }

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
}

// RENDERIZADO DEL CARRITO (VISTA CHECKOUT)
export function renderCheckoutCart() {
    const cart = state.getCart();
    const checkoutCartItems = document.getElementById('checkoutCartItems') || document.getElementById('checkoutItems');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const checkoutDiscount = document.getElementById('checkoutDiscount');
    const checkoutDiscountRow = document.getElementById('checkoutDiscountRow');
    const checkoutTax = document.getElementById('checkoutTax') || document.getElementById('checkoutTaxes');
    const checkoutDeliveryFee = document.getElementById('checkoutDeliveryFee') || document.getElementById('checkoutDelivery');

    if (!checkoutCartItems) return;

    checkoutCartItems.innerHTML = '';

    if (state.isCartEmpty()) {
        checkoutCartItems.innerHTML = '<div class="text-center text-muted py-4">Tu carrito está vacío</div>';
        if (checkoutSubtotal) checkoutSubtotal.textContent = 'S/ 0.00';
        if (checkoutTotal) checkoutTotal.textContent = 'S/ 0.00';
        if (checkoutDiscount) checkoutDiscount.textContent = '-S/ 0.00';
        if (checkoutTax) checkoutTax.textContent = 'S/ 0.00';
        if (checkoutDeliveryFee) checkoutDeliveryFee.textContent = 'S/ 5.00';
        if (checkoutDiscountRow) checkoutDiscountRow.style.display = 'none';
        return;
    }

    let subtotal = 0;

    Object.entries(cart).forEach(([productId, quantity]) => {
        const product = state.getProductById(productId);
        if (!product) return;

        let price = product.precio;
        let isDiscounted = false;
        if (window.currentUser && window.currentUser.es_estudiante && product.descuento_estudiante > 0) {
            price = price - (price * (product.descuento_estudiante / 100));
            isDiscounted = true;
        }

        const itemTotal = price * quantity;
        subtotal += itemTotal;

        const itemRow = document.createElement('div');
        itemRow.className = 'd-flex justify-content-between align-items-start py-3 border-bottom';
        itemRow.innerHTML = `
            <div class="d-flex w-100">
                <img src="${product.imagen_url}" alt="${product.nombre}" class="rounded me-3 object-fit-cover" style="width: 50px; height: 50px;">
                <div class="flex-grow-1">
                    <h6 class="my-0 fw-bold">${product.nombre} <span class="badge bg-secondary rounded-pill ms-1">x${quantity}</span></h6>
                    <small class="text-muted d-block mt-1">${product.restaurante ? product.restaurante.nombre : 'Restaurante'}</small>
                    ${isDiscounted ? '<small class="text-warning fw-bold"><i class="bi bi-star-fill me-1"></i>Descuento estudiante aplicado</small>' : ''}
                </div>
                <span class="text-muted fw-bold">S/ ${itemTotal.toFixed(2)}</span>
            </div>
        `;
        checkoutCartItems.appendChild(itemRow);
    });

    const activeCoupon = state.getActiveCoupon();
    let discount = 0;

    if (activeCoupon) {
        if (activeCoupon.tipo === 'porcentaje') {
            discount = subtotal * (activeCoupon.valor / 100);
        } else if (activeCoupon.tipo === 'fijo') {
            discount = activeCoupon.valor;
        }

        // Agregar línea de cupón visualmente
        const liCoupon = document.createElement('li');
        liCoupon.className = 'list-group-item d-flex justify-content-between bg-light py-2 text-success';
        liCoupon.innerHTML = `
            <div class="text-success">
                <h6 class="my-0"><i class="bi bi-tag-fill me-2"></i>Cupón aplicado</h6>
                <small>${activeCoupon.codigo}</small>
            </div>
            <span class="fw-bold">-S/ ${discount.toFixed(2)}</span>
        `;
        checkoutCartItems.appendChild(liCoupon);
    }

    if (checkoutDiscountRow) {
        checkoutDiscountRow.style.display = discount > 0 ? 'flex' : 'none';
    }

    // Cálculos financieros locales (solo para visualización, el backend calcula el real)
    const subtotalAfterDiscount = Math.max(0, subtotal - discount);
    const taxRate = 0.18; // 18% IGV (ejemplo Perú)
    const tax = subtotalAfterDiscount * taxRate;
    const deliveryFee = 5.00; // Tarifa fija de entrega
    const total = subtotalAfterDiscount + tax + deliveryFee;

    if (checkoutSubtotal) checkoutSubtotal.textContent = `S/ ${subtotal.toFixed(2)}`;
    if (checkoutDiscount) checkoutDiscount.textContent = `-S/ ${discount.toFixed(2)}`;
    if (checkoutTax) checkoutTax.textContent = `S/ ${tax.toFixed(2)}`;
    if (checkoutDeliveryFee) checkoutDeliveryFee.textContent = `S/ ${deliveryFee.toFixed(2)}`;
    if (checkoutTotal) checkoutTotal.textContent = `S/ ${total.toFixed(2)}`;
}

export function renderCheckoutSummary() {
    renderCheckoutCart();
}

export function fillCheckoutUserData() {
    const user = window.currentUser;
    const customerName = document.getElementById('customerName');
    const customerPhone = document.getElementById('customerPhone');

    if (customerName && user?.nombre) {
        customerName.value = user.nombre;
    }

    if (customerPhone && user?.telefono) {
        customerPhone.value = user.telefono;
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
    const cardDetails = document.getElementById('cardDetails');
    if (!cardDetails) return;

    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    cardDetails.style.display = selectedMethod === 'card' ? 'block' : 'none';
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
                <div class="text-center py-5 bg-light rounded shadow-sm">
                    <i class="bi bi-bag-x fs-1 text-muted mb-3 d-block"></i>
                    <h5 class="text-muted">No tienes pedidos anteriores</h5>
                    <button class="btn btn-primary mt-3" onclick="window.ui.showView('homeView')">Empezar a pedir</button>
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
                let reviewHtml = '';
                if (estadoStr === 'entregado' && (!order.reviews || order.reviews.length === 0)) {
                    reviewHtml = `
                        <button class="btn btn-sm btn-outline-warning mt-3 btn-leave-review"
                            data-bs-toggle="modal" data-bs-target="#reviewModal"
                            data-order-id="${order.id}">
                            <i class="bi bi-star-fill me-1"></i>Dejar una Reseña
                        </button>
                    `;
                } else if (order.reviews && order.reviews.length > 0) {
                    const r = order.reviews[0];
                    let stars = '';
                    for(let i=1; i<=5; i++) {
                        stars += `<i class="bi bi-star${i<=r.puntuacion?'-fill text-warning':''} me-1"></i>`;
                    }
                    reviewHtml = `
                        <div class="mt-3 p-3 bg-light rounded border border-warning border-opacity-25">
                            <div class="d-flex align-items-center mb-1">
                                <span class="badge bg-warning text-dark me-2">Tu reseña</span>
                                ${stars}
                            </div>
                            <p class="mb-0 text-muted small fst-italic">"${r.comentario || 'Sin comentario'}"</p>
                        </div>
                    `;
                }

                const itemsArray = order.items || [];
                const itemsHtml = itemsArray.map(item => {
                    const nombreProd = item.producto?.nombre || item.Product?.nombre || item.Producto?.nombre || 'Producto Desconocido';
                    const precioStr = item.precio_unitario || item.precio || 0;
                    return `
                        <li class="d-flex justify-content-between align-items-center mb-2">
                            <span>
                                <span class="badge bg-light text-dark border me-2">${item.cantidad || 1}x</span>
                                ${nombreProd}
                            </span>
                            <span class="text-muted">S/ ${precioStr}</span>
                        </li>
                    `;
                }).join('');

                const card = document.createElement('div');
                card.className = 'card mb-4 shadow-sm border-0';
                card.innerHTML = `
                    <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                        <div>
                            <span class="fw-bold text-primary">Pedido #${String(order.id || '000').substring(0,8)}...</span>
                            <small class="text-muted d-block mt-1"><i class="bi bi-calendar3 me-1"></i>${date}</small>
                        </div>
                        <span class="badge rounded-pill ${statusColor} px-3 py-2"><i class="bi ${statusIcon} me-1"></i>${badge.label.toUpperCase()}</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <h6 class="fw-bold mb-3 text-secondary border-bottom pb-2">Artículos</h6>
                                <ul class="list-unstyled mb-0">
                                    ${itemsHtml || '<li class="text-muted">No hay detalles de artículos</li>'}
                                </ul>
                            </div>
                            <div class="col-md-4 mt-3 mt-md-0 border-start ps-md-4">
                                <h6 class="fw-bold mb-3 text-secondary border-bottom pb-2">Resumen</h6>
                                <div class="d-flex justify-content-between small text-muted mb-1">
                                    <span>Subtotal</span>
                                    <span>S/ ${deriveSubtotal(order).toFixed(2)}</span>
                                </div>
                                <div class="d-flex justify-content-between small text-muted mb-1">
                                    <span>IGV (18%)</span>
                                    <span>S/ ${order.impuestos || '0.00'}</span>
                                </div>
                                <div class="d-flex justify-content-between small text-muted mb-1">
                                    <span>Envío</span>
                                    <span>S/ ${order.costo_envio || '0.00'}</span>
                                </div>
                                ${(parseFloat(order.descuento) > 0) ? `
                                    <div class="d-flex justify-content-between small text-success mb-1">
                                        <span>Descuento</span>
                                        <span>-S/ ${order.descuento}</span>
                                    </div>
                                ` : ''}
                                <hr class="my-2">
                                <div class="d-flex justify-content-between fw-bold fs-5 text-dark">
                                    <span>Total</span>
                                    <span>S/ ${order.total || '0.00'}</span>
                                </div>
                            </div>
                        </div>
                        ${reviewHtml}
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

    container.innerHTML = '';
    categories.forEach(cat => {
        container.innerHTML += `
            <div class="form-check mb-2">
                <input class="form-check-input filter-food-type" type="checkbox" value="${cat}" id="filter-cat-${cat.replace(/\s+/g, '-')}">
                <label class="form-check-label text-muted" for="filter-cat-${cat.replace(/\s+/g, '-')}">
                    ${cat}
                </label>
            </div>
        `;
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

/** Vuelca el modelo de vista sobre la línea de tiempo. */
function applyTrackingViewModel(vm) {
    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    const statusDesc = document.getElementById('statusDescription');
    const estimatedTime = document.getElementById('estimatedTime');

    if (statusIcon) {
        const color = vm.cancelled ? 'text-danger' : (vm.terminal ? 'text-success' : 'text-primary');
        statusIcon.innerHTML = `<i class="bi ${vm.iconClass} fs-1 ${color}" aria-hidden="true"></i>`;
        statusIcon.classList.toggle('delivered', vm.terminal);
    }
    if (statusTitle) statusTitle.textContent = vm.title;
    if (statusDesc) statusDesc.textContent = vm.description;

    if (estimatedTime) {
        if (vm.etaText) {
            estimatedTime.innerHTML = `<i class="bi bi-clock me-2" aria-hidden="true"></i>${vm.etaText}`;
            estimatedTime.style.display = '';
        } else {
            estimatedTime.style.display = 'none';
        }
    }

    ETAPAS.forEach((etiqueta, i) => {
        const paso = document.getElementById(`step${i + 1}`);
        if (!paso) return;

        const completado = i < vm.completedCount;
        const activo = i === vm.activeIndex;

        paso.classList.toggle('completed', completado);
        paso.classList.toggle('active', activo && !completado);

        if (activo) {
            paso.setAttribute('aria-current', 'step');
        } else {
            paso.removeAttribute('aria-current');
        }

        const icono = completado ? 'bi-check-circle-fill' : ICONOS_ETAPA[i];
        paso.innerHTML = `<i class="bi ${icono}" aria-hidden="true"></i>`;
        paso.setAttribute('aria-label', `Etapa ${i + 1} de ${ETAPAS.length}: ${etiqueta}`);

        const linea = document.getElementById(`line${i + 1}`);
        if (linea) linea.classList.toggle('completed', isLineCompleted(vm, i));
    });
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
        setConnectionNotice('Sin conexión con el servidor, reintentando…');

        if (trackingFallos >= MAX_FALLOS) {
            setConnectionNotice('No se pudo actualizar el estado del pedido.');
            stopOrderTracking();
        }
        return;
    }

    trackingFallos = 0;
    setConnectionNotice('');

    const vm = getTrackingViewModel(resultado.data.estado);
    applyTrackingViewModel(vm);

    if (vm.terminal) {
        showToast(
            vm.cancelled ? '❌ Tu pedido fue cancelado.' : '✅ ¡Tu pedido ha sido entregado! Buen provecho.',
            vm.cancelled ? 'warning' : 'success'
        );
        stopOrderTracking();
    }
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
    applyTrackingViewModel(getTrackingViewModel(orderData?.estado));

    stopOrderTracking();

    trackingOrderId = orderData?.id;
    trackingFallos = 0;

    if (!trackingOrderId) return;

    pollOnce();
    trackingIntervalId = setInterval(pollOnce, POLL_MS);
}

/** Detiene el sondeo. Es idempotente: se puede llamar siempre. */
export function stopOrderTracking() {
    if (trackingIntervalId !== null) {
        clearInterval(trackingIntervalId);
        trackingIntervalId = null;
    }
    trackingOrderId = null;
    trackingFallos = 0;
}

// No tiene sentido seguir preguntando por el pedido con la pestaña oculta.
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
