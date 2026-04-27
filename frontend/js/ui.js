import * as state from './state.js';

// ==========================================
// UTILIDADES GENERALES DE UI
// ==========================================
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
    allViews.forEach(viewId => {
        const viewElement = document.getElementById(viewId);
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

// ==========================================
// CATÁLOGO DE PRODUCTOS
// ==========================================
export function renderProducts() {
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
                    <img src="${product.imagen_url || 'https://via.placeholder.com/500x300?text=FoodJet'}" class="card-img-top product-image" alt="${product.nombre}">
                    <span class="product-badge">${product.categoria}</span>
                    ${!isAvailable ? '<span class="position-absolute top-50 start-50 translate-middle badge bg-danger fs-5">Agotado</span>' : ''}
                </div>
                <div class="card-body">
                    <h3 class="h5 card-title mb-2">${product.nombre}</h3>
                    <p class="card-text text-muted small mb-3">${product.descripcion || ''}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="fs-4 fw-bold">S/ ${product.precio.toFixed(2)}</div>
                        <div id="product-controls-${product.id}">
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

// ==========================================
// CARRITO DE COMPRAS
// ==========================================
export function updateCartUI() {
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

        return `
            <div class="cart-item">
                <img src="${product.imagen_url || 'https://via.placeholder.com/500x300?text=FoodJet'}" class="cart-item-image" alt="${product.nombre}">
                <div class="cart-item-details">
                    <h6 class="mb-1">${product.nombre}</h6>
                    <p class="text-muted small mb-1">Cantidad: ${quantity}</p>
                    <p class="fw-bold mb-0">S/ ${itemTotal.toFixed(2)}</p>
                </div>
                <button class="remove-item-btn" onclick="window.app.handleRemoveItemCompletely(${product.id})" aria-label="Eliminar ${product.nombre}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    const total = state.getCartTotal();
    cartTotalElement.textContent = `S/ ${total.toFixed(2)}`;
}

// ==========================================
// CHECKOUT
// ==========================================
export function renderCheckoutSummary() {
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutTaxes = document.getElementById('checkoutTaxes');
    const checkoutDelivery = document.getElementById('checkoutDelivery');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const cart = state.getCart();

    let subtotal = 0;

    checkoutItems.innerHTML = Object.entries(cart).map(([productId, quantity]) => {
        const product = state.getProductById(productId);
        if (!product) return '';

        const itemTotal = product.precio * quantity;
        subtotal += itemTotal;

        return `
            <div class="d-flex justify-content-between text-sm mb-2">
                <span class="text-muted">${product.nombre} x${quantity}</span>
                <span>S/ ${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');

    const taxPercentage = 0.18;
    const taxes = subtotal * taxPercentage;
    const deliveryFee = 5.00;
    const total = subtotal + taxes + deliveryFee;

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

// ==========================================
// RASTREO DE ESTADO
// ==========================================
export function startOrderTracking(paymentMethod, orderData) {
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
