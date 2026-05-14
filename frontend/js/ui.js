import * as state from './state.js';

// // UTILIDADES GENERALES DE UI
// export function showToast(message, type = 'success') {
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
        toastContainer.className = 'toast-container';
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
    const allViews = ['homeView', 'checkoutView', 'trackingView', 'dashboardView'];

    const allViews = ['homeView', 'checkoutView', 'trackingView', 'dashboardView', 'orderHistoryView'];    allViews.forEach(viewId => {

    allViews.forEach(viewId => {        const viewElement = document.getElementById(viewId);
        if (viewElement) {
            viewElement.style.display = 'none';
        }
    });
    const viewToShow = document.getElementById(viewToShowId);
    if (viewToShow) {
        viewToShow.style.display = 'block';
        window.scrollTo(0, 0);
    }
}

// // CATÁLOGO DE PRODUCTOS
// export function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const products = state.getProducts();

    if (products.length === 0) {
        grid.innerHTML = '<p class="text-center w-100">No hay productos disponibles por ahora.</p>';
        return;
    }

    grid.innerHTML = products.map(product => {
        const isAvailable = product.disponibilidad !== false;
        return `
        <div class="col-md-6 col-lg-3">
            <div class="card product-card ${!isAvailable ? 'opacity-50' : ''}">
                <div class="position-relative overflow-hidden">
                    <button class="btn btn-light rounded-circle position-absolute top-0 end-0 m-2 p-2 shadow-sm favorite-btn" onclick="window.app.handleToggleFavorite(${product.id})" aria-label="Marcar como favorito" style="z-index: 10;">
                        <i class="bi ${state.isFavorite(product.id) ? \'bi-heart-fill text-danger\' : \'bi-heart text-muted\'}"></i>
                    </button>                    <img src="${product.imagen_url || 'https://via.placeholder.com/500x300?text=FoodJet'}" class="card-img-top product-image" alt="${product.nombre}">

                    <img src="${product.imagen_url || 'https://via.placeholder.com/500x300?text=FoodJet'}" class="card-img-top product-image" alt="${product.nombre}">                    ${product.categoria ? `<span class="product-badge">${product.categoria}</span>` : ''}

                    <img src="${product.imagen_url || 'https://via.placeholder.com/500x300?text=FoodJet'}" class="card-img-top product-image" alt="${product.nombre}">
                    ${product.categoria ? `<span class="product-badge">${product.categoria}</span>` : ''}                    ${!isAvailable ? '<span class="position-absolute top-50 start-50 translate-middle badge bg-danger fs-5">Agotado</span>' : ''}
                </div>
                <div class="card-body">
                    <h3 class="h5 card-title mb-2">${product.nombre}</h3>

                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h3 class="h5 card-title mb-0" style="max-width: 70%;">${product.nombre}</h3>
                        <div class="text-end">
                        ${product.restaurante && product.restaurante.calificacion_promedio > 0 ?
                            `<span class="badge bg-warning text-dark fs-6 shadow-sm"><i class="bi bi-star-fill me-1"></i>${Number(product.restaurante.calificacion_promedio).toFixed(1)}</span>` :
                            `<span class="badge bg-secondary text-light">Nuevo</span>`
                        }
                        </div>
                    </div>
                    <p class="text-primary small mb-2"><i class="bi bi-shop me-1"></i>${product.restaurante ? product.restaurante.nombre : 'Restaurante'}</p>                    <p class="card-text text-muted small mb-3">${product.descripcion || ''}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="fs-4 fw-bold">S/ ${product.precio.toFixed(2)}</div>

                    <p class="card-text text-muted small mb-3">${product.descripcion || ''}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        ${(window.currentUser && window.currentUser.es_estudiante && product.descuento_estudiante > 0) ? `<div class="fs-4 fw-bold">S/ ${(product.precio * (1 - (product.descuento_estudiante / 100))).toFixed(2)} <del class="text-muted fs-6">S/ ${product.precio.toFixed(2)}</del></div>` : `<div class="fs-4 fw-bold">S/ ${product.precio.toFixed(2)}</div>`}                        <div id="product-controls-${product.id}">
                            ${renderProductControls(product.id)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

export function renderProductControls(productId) {
    const cart = state.getCart();
    const quantity = cart[productId] || 0;
    const product = state.getProductById(productId);
    const isAvailable = product && product.disponibilidad !== false;

    if (quantity === 0) {
        return `
            <button class="btn btn-primary btn-sm" onclick="window.app.handleAddToCart(${productId})" aria-label="Agregar al carrito" ${!isAvailable ? 'disabled' : ''}>
                <i class="bi bi-plus"></i> Agregar
            </button>
        `;
    } else {
        return `
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="window.app.handleRemoveFromCart(${productId})" aria-label="Disminuir cantidad">
                    <i class="bi bi-dash"></i>
                </button>
                <span class="fw-bold" aria-live="polite">${quantity}</span>
                <button class="quantity-btn add-btn" onclick="window.app.handleAddToCart(${productId})" aria-label="Aumentar cantidad" ${!isAvailable ? 'disabled' : ''}>
                    <i class="bi bi-plus"></i>
                </button>
            </div>
        `;
    }
}

export function updateProductControls(productId) {
    const controlsElement = document.getElementById(`product-controls-${productId}`);
    if (controlsElement) {
        controlsElement.innerHTML = renderProductControls(productId);
    }
}

// // CARRITO DE COMPRAS
// export function updateCartUI() {
    const totalItems = state.getCartItemCount();
    const cartCountBadge = document.getElementById('cartCount');
    const cartItemCountBadge = document.getElementById('cartItemCount');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // Actualizar badge del navbar
    if (totalItems > 0) {
        cartCountBadge.textContent = totalItems;
        cartCountBadge.style.display = 'flex';
        cartItemCountBadge.textContent = totalItems + ' items';
    } else {
        cartCountBadge.style.display = 'none';
        cartItemCountBadge.textContent = '0 items';
    }

    // Deshabilitar botón de checkout si está vacío
    if (state.isCartEmpty()) {
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add('disabled', 'btn-secondary');
        checkoutBtn.classList.remove('btn-primary');
    } else {
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('disabled', 'btn-secondary');
        checkoutBtn.classList.add('btn-primary');
    }

    renderCartItems();
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotalElement = document.getElementById('cartTotal');

    const cart = state.getCart();
    const cartEntries = Object.entries(cart);

    if (cartEntries.length === 0) {
        emptyCart.style.display = 'block';
        cartItemsContainer.innerHTML = '';
        cartFooter.style.display = 'block'; // Mostrar footer pero con botón deshabilitado
        cartTotalElement.textContent = `S/ 0.00`;
        return;
    }

    emptyCart.style.display = 'none';
    cartFooter.style.display = 'block';

    cartItemsContainer.innerHTML = cartEntries.map(([productId, quantity]) => {
        const product = state.getProductById(productId);
        if (!product) return '';

        const itemTotal = product.precio * quantity;

        let price = product.precio;
        if (window.currentUser && window.currentUser.es_estudiante && product.descuento_estudiante > 0) {
            price = price - (price * (product.descuento_estudiante / 100));
        }
        const itemTotal = price * quantity;
        return `
            <div class="cart-item">
                <img src="${product.imagen_url || 'https://via.placeholder.com/500x300?text=FoodJet'}" class="cart-item-image" alt="${product.nombre}">
                <div class="cart-item-details">
                    <h6 class="mb-1">${product.nombre}</h6>
                    <p class="text-muted small mb-1">Cantidad: ${quantity}</p>
                    <p class="fw-bold mb-0">S/ ${itemTotal.toFixed(2)}</p>

                    ${(window.currentUser && window.currentUser.es_estudiante && product.descuento_estudiante > 0) ? `<p class="fw-bold mb-0">S/ ${itemTotal.toFixed(2)} <del class="text-muted small">S/ ${(product.precio * quantity).toFixed(2)}</del></p>` : `<p class="fw-bold mb-0">S/ ${itemTotal.toFixed(2)}</p>`}                </div>
                <button class="remove-item-btn" onclick="window.app.handleRemoveItemCompletely(${product.id})" aria-label="Eliminar ${product.nombre}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    const total = state.getCartTotal();
    cartTotalElement.textContent = `S/ ${total.toFixed(2)}`;
}

// // CHECKOUT Y AUTOCOMPLETADO
// export function fillCheckoutUserData() {
    const customerName = document.getElementById('customerName');
    const customerPhone = document.getElementById('customerPhone');

    if (window.currentUser) {
        if (window.currentUser.nombre) {
            customerName.value = window.currentUser.nombre;
        }
        if (window.currentUser.telefono) {
            customerPhone.value = window.currentUser.telefono;
        }
    }
}

export function requestUserLocation() {
    const addressInput = document.getElementById('customerAddress');

    if ('geolocation' in navigator) {
        // Mostramos un mensaje de que estamos obteniendo la ubicación
        addressInput.placeholder = "Obteniendo tu ubicación...";

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                try {
                    // Usamos Nominatim de OpenStreetMap para geocoding inverso (gratuito)
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.display_name) {
                            addressInput.value = data.display_name;
                            addressInput.placeholder = "";
                        } else {
                            addressInput.placeholder = "No se pudo obtener la dirección";
                        }
                    } else {
                        addressInput.placeholder = "Error al conectar con el servicio de mapas";
                    }
                } catch (error) {
                    console.error("Error en geocoding inverso:", error);
                    addressInput.placeholder = "Error al obtener la dirección";
                }
            },
            (error) => {
                console.warn("Error obteniendo ubicación:", error.message);
                addressInput.placeholder = "No se pudo acceder a tu ubicación";
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        addressInput.placeholder = "Geolocalización no soportada por tu navegador";
    }
}

