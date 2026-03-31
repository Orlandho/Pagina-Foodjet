// ============================
// FoodJet - JavaScript
// ============================
// Datos de Productos
const products = [
    {
        id: 1,
        name: "Hamburguesa Clásica",
        description: "Jugosa hamburguesa con queso, lechuga, tomate y salsa especial",
        price: 18.90,
        image: "https://images.unsplash.com/photo-1651843465180-5965076f7368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
        category: "Hamburguesas"
    },
    {
        id: 2,
        name: "Pizza Napolitana",
        description: "Pizza tradicional con salsa de tomate, mozzarella y albahaca fresca",
        price: 32.90,
        image: "https://images.unsplash.com/photo-1678443238947-e58d71bf2e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
        category: "Pizzas"
    },
    {
        id: 3,
        name: "Ramen Picante",
        description: "Deliciosos fideos japoneses en caldo picante con cerdo y huevo",
        price: 25.90,
        image: "https://images.unsplash.com/photo-1652937916838-09b9c2ff8b45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
        category: "Asiática"
    },
    {
        id: 4,
        name: "Sushi Mix",
        description: "Variedad de sushi fresco con salmón, atún y vegetales",
        price: 45.90,
        image: "https://images.unsplash.com/photo-1625937751876-4515cd8e78bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
        category: "Asiática"
    },
    {
        id: 5,
        name: "Alitas BBQ",
        description: "Alitas de pollo crujientes con salsa BBQ casera",
        price: 22.90,
        image: "https://images.unsplash.com/photo-1618416682145-2fe1aaa6bd40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
        category: "Pollo"
    },
    {
        id: 6,
        name: "Cheesecake de Fresa",
        description: "Delicioso cheesecake con topping de fresas frescas",
        price: 15.90,
        image: "https://images.unsplash.com/photo-1759426016293-1b8be5849a72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
        category: "Postres"
    },
    {
        id: 7,
        name: "Ensalada César",
        description: "Ensalada fresca con pollo, crutones y aderezo césar",
        price: 18.90,
        image: "https://images.unsplash.com/photo-1654458804670-2f4f26ab3154?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500",
        category: "Saludable"
    },
    {
        id: 8,
        name: "Tacos al Pastor",
        description: "Tres tacos mexicanos con carne al pastor y piña",
        price: 19.90,
        image: "https://www.elfinanciero.com.mx/resizer/v2/PI7RTVF57RBAVEASTTWNJTW4OU.jpg?smart=true&auth=6e8833568df9cf61a4935c3c8f1a6c7139315e31d037857dfe33c09c68b59eb9&width=1440&height=810",
        category: "Mexicana"
    }
];

// Gestión del Estado
let cart = {}; // Carrito de compras
let currentUser = null; // { name: '...', email: '...', role: 'customer' | 'admin' }
let charts = {}; // Almacenar instancias de gráficos para destruirlas después
let orderPaymentMethod = 'cash';

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Vistas
    const homeView = document.getElementById('homeView');
    const checkoutView = document.getElementById('checkoutView');
    const trackingView = document.getElementById('trackingView');
    const dashboardView = document.getElementById('dashboardView');
    const allViews = [homeView, checkoutView, trackingView, dashboardView];

    renderProducts();
    initializeEventListeners(allViews);
    updateCartUI();
});

// Productos de renderizado
function renderProducts() {
    const grid = document.getElementById('productsGrid');
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
    const dashboardView = document.getElementById('dashboardView');

    // --- ELEMENTOS DEL DASHBOARD ---
    const dashboardBtn = document.getElementById('dashboardBtn');
    const backToMenuFromDashboard = document.getElementById('backToMenuFromDashboard');
    const orderNowFromDashboard = document.getElementById('orderNowFromDashboard');
    const logoutBtnDashboard = document.getElementById('logoutBtnDashboard');

    // --- ELEMENTOS DE NAVEGACIÓN DE USUARIO ---
    const logoutBtn = document.getElementById('logoutBtn');

    // Cart button
    document.getElementById('cartBtn').addEventListener('click', openCart);
    
    // Login button
    document.getElementById('loginBtn').addEventListener('click', () => {
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
    });
    
    // Checkout button
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', (e) => handleLogin(e, allViews));
    
    // Quick demo button
    document.getElementById('quickDemoBtn').addEventListener('click', () => handleQuickDemo(allViews));
    
    // Checkout form
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckoutSubmit);
    
    // Back to menu buttons
    document.getElementById('backToMenuBtn').addEventListener('click', () => showView(homeView, allViews));
    document.getElementById('backToMenuFromTracking').addEventListener('click', () => showView(homeView, allViews));
    document.getElementById('backToMenuFromDashboard').addEventListener('click', () => showView(homeView, allViews));
    
    // Payment method toggle
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', toggleCardDetails);
    });

    // --- EVENT LISTENERS PARA EL DASHBOARD ---
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            displayDashboard(allViews);
        });
    }

    if (orderNowFromDashboard) {
        orderNowFromDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            showView(homeView, allViews);
            setTimeout(() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }), 100);
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => handleLogout(e, allViews));
    }
    if (logoutBtnDashboard) {
        logoutBtnDashboard.addEventListener('click', (e) => handleLogout(e, allViews));
    }
}

// Inicializar eventos
function openCart() {
    const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
    cartOffcanvas.show();
}

