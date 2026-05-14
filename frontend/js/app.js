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
    ui.renderFoodTypeFilters();


    ui.renderProducts();
}

function initEventListeners() {
    // Carrito y Checkout listeners
    document.getElementById('cartBtn')?.addEventListener('click', openCart);
    document.getElementById('checkoutBtn')?.addEventListener('click', handleCheckoutNavigation);

    // Filtros listeners
    const btnApplyFilters = document.getElementById('btn-apply-filters');
    if (btnApplyFilters) {
        btnApplyFilters.addEventListener('click', () => {
            ui.renderFoodTypeFilters();
    ui.renderProducts();
        });
    }

    const btnClearFilters = document.getElementById('btn-clear-filters');
    if (btnClearFilters) {
        btnClearFilters.addEventListener('click', () => {
            // Uncheck all checkboxes
            document.querySelectorAll('.filter-food-type').forEach(cb => cb.checked = false);

            // Clear price inputs
            const minPrice = document.getElementById('filter-price-min');
            if (minPrice) minPrice.value = '';

            const maxPrice = document.getElementById('filter-price-max');
            if (maxPrice) maxPrice.value = '';

            // Uncheck all radio buttons
            document.querySelectorAll('.filter-delivery-time').forEach(rb => rb.checked = false);

            // Re-render
            ui.renderFoodTypeFilters();
    ui.renderProducts();
        });
    }
    document.getElementById('checkoutForm')?.addEventListener('submit', handleCheckoutSubmit);

    // Botones de "Volver"
    document.getElementById('backToMenuBtn')?.addEventListener('click', () => ui.showView('homeView'));
    document.getElementById('backToMenuFromTracking')?.addEventListener('click', () => ui.showView('homeView'));


    // Historial y Reseñas
    document.getElementById('historyBtn')?.addEventListener('click', handleHistoryClick);
    document.getElementById('backToMenuFromHistory')?.addEventListener('click', () => ui.showView('homeView'));

    // Ver Historial desde Tracking
    const viewHistoryTrackingBtn = document.querySelector('#trackingView .btn-outline-secondary');
    if (viewHistoryTrackingBtn) {
        viewHistoryTrackingBtn.addEventListener('click', handleHistoryClick);
    }

    // Estrellas Modal
    document.getElementById('starRatingContainer')?.addEventListener('click', handleStarRatingClick);
    document.getElementById('reviewForm')?.addEventListener('submit', handleReviewSubmit);

    // Delegación para botones de calificación
    document.getElementById('orderHistoryContainer')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.open-review-modal');
        if (btn) {
            openReviewModal(btn.dataset.orderId, btn.dataset.restaurantName, btn.dataset.orderDate);
        }
    });

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

    // Obtener dinámicamente el restaurante_id a partir del primer producto del carrito
    const firstItemProductId = Object.keys(cart)[0];
    const firstProduct = state.getProductById(firstItemProductId);
    const restauranteId = firstProduct ? firstProduct.restaurante_id : 1;

    // Preparar payload completo (con valores temporales hardcoded para dirección)
    const orderPayload = {
        items: items,
        metodo_pago: paymentMethod,
        restaurante_id: restauranteId,
        // TODO: Implementar selección dinámica de dirección
        direccion_entrega_id: 1
    };

    if (paymentMethod === 'wallet') {
        const restaurante = firstProduct ? firstProduct.restaurante : null;
        if (!restaurante || !restaurante.qr_pago) {
            ui.showToast('No se encontró el QR de pago para este restaurante', 'warning');
            return;
        }

        const qrModalElement = document.getElementById('qrModal');
        // eslint-disable-next-line no-undef
        const qrModal = bootstrap.Modal.getOrCreateInstance(qrModalElement);

        document.getElementById('qrRestaurantName').textContent = restaurante.nombre;
        document.getElementById('qrPaymentImage').src = restaurante.qr_pago;

        const timerText = document.getElementById('qrTimerText');
        let secondsLeft = 5;
        timerText.textContent = `Esperando confirmación de pago... (${secondsLeft}s)`;

        const cancelBtn = document.getElementById('cancelQrPaymentBtn');
        let timerInterval;

        const finishPayment = async () => {
            clearInterval(timerInterval);
            qrModal.hide();
            await submitOrder(orderPayload, paymentMethod);
        };

        const handleCancel = () => {
            clearInterval(timerInterval);
            qrModal.hide();
        };

        cancelBtn.addEventListener('click', handleCancel, { once: true });

        qrModalElement.addEventListener('hidden.bs.modal', () => {
            clearInterval(timerInterval);
            cancelBtn.removeEventListener('click', handleCancel);
        }, { once: true });

        timerInterval = setInterval(() => {
            secondsLeft--;
            timerText.textContent = `Esperando confirmación de pago... (${secondsLeft}s)`;

            if (secondsLeft <= 0) {
                finishPayment();
            }
        }, 1000);

        qrModal.show();
    } else {
        await submitOrder(orderPayload, paymentMethod);
    }
}