// // CHECKOUT
// export function renderCheckoutSummary() {
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutTaxes = document.getElementById('checkoutTaxes');
    const checkoutDelivery = document.getElementById('checkoutDelivery');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const checkoutDiscountRow = document.getElementById('checkoutDiscountRow');
    const checkoutDiscount = document.getElementById('checkoutDiscount');
    const cart = state.getCart();

    let subtotal = 0;

    checkoutItems.innerHTML = Object.entries(cart).map(([productId, quantity]) => {
        const product = state.getProductById(productId);
        if (!product) return '';

        const itemTotal = product.precio * quantity;

        let price = product.precio;
        if (window.currentUser && window.currentUser.es_estudiante && product.descuento_estudiante > 0) {
            price = price - (price * (product.descuento_estudiante / 100));
        }
        const itemTotal = price * quantity;        subtotal += itemTotal;

        return `
            <div class="d-flex justify-content-between text-sm mb-2">
                <span class="text-muted">${product.nombre} x${quantity}</span>
                <span>S/ ${itemTotal.toFixed(2)}</span>

                ${(window.currentUser && window.currentUser.es_estudiante && product.descuento_estudiante > 0) ? `<span>S/ ${itemTotal.toFixed(2)} <del class="text-muted small">S/ ${(product.precio * quantity).toFixed(2)}</del></span>` : `<span>S/ ${itemTotal.toFixed(2)}</span>`}            </div>
        `;
    }).join('');

    let discountAmount = 0;
    const activeCoupon = state.getActiveCoupon();
    if (activeCoupon) {
        discountAmount = subtotal * (activeCoupon.porcentaje_descuento / 100);
        if (checkoutDiscountRow) checkoutDiscountRow.style.setProperty('display', 'flex', 'important');
        if (checkoutDiscount) checkoutDiscount.textContent = `-S/ ${discountAmount.toFixed(2)}`;
    } else {
        if (checkoutDiscountRow) checkoutDiscountRow.style.setProperty('display', 'none', 'important');
    }

    const subtotalWithDiscount = subtotal - discountAmount;
    const taxPercentage = 0.18;
    const taxes = subtotalWithDiscount * taxPercentage;
    const deliveryFee = 5.00;
    const total = subtotalWithDiscount + taxes + deliveryFee;

    checkoutSubtotal.textContent = `S/ ${subtotal.toFixed(2)}`;
    if (checkoutTaxes) checkoutTaxes.textContent = `S/ ${taxes.toFixed(2)}`;
    if (checkoutDelivery) checkoutDelivery.textContent = `S/ ${deliveryFee.toFixed(2)}`;
    checkoutTotal.textContent = `S/ ${total.toFixed(2)}`;
}

