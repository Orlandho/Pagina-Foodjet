import * as api from './api.js';
import * as state from './state.js';
import * as ui from './ui.js';

// Inicializar aplicación (Punto de entrada)
document.addEventListener('DOMContentLoaded', async function() {
    // Exponer temporalmente para testing y compatibilidad con legacy
    window.state = state;
    window.ui = ui;

    await initCatalog();
    initEventListeners();
    ui.updateCartUI();
});

async function initCatalog() {
    const products = await api.fetchProductsAPI();

    if (products.length === 0) {
        ui.showToast('No se pudieron cargar los productos o el catálogo está vacío', 'warning');
    }

    state.setProducts(products);
    ui.renderProducts();
}

function initEventListeners() {
    // Carrito y Checkout listeners
    document.getElementById('cartBtn')?.addEventListener('click', openCart);
    document.getElementById('checkoutBtn')?.addEventListener('click', handleCheckoutNavigation);
    document.getElementById('checkoutForm')?.addEventListener('submit', handleCheckoutSubmit);

    // Botones de "Volver"
    document.getElementById('backToMenuBtn')?.addEventListener('click', () => ui.showView('homeView'));
    document.getElementById('backToMenuFromTracking')?.addEventListener('click', () => ui.showView('homeView'));

    // Payment method toggle
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', ui.toggleCardDetails);
    });
}

function openCart() {
    // eslint-disable-next-line no-undef
    const cartOffcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
    cartOffcanvas.show();
}

function handleCheckoutNavigation() {
    if (state.isCartEmpty()) {
        ui.showToast('El carrito está vacío', 'warning');
        return;
    }

    // Verificar autenticación global gestionada en legacy.js
    if (!window.currentUser) {
        // eslint-disable-next-line no-undef
        const cartOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
        if (cartOffcanvas) cartOffcanvas.hide();

        setTimeout(() => {
            // eslint-disable-next-line no-undef
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
            ui.showToast('Por favor inicia sesión para continuar', 'info');
        }, 300);
        return;
    }

    ui.showView('checkoutView');

    // eslint-disable-next-line no-undef
    const cartOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
    if (cartOffcanvas) {
        cartOffcanvas.hide();
    }

    ui.renderCheckoutSummary();
    ui.fillCheckoutUserData();
    ui.requestUserLocation();
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();

    if (state.isCartEmpty()) {
        ui.showToast('El carrito está vacío', 'warning');
        return;
    }

    const paymentMethodElement = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = paymentMethodElement ? paymentMethodElement.value : 'cash';

    if (!window.authToken) {
        ui.showToast('Debes iniciar sesión para completar la compra', 'warning');
        return;
    }

    // Preparar items para la API
    const cart = state.getCart();
    const items = Object.entries(cart).map(([productId, quantity]) => ({
        productId: parseInt(productId),
        cantidad: quantity
    }));

    // Preparar payload completo (con valores temporales hardcoded para restaurante y dirección)
    const orderPayload = {
        items: items,
        metodo_pago: paymentMethod,
        // TODO: Implementar selección dinámica de dirección y restaurante
        restaurante_id: 1,
        direccion_entrega_id: 1
    };

    try {
        const result = await api.createOrderAPI(orderPayload, window.authToken);

        if (result.ok) {
            // Limpiar carrito
            state.clearCart();
            ui.updateCartUI();

            // Mostrar seguimiento
            ui.showView('trackingView');
            ui.startOrderTracking(paymentMethod, result.data.order);
        } else {
            ui.showToast(result.data.error || 'Error al procesar el pedido', 'warning');
        }
    } catch (err) {
        console.error(err);
        ui.showToast('Error de conexión al crear el pedido', 'warning');
    }
}

// ==========================================
// MÉTODOS PÚBLICOS GLOBALES
// (Necesarios para onClick en HTML y compatibilidad)
// ==========================================
window.app = {
    handleAddToCart: (productId) => {
        if (state.addToCart(productId)) {
            ui.updateProductControls(productId);
            ui.updateCartUI();
            ui.showToast('Producto agregado al carrito');
        } else {
            ui.showToast('Producto no disponible o agotado', 'warning');
        }
    },
    handleRemoveFromCart: (productId) => {
        state.removeFromCart(productId);
        ui.updateProductControls(productId);
        ui.updateCartUI();
    },
    handleRemoveItemCompletely: (productId) => {
        state.removeItemCompletely(productId);
        ui.updateProductControls(productId);
        ui.updateCartUI();
    },
    showView: (viewId) => {
        ui.showView(viewId);
    }
};