async function submitOrder(orderPayload, paymentMethod) {
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

// ===================================// MÉTODOS PÚBLICOS GLOBALES
// (Necesarios para onClick en HTML y compatibilidad)

// ==========================================
// MÉTODOS PÚBLICOS GLOBALES
// (Necesarios para onClick en HTML y compatibilidad)
// ==========================================
window.app = {
    loadFavorites,

    handleToggleFavorite: async (productId) => {
        if (!window.currentUser) {
            ui.showToast('Debes iniciar sesión para guardar favoritos', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/favorites/${productId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                if (data.message.includes('eliminado')) {
                    state.favorites = state.favorites.filter(id => id !== productId);
                    ui.showToast('Producto eliminado de favoritos', 'info');
                } else {
                    state.favorites.push(productId);
                    ui.showToast('Producto añadido a favoritos', 'success');
                }
                ui.updateFavoriteButtons(productId);
                await loadFavorites();
            } else {
                ui.showToast(data.error || 'Error al actualizar favorito', 'warning');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            ui.showToast('Error de conexión', 'warning');
        }
    },

    handleAddToCart: (productId) => {
        const result = state.addToCart(productId);
        if (result.success) {
            ui.updateProductControlsInAllViews(productId);
            ui.updateCartUI();
            ui.showToast('Producto agregado al carrito');
        } else {
            if (result.error === 'DIFFERENT_RESTAURANT') {
                ui.showToast('No puedes mezclar productos de diferentes restaurantes. Termina tu pedido actual primero.', 'warning');
            } else {
                ui.showToast('Producto no disponible o agotado', 'warning');
            }
        }
    },
    handleRemoveFromCart: (productId) => {
        state.removeFromCart(productId);
        ui.updateProductControlsInAllViews(productId);
        ui.updateCartUI();
    },
    handleRemoveItemCompletely: (productId) => {
        state.removeItemCompletely(productId);
        ui.updateProductControlsInAllViews(productId);
        ui.updateCartUI();
    },
    showView: (viewId) => {
        ui.showView(viewId);
    }
};


// --- Historial y Reseñas ---

async function handleHistoryClick(e) {
    if (e) e.preventDefault();
    if (!window.authToken) {
        ui.showToast('Inicia sesión para ver tu historial', 'warning');
        return;
    }

    const orders = await api.fetchMyOrdersAPI(window.authToken);
    ui.renderOrderHistory(orders);
    ui.showView('orderHistoryView');
}

function openReviewModal(orderId, restaurantName, orderDate) {
    document.getElementById('reviewOrderId').value = orderId;
    document.getElementById('reviewRestaurantName').textContent = restaurantName;
    document.getElementById('reviewOrderDate').textContent = orderDate;

    // Reset stars
    document.getElementById('reviewRating').value = '';
    document.getElementById('reviewComment').value = '';
    const stars = document.querySelectorAll('#starRatingContainer .bi-star, #starRatingContainer .bi-star-fill');
    stars.forEach(s => {
        s.classList.remove('bi-star-fill');
        s.classList.add('bi-star');
    });

    const reviewModal = new bootstrap.Modal(document.getElementById('reviewModal'));
    reviewModal.show();
}

function handleStarRatingClick(e) {
    const star = e.target.closest('.bi');
    if (!star) return;

    const rating = parseInt(star.dataset.rating);
    document.getElementById('reviewRating').value = rating;

    const stars = document.querySelectorAll('#starRatingContainer .bi');
    stars.forEach(s => {
        const r = parseInt(s.dataset.rating);
        if (r <= rating) {
            s.classList.remove('bi-star');
            s.classList.add('bi-star-fill');
        } else {
            s.classList.remove('bi-star-fill');
            s.classList.add('bi-star');
        }
    });
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    const orderId = document.getElementById('reviewOrderId').value;
    const rating = document.getElementById('reviewRating').value;
    const comment = document.getElementById('reviewComment').value;

    if (!rating) {
        ui.showToast('Por favor, selecciona una calificación', 'warning');
        return;
    }

    const submitBtn = document.getElementById('submitReviewBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';

    const payload = {
        pedido_id: parseInt(orderId),
        puntuacion: parseInt(rating),
        comentario: comment
    };

    const result = await api.createReviewAPI(payload, window.authToken);

    if (result.ok) {
        ui.showToast('¡Gracias por tu reseña!', 'success');
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
        if (modalInstance) modalInstance.hide();

        // Recargar el historial y productos para actualizar las estrellas
        handleHistoryClick();

        // Background refresh of products
        api.fetchProductsAPI().then(products => {
            state.setProducts(products);
            ui.renderProducts();
        });
    } else {
        ui.showToast(result.data.error || 'Error al enviar reseña', 'danger');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar Calificación';
}

document.addEventListener('DOMContentLoaded', () => {
    // Escuchar botón "Mi Cuenta"
    document.getElementById('miCuentaBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!window.currentUser) {
            ui.showToast('Debes iniciar sesión primero.', 'warning');
            return;
        }

        // Configurar modal
        const statusContainer = document.getElementById('studentStatusContainer');
        const formContainer = document.getElementById('verifyStudentFormContainer');

        if (window.currentUser.es_estudiante) {
            statusContainer.className = 'alert alert-success';
            statusContainer.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i><strong>Verificado</strong> - Disfrutas de descuentos para estudiantes.';
            formContainer.style.display = 'none';
        } else {
            statusContainer.className = 'alert alert-secondary';
            statusContainer.innerHTML = '<i class="bi bi-info-circle-fill me-2"></i>No verificado';
            formContainer.style.display = 'block';
        }

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('miCuentaModal'));
        modal.show();
    });

    // Manejar el submit del form de verificación
    document.getElementById('verifyStudentForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('carnetImage');
        if (!fileInput.files || fileInput.files.length === 0) {
            ui.showToast('Por favor, selecciona una imagen.', 'warning');
            return;
        }

        const submitBtn = document.getElementById('verifyStudentSubmitBtn');
        const spinner = submitBtn.querySelector('.spinner-border');

        // UI Loading
        submitBtn.disabled = true;
        spinner.classList.remove('d-none');

        const result = await api.verifyStudentAPI(fileInput.files[0], window.authToken);

        // Restore UI
        submitBtn.disabled = false;
        spinner.classList.add('d-none');

        if (result.ok) {
            ui.showToast('¡Verificación exitosa! Ahora tienes descuentos de estudiante.', 'success');

            // Actualizar estado local
            window.currentUser.es_estudiante = true;

            // Refrescar modal (ocultar form, mostrar verificado)
            document.getElementById('studentStatusContainer').className = 'alert alert-success';
            document.getElementById('studentStatusContainer').innerHTML = '<i class="bi bi-check-circle-fill me-2"></i><strong>Verificado</strong> - Disfrutas de descuentos para estudiantes.';
            document.getElementById('verifyStudentFormContainer').style.display = 'none';

            // Refrescar catálogo (precios tachados) y el checkout si está abierto
            ui.renderProducts();
            ui.updateCartUI();
            if (document.getElementById('checkoutView').style.display !== 'none') {
                ui.renderCheckoutSummary();
            }

            // Opcional: Cerrar modal
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('miCuentaModal'));
                if(modal) modal.hide();
            }, 1500);

        } else {
            ui.showToast(result.data.error || 'Error en la verificación', 'danger');
        }
    });
});