export function toggleCardDetails() {
    const cardDetails = document.getElementById('cardDetails');
    const payCard = document.getElementById('payCard');

    if (payCard.checked) {
        cardDetails.style.display = 'block';
        document.getElementById('cardNumber').required = true;
        document.getElementById('cardExpiry').required = true;
        document.getElementById('cardCvc').required = true;
    } else {
        cardDetails.style.display = 'none';
        document.getElementById('cardNumber').required = false;
        document.getElementById('cardExpiry').required = false;
        document.getElementById('cardCvc').required = false;
    }
}

// // RASTREO DE ESTADO
// export function startOrderTracking(paymentMethod, orderData) {
    const realOrderId = orderData?.id;
    const orderNumber = '#FJ' + (realOrderId ? realOrderId.toString().padStart(4, '0') : Math.floor(Math.random() * 10000));
    const orderDate = new Date().toLocaleDateString('es-PE');

    document.getElementById('orderNumber').textContent = orderNumber;
    document.getElementById('orderDate').textContent = orderDate;
    document.getElementById('orderPayment').textContent = paymentMethod === 'card' ? 'Tarjeta de crédito/débito' : 'Efectivo al recibir';

    if (orderData) {
        const subtotal = orderData.total - orderData.impuestos - orderData.costo_envio;

        const orderSubtotalEl = document.getElementById('orderSubtotal');
        const orderTaxesEl = document.getElementById('orderTaxes');
        const orderDeliveryEl = document.getElementById('orderDelivery');
        const orderTotalFinalEl = document.getElementById('orderTotalFinal');

        if (orderSubtotalEl) orderSubtotalEl.textContent = `S/ ${subtotal.toFixed(2)}`;
        if (orderTaxesEl) orderTaxesEl.textContent = `S/ ${Number(orderData.impuestos).toFixed(2)}`;
        if (orderDeliveryEl) orderDeliveryEl.textContent = `S/ ${Number(orderData.costo_envio).toFixed(2)}`;
        if (orderTotalFinalEl) orderTotalFinalEl.textContent = `S/ ${Number(orderData.total).toFixed(2)}`;
    }

    updateOrderStatus('preparing');

    // Simulación del progreso (Para el CUN01 real debería usar websockets o polling,
    // pero mantenemos la simulación actual como base visual requerida)
    setTimeout(() => {
        updateOrderStatus('on-the-way');
    }, 8000);

    setTimeout(() => {
        updateOrderStatus('delivered');
    }, 18000);
}