// Iniciar sesión
function handleLogin(e, allViews) {
    e.preventDefault();
    const name = document.getElementById('loginName').value.trim();
    const email = document.getElementById('loginEmail').value.trim();
    
    if (name) {
        // Lógica simple para rol de admin
        const role = name.toLowerCase() === 'admin' ? 'admin' : 'customer';
        currentUser = { name: name, email: email, role: role };
        updateUserUI(currentUser);
        
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal.hide();
        
        showToast(`¡Bienvenido, ${name}!`);
        document.getElementById('loginForm').reset();
    }
}

// Inicio Demo
function handleQuickDemo(allViews) {
    currentUser = { name: "Usuario Demo", email: "demo@foodjet.com", role: "customer" };
    updateUserUI(currentUser);
    
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    loginModal.hide();
    
    showToast('¡Bienvenido, Usuario Demo!');
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
    const dashboardUserName = document.getElementById('dashboardUserName');
    const dashboardUserEmail = document.getElementById('dashboardUserEmail');

    const dashboardBtn = document.getElementById('dashboardBtn');
    if (user) {
        // Usuario ha iniciado sesión
        userNameDropdown.textContent = user.name;
        dashboardUserName.textContent = user.name;
        dashboardUserEmail.textContent = user.email || 'No se ha proporcionado email';
        userMenu.style.display = 'block';
        loginNav.style.display = 'none';

        // Mostrar botón de dashboard solo si es admin
        dashboardBtn.style.display = user.role === 'admin' ? 'block' : 'none';

        // Cambiar el ícono si es admin
        const userIcon = userMenu.querySelector('i');
        userIcon.classList.toggle('bi-person-gear', user.role === 'admin');
        userIcon.classList.toggle('bi-person-circle', user.role !== 'admin');
    } else {
        // Usuario ha cerrado sesión
        userMenu.style.display = 'none';
        loginNav.style.display = 'block';
        dashboardBtn.style.display = 'none';
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
    const dashboardView = document.getElementById('dashboardView');
    showView(checkoutView, [homeView, checkoutView, trackingView, dashboardView]);
    
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
function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    orderPaymentMethod = paymentMethod;
    
    // Limpiar carrito
    cart = {};
    updateCartUI();
    
    // Mostrar seguimiento
    const checkoutView = document.getElementById('checkoutView');
    const homeView = document.getElementById('homeView');
    const trackingView = document.getElementById('trackingView');
    const dashboardView = document.getElementById('dashboardView');
    showView(trackingView, [homeView, checkoutView, trackingView, dashboardView]);
    startOrderTracking(paymentMethod);
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
function startOrderTracking(paymentMethod) {
    const orderNumber = '#FJ' + Math.floor(Math.random() * 10000);
    const orderDate = new Date().toLocaleDateString('es-PE');
    
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

// --- LÓGICA DEL DASHBOARD ---

function displayDashboard(allViews) {
    // Esta función ahora solo es llamada por administradores.
    const dashboardView = document.getElementById('dashboardView');
    showView(dashboardView, allViews);
    // Renderiza directamente los gráficos del administrador.
    renderAdminCharts();
}

// --- FUNCIONES PARA GRÁFICOS DEL ADMIN ---
function renderAdminCharts() {
    // Destruir gráficos anteriores para evitar duplicados
    Object.values(charts).forEach(chart => chart.destroy());

    // Datos de ejemplo para los gráficos
    const salesData = {
        labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        datasets: [{
            label: 'Ventas (S/)',
            data: [120, 190, 300, 500, 210, 350, 450],
            fill: false,
            borderColor: 'rgb(245, 175, 105)',
            tension: 0.1
        }]
    };

    const topProductsData = {
        labels: ['Hamburguesa', 'Pizza', 'Sushi', 'Tacos', 'Alitas BBQ'],
        datasets: [{
            label: 'Unidades Vendidas',
            data: [65, 59, 80, 81, 56],
            backgroundColor: [
                'rgba(243, 157, 74, 0.5)',
                'rgba(245, 175, 105, 0.5)',
                'rgba(254, 243, 232, 0.8)',
                'rgba(108, 117, 125, 0.5)',
                'rgba(26, 26, 26, 0.5)',
            ],
            borderColor: [
                'rgb(243, 157, 74)',
                'rgb(245, 175, 105)',
                'rgb(254, 243, 232)',
                'rgb(108, 117, 125)',
                'rgb(26, 26, 26)',
            ],
            borderWidth: 1
        }]
    };

    const categoryData = {
        labels: ['Hamburguesas', 'Pizzas', 'Asiática', 'Mexicana', 'Postres'],
        datasets: [{
            label: 'Ventas por Categoría',
            data: [300, 500, 400, 200, 150],
            backgroundColor: [
                '#f5af69',
                '#f39d4a',
                '#6c757d',
                '#fef3e8',
                '#1a1a1a'
            ],
            hoverOffset: 4
        }]
    };

    // Crear Gráfico de Ventas
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    charts.sales = new Chart(salesCtx, {
        type: 'line',
        data: salesData,
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Crear Gráfico de Productos Top
    const productsCtx = document.getElementById('topProductsChart').getContext('2d');
    charts.products = new Chart(productsCtx, {
        type: 'bar',
        data: topProductsData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Crear Gráfico de Categorías
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    charts.categories = new Chart(categoryCtx, {
        type: 'doughnut',
        data: categoryData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
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
