// ============================
// FoodJet - JavaScript
// ============================
// Datos de Productos

let products = [];

// Gestión del Estado
let cart = {}; // Carrito de compras
let currentUser = null; // { name: '...', email: '...', role: 'customer' | 'admin' }
let charts = {}; // Almacenar instancias de gráficos para destruirlas después
let orderPaymentMethod = 'cash';
const API_BASE_URL = '/api';

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Vistas
    const homeView = document.getElementById('homeView');
    const checkoutView = document.getElementById('checkoutView');
    const trackingView = document.getElementById('trackingView');
    const allViews = [homeView, checkoutView, trackingView];

    initializeEventListeners(allViews);
    updateCartUI();
    loadProducts();
});

async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error('No se pudieron cargar los productos desde SQL');
        }

        const data = await response.json();
        products = Array.isArray(data) ? data : [];

        if (products.length === 0) {
            showToast('Por ahora no hay productos disponibles. Intenta nuevamente en unos minutos.', 'warning');
        }
    } catch (_error) {
        products = [];
        showToast('No pudimos cargar el menu en este momento. Intenta nuevamente.', 'warning');
    }

    renderProducts();
}

// Productos de renderizado
function renderProducts() {
    const grid = document.getElementById('productsGrid');

    if (!products.length) {
        grid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning mb-0" role="alert">
                    Por ahora no hay productos disponibles. Vuelve a intentarlo en unos minutos.
                </div>
            </div>
        `;
        return;
    }

    grid.innerHTML = products.map(product => `
        <div class="col-md-6 col-lg-3">
            <div class="card product-card">
                <div class="position-relative overflow-hidden">
                    <img src="${product.image}" class="card-img-top product-image" alt="${product.name}">
                    <span class="product-badge">${product.category}</span>
                </div>
                <div class="card-body">
                    <h3 class="h5 card-title mb-2">${product.name}</h3>
                    <p class="card-text text-muted small mb-3">${product.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="fs-4 fw-bold">S/ ${product.price.toFixed(2)}</div>
                        <div id="product-controls-${product.id}">
                            ${renderProductControls(product.id)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Agregar detectores de eventos después de renderizar
    attachProductEventListeners();
}

// Renderizar controles de productos
function renderProductControls(productId) {
    const quantity = cart[productId] || 0;
    
    if (quantity === 0) {
        return `
            <button class="btn btn-primary btn-sm" onclick="addToCart(${productId})" aria-label="Agregar al carrito">
                <i class="bi bi-plus"></i> Agregar
            </button>
        `;
    } else {
        return `
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="removeFromCart(${productId})" aria-label="Disminuir cantidad">
                    <i class="bi bi-dash"></i>
                </button>
                <span class="fw-bold" aria-live="polite">${quantity}</span>
                <button class="quantity-btn add-btn" onclick="addToCart(${productId})" aria-label="Aumentar cantidad">
                    <i class="bi bi-plus"></i>
                </button>
            </div>
        `;
    }
}

// Funciones del carrito
function addToCart(productId) {
    cart[productId] = (cart[productId] || 0) + 1;
    updateProductControls(productId);
    updateCartUI();
    showToast('Producto agregado al carrito');
}

function removeFromCart(productId) {
    if (cart[productId] > 1) {
        cart[productId]--;
    } else {
        delete cart[productId];
    }
    updateProductControls(productId);
    updateCartUI();
}

function removeItemCompletely(productId) {
    delete cart[productId];
    updateProductControls(productId);
    updateCartUI();
}

function updateProductControls(productId) {
    const controlsElement = document.getElementById(`product-controls-${productId}`);
    if (controlsElement) {
        controlsElement.innerHTML = renderProductControls(productId);
    }
}

// Funciones del carrito
function updateCartUI() {
    const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    const cartCountBadge = document.getElementById('cartCount');
    const cartItemCountBadge = document.getElementById('cartItemCount');
    
    // Insignia de actualización
    if (totalItems > 0) {
        cartCountBadge.textContent = totalItems;
        cartCountBadge.style.display = 'flex';
        cartItemCountBadge.textContent = totalItems + ' items';
    } else {
        cartCountBadge.style.display = 'none';
        cartItemCountBadge.textContent = '0 items';
    }
    
    // Actualizar artículos del carrito
    renderCartItems();
}

// Renderizar artículos del carrito
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');
    
    const cartEntries = Object.entries(cart);
    
    if (cartEntries.length === 0) {
        emptyCart.style.display = 'block';
        cartItemsContainer.innerHTML = '';
        cartFooter.style.display = 'none';
        return;
    }
    
    emptyCart.style.display = 'none';
    cartFooter.style.display = 'block';
    
    let total = 0;
    cartItemsContainer.innerHTML = cartEntries.map(([productId, quantity]) => {
        const product = products.find(p => p.id == productId);
        if (!product) return '';
        
        const itemTotal = product.price * quantity;
        total += itemTotal;
        
        return `
            <div class="cart-item">
                <img src="${product.image}" class="cart-item-image" alt="${product.name}">
                <div class="cart-item-details">
                    <h6 class="mb-1">${product.name}</h6>
                    <p class="text-muted small mb-1">Cantidad: ${quantity}</p>
                    <p class="fw-bold mb-0">S/ ${itemTotal.toFixed(2)}</p>
                </div>
                <button class="remove-item-btn" onclick="removeItemCompletely(${product.id})" aria-label="Eliminar ${product.name}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    }).join('');
    
    cartTotal.textContent = `S/ ${total.toFixed(2)}`;
}

// Adjuntar eventos de producto
function attachProductEventListeners() {
    // Onclick en HTML
}

// Inicializar eventos
function initializeEventListeners(allViews) {
    // --- VISTAS ---
    const homeView = document.getElementById('homeView');
    const checkoutView = document.getElementById('checkoutView');
    const trackingView = document.getElementById('trackingView');

    // --- ELEMENTOS DE NAVEGACIÓN DE USUARIO ---
    const logoutBtn = document.getElementById('logoutBtn');

    // Cart button
    document.getElementById('cartBtn').addEventListener('click', openCart);
    
    // Login button
    document.getElementById('loginBtn').addEventListener('click', () => {
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
    });
    
    // Modals toggle
    document.getElementById('showRegisterBtn').addEventListener('click', (e) => {
        e.preventDefault();
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        new bootstrap.Modal(document.getElementById('registerModal')).show();
    });

    document.getElementById('showLoginBtn').addEventListener('click', (e) => {
        e.preventDefault();
        bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
        new bootstrap.Modal(document.getElementById('loginModal')).show();
    });

    // Checkout button
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
    
    // Login and Register forms
    document.getElementById('loginForm').addEventListener('submit', (e) => handleLogin(e, allViews));
    document.getElementById('registerForm').addEventListener('submit', (e) => handleRegister(e, allViews));
    
    // Checkout form
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckoutSubmit);
    
    // Back to menu buttons
    document.getElementById('backToMenuBtn').addEventListener('click', () => showView(homeView, allViews));
    document.getElementById('backToMenuFromTracking').addEventListener('click', () => showView(homeView, allViews));
    
    // Payment method toggle
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', toggleCardDetails);
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => handleLogout(e, allViews));
    }
}

// Inicializar eventos
function openCart() {
    const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
    cartOffcanvas.show();
}

// Registro
async function handleRegister(e, allViews) {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al registrar');
        }

        currentUser = data;
        updateUserUI(currentUser);

        const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        registerModal.hide();

        showToast(`¡Cuenta creada con éxito, ${name}!`);
        document.getElementById('registerForm').reset();
    } catch (error) {
        showToast(error.message, 'warning');
    }
}

// Iniciar sesión
async function handleLogin(e, allViews) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al iniciar sesión');
        }

        currentUser = data;
        updateUserUI(currentUser);
        
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal.hide();
        
        showToast(`¡Bienvenido de vuelta, ${data.name}!`);
        document.getElementById('loginForm').reset();
    } catch (error) {
        showToast(error.message, 'warning');
    }
}

// Cerrar Sesión
function handleLogout(e, allViews) {
    e.preventDefault();
    currentUser = null;
    updateUserUI(null);
    showView(document.getElementById('homeView'), allViews);
    showToast('Has cerrado sesión', 'info');
}

// Actualizar UI de Usuario
function updateUserUI(user) {
    const userMenu = document.getElementById('userMenu');
    const loginNav = document.getElementById('loginNav');
    const userNameDropdown = document.getElementById('userNameDropdown');

    if (user) {
        // Usuario ha iniciado sesión
        userNameDropdown.textContent = user.name;
        userMenu.style.display = 'block';
        loginNav.style.display = 'none';
    } else {
        // Usuario ha cerrado sesión
        userMenu.style.display = 'none';
        loginNav.style.display = 'block';
    }
}

// Manejo el pago
function handleCheckout() {
    const cartEntries = Object.entries(cart);
    
    if (cartEntries.length === 0) {
        showToast('El carrito está vacío', 'warning');
        return;
    }
    
    if (!currentUser) {
        const cartOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
        cartOffcanvas.hide();
        
        setTimeout(() => {
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
            showToast('Por favor inicia sesión para continuar', 'info');
        }, 300);
        return;
    }
    
    const checkoutView = document.getElementById('checkoutView');
    const homeView = document.getElementById('homeView');
    const trackingView = document.getElementById('trackingView');
    showView(checkoutView, [homeView, checkoutView, trackingView]);
    
    const cartOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
    if (cartOffcanvas) {
        cartOffcanvas.hide();
    }
    
    renderCheckoutSummary();
}

// Resumen de pago
function renderCheckoutSummary() {
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    let subtotal = 0;
    
    checkoutItems.innerHTML = Object.entries(cart).map(([productId, quantity]) => {
        const product = products.find(p => p.id == productId);
        if (!product) return '';
        
        const itemTotal = product.price * quantity;
        subtotal += itemTotal;
        
        return `
            <div class="d-flex justify-content-between text-sm mb-2">
                <span class="text-muted">${product.name} x${quantity}</span>
                <span>S/ ${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');
    
    const deliveryFee = 5.00;
    const total = subtotal + deliveryFee;
    
    checkoutSubtotal.textContent = `S/ ${subtotal.toFixed(2)}`;
    checkoutTotal.textContent = `S/ ${total.toFixed(2)}`;
}

// Resumen de pago
function toggleCardDetails() {
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

// Manejar el pago Enviar
async function handleCheckoutSubmit(e) {
    e.preventDefault();

    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerAddress = document.getElementById('customerAddress').value.trim();
    const customerReference = document.getElementById('customerReference').value.trim();

    if (!customerName || !customerPhone || !customerAddress) {
        showToast('Completa todos los datos del cliente', 'warning');
        return;
    }

    const cartEntries = Object.entries(cart);
    if (cartEntries.length === 0) {
        showToast('El carrito está vacío', 'warning');
        return;
    }
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    orderPaymentMethod = paymentMethod;

    const subtotal = cartEntries.reduce((sum, [productId, quantity]) => {
        const product = products.find(p => p.id == productId);
        return product ? sum + (product.price * quantity) : sum;
    }, 0);
    const deliveryFee = 5.00;
    const total = subtotal + deliveryFee;

    const payload = {
        userId: currentUser.id,
        customer: {
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
            reference: customerReference || null
        },
        paymentMethod,
        items: cartEntries
            .map(([productId, quantity]) => {
                const product = products.find(p => p.id == productId);
                if (!product) return null;

                return {
                    productId: product.id,
                    name: product.name,
                    unitPrice: Number(product.price.toFixed(2)),
                    quantity,
                    lineTotal: Number((product.price * quantity).toFixed(2))
                };
            })
            .filter(Boolean),
        subtotal: Number(subtotal.toFixed(2)),
        deliveryFee: Number(deliveryFee.toFixed(2)),
        total: Number(total.toFixed(2))
    };

    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        let responseData = null;
        try {
            responseData = await response.json();
        } catch {
            responseData = null;
        }

        if (!response.ok) {
            throw new Error(responseData?.message || 'No se pudo guardar el pedido');
        }

        // Limpiar carrito solo cuando el guardado en SQL fue exitoso.
        cart = {};
        updateCartUI();
        document.getElementById('checkoutForm').reset();
        toggleCardDetails();
    
        // Mostrar seguimiento
        const checkoutView = document.getElementById('checkoutView');
        const homeView = document.getElementById('homeView');
        const trackingView = document.getElementById('trackingView');
        showView(trackingView, [homeView, checkoutView, trackingView]);
        startOrderTracking(paymentMethod, responseData);

        showToast('Pedido guardado correctamente', 'success');
    } catch (error) {
        showToast(error.message || 'No se pudo guardar el pedido', 'danger');
    }
}

// Mostrar vista
function showView(viewToShow, allViews) {
    allViews.forEach(view => {
        if (view) {
            view.style.display = 'none';
        }
    });
    if (viewToShow) {
        viewToShow.style.display = 'block';
        window.scrollTo(0, 0);
    }
}

// Iniciar seguimiento de pedidos
function startOrderTracking(paymentMethod, savedOrder = null) {
    const orderNumber = savedOrder?.orderNumber || ('#FJ' + Math.floor(Math.random() * 10000));
    const orderDate = savedOrder?.createdAt
        ? new Date(savedOrder.createdAt).toLocaleDateString('es-PE')
        : new Date().toLocaleDateString('es-PE');
    
    document.getElementById('orderNumber').textContent = orderNumber;
    document.getElementById('orderDate').textContent = orderDate;
    document.getElementById('orderPayment').textContent = paymentMethod === 'card' ? 'Tarjeta de crédito/débito' : 'Efectivo al recibir';
    
    // Restablecer al estado de preparación
    updateOrderStatus('preparing');
    
    // Simular el progreso del pedido
    setTimeout(() => {
        updateOrderStatus('on-the-way');
    }, 8000);
    
    setTimeout(() => {
        updateOrderStatus('delivered');
    }, 18000);
}

// Actualizar estado del pedido
function updateOrderStatus(status) {
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
    
    // Restablecer clases
    step1.classList.remove('active', 'completed');
    step2.classList.remove('active', 'completed');
    step3.classList.remove('active', 'completed');
    line1.classList.remove('active', 'completed');
    line2.classList.remove('active', 'completed');
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

// Clases de restablecimiento
function showToast(message, type = 'success') {
    // Clases de restablecimiento
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
    
    // Crear contenedor si no existe
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    
    // Retirar
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Desplazamiento suave para enlaces de anclaje
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#home') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});