export function updateOrderStatus(status) {
    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    const statusDescription = document.getElementById('statusDescription');
    const estimatedTime = document.getElementById('estimatedTime');
    const backToMenuBtn = document.getElementById('backToMenuFromTracking');

    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const line1 = document.getElementById('line1');
    const line2 = document.getElementById('line2');

    // Resetear clases
    [step1, step2, step3].forEach(el => el.classList.remove('active', 'completed'));
    [line1, line2].forEach(el => el.classList.remove('active', 'completed'));
    statusIcon.classList.remove('delivered');

    if (status === 'preparing') {
        statusIcon.innerHTML = '<i class="bi bi-box-seam fs-1"></i>';
        statusTitle.textContent = 'Preparando tu pedido';
        statusDescription.textContent = 'Tu pedido está siendo preparado con mucho cuidado';
        estimatedTime.innerHTML = '<i class="bi bi-clock me-2"></i>Tiempo estimado: 30 minutos';
        estimatedTime.style.display = 'inline-block';
        backToMenuBtn.style.display = 'none';

        step1.classList.add('active');
    } else if (status === 'on-the-way') {
        statusIcon.innerHTML = '<i class="bi bi-truck fs-1"></i>';
        statusTitle.textContent = '¡En camino!';
        statusDescription.textContent = 'Tu pedido está en camino a tu ubicación';
        estimatedTime.innerHTML = '<i class="bi bi-clock me-2"></i>Tiempo estimado: 15 minutos';
        estimatedTime.style.display = 'inline-block';
        backToMenuBtn.style.display = 'none';

        step1.classList.add('completed');
        step2.classList.add('active');
        line1.classList.add('active');
    } else if (status === 'delivered') {
        statusIcon.innerHTML = '<i class="bi bi-house-door-fill fs-1"></i>';
        statusIcon.classList.add('delivered');
        statusTitle.textContent = '¡Entregado!';
        statusDescription.textContent = 'Tu pedido ha sido entregado. ¡Que lo disfrutes!';
        estimatedTime.style.display = 'none';
        backToMenuBtn.style.display = 'block';

        step1.classList.add('completed');
        step2.classList.add('completed');
        step3.classList.add('completed');
        line1.classList.add('completed');
        line2.classList.add('completed');
    }
}


// // FAVORITOS OFFCANVAS
// export function renderFavoritesOffcanvas() {
    const favoritesList = document.getElementById('favoritesList');
    const emptyFavoritesMessage = document.getElementById('emptyFavoritesMessage');

    if (!favoritesList || !emptyFavoritesMessage) return;

    const favorites = state.getFavorites();

    if (favorites.length === 0) {
        favoritesList.style.display = 'none';
        emptyFavoritesMessage.style.display = 'block';
        return;
    }

    favoritesList.style.display = 'flex';
    emptyFavoritesMessage.style.display = 'none';

    favoritesList.innerHTML = favorites.map(product => {
        // Need to resolve real product from state to check availability
        const stateProduct = state.getProductById(product.id) || product;
        const isAvailable = stateProduct.disponibilidad !== false;

        return `
        <div class="card shadow-sm mb-2 ${!isAvailable ? 'opacity-75' : ''}">
            <div class="row g-0">
                <div class="col-4">
                    <img src="${stateProduct.imagen_url || 'https://via.placeholder.com/150'}" class="img-fluid rounded-start h-100 object-fit-cover" alt="${stateProduct.nombre}">
                </div>
                <div class="col-8">
                    <div class="card-body p-2 position-relative">
                        <button class="btn btn-sm btn-link text-danger position-absolute top-0 end-0 p-1" onclick="window.app.handleToggleFavorite(${stateProduct.id})" aria-label="Quitar de favoritos">
                            <i class="bi bi-heart-fill"></i>
                        </button>
                        <h6 class="card-title text-truncate pe-4 mb-1">${stateProduct.nombre}</h6>
                        <p class="card-text small text-muted mb-1 text-truncate">${stateProduct.restaurante?.nombre || ''}</p>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="fw-bold text-primary small">S/ ${stateProduct.precio.toFixed(2)}</span>
                            <div id="fav-product-controls-${stateProduct.id}" class="scale-90">
                                ${renderProductControlsFav(stateProduct.id)}
                            </div>
                        </div>
                    </div>
export function renderOrderHistory(orders) {
    const container = document.getElementById('orderHistoryContainer');

    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">No has realizado ningún pedido aún.</p></div>';
        return;
    }

    container.innerHTML = orders.map(order => {
        const isDelivered = order.estado.toLowerCase() === 'entregado';
        const hasReview = !!order.Review;

        let reviewButtonHTML = '';
        if (isDelivered) {
            if (hasReview) {
                reviewButtonHTML = `
                <div class="mt-3 text-warning">
                    <i class="bi bi-star-fill"></i> ${order.Review.puntuacion}/5
                    <span class="text-muted ms-2 small">${order.Review.comentario ? `"${order.Review.comentario}"` : ''}</span>
                </div>`;
            } else {
                reviewButtonHTML = `
                <button class="btn btn-outline-warning mt-3 open-review-modal"
                    data-order-id="${order.id}"
                    data-restaurant-name="${order.restaurante.nombre}"
                    data-order-date="${new Date(order.fecha).toLocaleDateString()}">
                    <i class="bi bi-star me-2"></i>Calificar
                </button>`;
            }
        }

        return `
        <div class="col-md-6 mb-4">
            <div class="card h-100 shadow-sm border-0">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <span class="fw-bold">Pedido #${order.id}</span>
                    <span class="badge ${isDelivered ? 'bg-success' : 'bg-secondary'}">${order.estado}</span>
                </div>
                <div class="card-body">
                    <h5 class="card-title"><i class="bi bi-shop me-2 text-primary"></i>${order.restaurante.nombre}</h5>
                    <p class="card-text text-muted small mb-2"><i class="bi bi-calendar me-2"></i>${new Date(order.fecha).toLocaleString()}</p>
                    <p class="card-text fw-bold fs-5 mb-0">Total: S/ ${order.total.toFixed(2)}</p>
                    ${reviewButtonHTML}                </div>
            </div>
        </div>
        `;
    }).join('');
}

export function renderProductControlsFav(productId) {
    const cart = state.getCart();
    const quantity = cart[productId] || 0;
    const product = state.getProductById(productId);
    const isAvailable = product && product.disponibilidad !== false;

    if (quantity === 0) {
        return `
            <button class="btn btn-primary btn-sm px-2 py-1" onclick="window.app.handleAddToCart(${productId})" aria-label="Agregar al carrito" ${!isAvailable ? 'disabled' : ''}>
                <i class="bi bi-plus"></i> Añadir
            </button>
        `;
    }

    return `
        <div class="d-flex align-items-center bg-light rounded-pill border">
            <button class="btn btn-sm btn-light rounded-circle" onclick="window.app.handleRemoveFromCart(${productId})" aria-label="Disminuir cantidad">
                <i class="bi bi-dash"></i>
            </button>
            <span class="mx-2 fw-medium">${quantity}</span>
            <button class="btn btn-sm btn-light rounded-circle" onclick="window.app.handleAddToCart(${productId})" aria-label="Aumentar cantidad" ${!isAvailable ? 'disabled' : ''}>
                <i class="bi bi-plus"></i>
            </button>
        </div>
    `;
}

// Add function to update controls in both places
export function updateProductControlsInAllViews(productId) {
    // Main grid
    const mainControls = document.getElementById(`product-controls-${productId}`);
    if (mainControls) {
        mainControls.innerHTML = renderProductControls(productId);
    }

    // Favs offcanvas
    const favControls = document.getElementById(`fav-product-controls-${productId}`);
    if (favControls) {
        favControls.innerHTML = renderProductControlsFav(productId);
    }
}

export function renderFoodTypeFilters() {
    const products = state.getProducts();
    const types = new Set();
    products.forEach(p => {
        if (p.tipo_comida) {
            types.add(p.tipo_comida);
        }
    });

    const container = document.getElementById('filter-food-type-container');
    if (!container) return;

    if (types.size === 0) {
        container.innerHTML = '<p class="text-muted small">No hay categorías disponibles</p>';
        return;
    }

    let html = '';
    Array.from(types).sort().forEach(type => {
        const id = 'food-type-' + type.replace(/\s+/g, '-').toLowerCase();
        html += `
            <div class="form-check mb-2">
                <input class="form-check-input filter-food-type" type="checkbox" value="${type}" id="${id}">
                <label class="form-check-label text-muted" for="${id}">
                    ${type}
                </label>
            </div>
        `;
    });

    container.innerHTML = html;
}
