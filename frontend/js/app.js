import * as api from './api.js';
import * as state from './state.js';
import * as ui from './ui.js';
import { validateCard, formatCardNumber, formatExpiry, detectBrand } from './domain/payment.js';
import { buildOrderPayload, validateCoupon } from './domain/checkout.js';
import { getProductRestaurant, getCartRestaurant } from './domain/catalog.js';
import { loadFavorites } from './favorites.js';
import { sanitizePhone, validatePhone } from './domain/validation.js';
import { isTokenExpired, isAuthFailure } from './domain/session.js';
import { buscarDireccionGuardada, faltaMarcarUbicacion, coordenadasValidas } from './domain/ubicacion.js';
import { crearMapaSeguimiento } from './mapaSeguimiento.js';
import { iniciarMapaEntrega, obtenerUbicacion, enfocarMapa } from './mapaEntrega.js';

// El cuerpo de este módulo se ejecuta antes de que se dispare
// DOMContentLoaded, así que legacy.js —que es un script clásico y no puede
// importar módulos— ya encuentra estos helpers, tanto al restaurar la sesión
// como al registrar los listeners de los formularios.
window.FoodJetSession = { isTokenExpired, isAuthFailure };
// legacy.js es un script clásico y no puede importar módulos: el panel de
// operaciones toma de aquí el mapa del reparto.
window.FoodJetMapas = { crearMapaSeguimiento, fetchConfigAPI: api.fetchConfigAPI };
window.FoodJetValidation = { sanitizePhone, validatePhone };

// Inicializar aplicación (Punto de entrada)
document.addEventListener('DOMContentLoaded', async function() {
    // Exponer temporalmente para testing y compatibilidad con legacy
    window.state = state;
    window.ui = ui;

    descartarSesionCaducada();

    await initCatalog();
    initEventListeners();
    ui.renderCartOffcanvas(); 
    ui.renderCheckoutCart();
});

/**
 * Cierra la sesión si el token guardado ya caducó.
 *
 * legacy.js restaura la sesión desde localStorage sin mirar la fecha de
 * caducidad, así que tras 24 horas la interfaz mostraba al usuario como
 * conectado mientras el servidor rechazaba cada petición con
 * "Token inválido o expirado". El síntoma aparecía al comprar, que es la
 * primera acción que necesita el token.
 *
 * La comprobación principal vive en checkExistingSession (legacy.js), que se
 * ejecuta antes; esta queda como red de seguridad por si aquello no llegara a
 * correr.
 */
function descartarSesionCaducada() {
    if (!window.authToken) return;
    if (!isTokenExpired(window.authToken)) return;

    cerrarSesionCaducada('Tu sesión expiró. Vuelve a iniciar sesión.');
}

/**
 * Limpia la sesión y avisa al usuario.
 *
 * No delega en handleLogout a propósito: ese anuncia "Has cerrado sesión", y
 * aquí el usuario no cerró nada, se le caducó.
 */
function cerrarSesionCaducada(mensaje) {
    window.authToken = null;
    window.currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (typeof window.updateUserUI === 'function') window.updateUserUI(null);

    ui.showToast(mensaje, 'warning');
}

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
    // NUEVO: Hacer que los botones del menú superior siempre muestren la vista principal
    document.querySelectorAll('.navbar-nav .nav-link, .navbar-brand').forEach(link => {
        link.addEventListener('click', () => {
            ui.showView('homeView');
        });
    });

    // Carrito y Checkout listeners (Esto es lo que ya tenías)
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', openCart);
    }

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckoutNavigation);
    }

    // Filtros listeners
    const btnApplyFilters = document.getElementById('btn-apply-filters');
    if (btnApplyFilters) {
        btnApplyFilters.addEventListener('click', () => {
            ui.renderProducts();
        });
    }

    const btnClearFilters = document.getElementById('btn-clear-filters');
    if (btnClearFilters) {
        btnClearFilters.addEventListener('click', () => {
            ui.resetAllCatalogFilters();
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
    const viewHistoryTrackingBtn = document.getElementById('trackingHistoryBtn');
    if (viewHistoryTrackingBtn) {
        viewHistoryTrackingBtn.addEventListener('click', handleHistoryClick);
    }

    // Estrellas Modal (Interacción hover & click)
    const starContainer = document.getElementById('starRatingContainer');
    if (starContainer) {
        starContainer.addEventListener('click', handleStarRatingClick);
        starContainer.addEventListener('mouseover', handleStarRatingHover);
        starContainer.addEventListener('mouseleave', handleStarRatingLeave);
    }
    document.getElementById('reviewForm')?.addEventListener('submit', handleReviewSubmit);

    // Delegación para botones de calificación
    document.getElementById('orderHistoryContainer')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.open-review-modal, .btn-leave-review');
        if (btn) {
            openReviewModal(btn.dataset.orderId, btn.dataset.restaurantName || 'Restaurante', btn.dataset.orderDate || 'Fecha reciente');
        }
    });

    // Payment method toggle
    setupCardInputs();
    setupPhoneInput('customerPhone', 'customerPhoneError');
    setupCouponHandlers();
    setupCancelOrderHandler();

    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (typeof ui.toggleCardDetails === 'function') {
                ui.toggleCardDetails();
            }
        });
    });
}

function openCart() {
    // eslint-disable-next-line no-undef
    const cartOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('cartOffcanvas'));
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
    const cartOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('cartOffcanvas'));
    if (cartOffcanvas) {
        cartOffcanvas.hide();
    }

    if (typeof ui.renderCheckoutSummary === 'function') ui.renderCheckoutSummary();
    if (typeof ui.fillCheckoutUserData === 'function') ui.fillCheckoutUserData();
    if (typeof ui.toggleCardDetails === 'function') ui.toggleCardDetails();
    setOrderSubmittingState(false);
    abrirMapaEntrega();
}

/**
 * Abre el mapa para marcar el punto exacto de entrega.
 *
 * Si no puede usarse (sin key de Google Maps o con la key rechazada) se vuelve
 * a lo de antes: el GPS del navegador rellena la dirección escrita.
 */
async function abrirMapaEntrega() {
    const [config, guardadas] = await Promise.all([
        api.fetchConfigAPI(),
        api.fetchMyAddressesAPI(window.authToken)
    ]);

    await iniciarMapaEntrega({
        apiKey: config.googleMapsApiKey,
        apiKeys: config.googleMapsApiKeys,
        guardadas,
        alFallar: () => ui.requestUserLocation()
    });
}

// ==========================================
// CÓDIGO REFACTORIZADO
// ==========================================

// Control de envío único y estado del botón de confirmación
let isSubmittingOrder = false;

function setOrderSubmittingState(isSubmitting) {
    isSubmittingOrder = isSubmitting;
    const confirmBtn = document.getElementById('confirmOrderBtn');
    const spinner = document.getElementById('confirmOrderSpinner');
    const text = document.getElementById('confirmOrderText');
    const arrow = document.getElementById('confirmOrderArrow');

    if (!confirmBtn) return;
    confirmBtn.disabled = isSubmitting;
    confirmBtn.classList.toggle('is-loading', isSubmitting);

    if (spinner) spinner.classList.toggle('d-none', !isSubmitting);
    if (arrow) arrow.classList.toggle('d-none', isSubmitting);
    if (text) {
        if (isSubmitting) {
            text.textContent = 'Registrando pedido...';
        } else {
            const method = document.querySelector('input[name="paymentMethod"]:checked')?.value;
            const totalText = document.getElementById('checkoutTotal')?.textContent || '';
            text.textContent = method === 'wallet' 
                ? (totalText ? `Ya pagué · ${totalText}` : 'Ya pagué')
                : 'Confirmar Pedido';
        }
    }
}

// 1. Función Principal (Orquestador)
async function handleCheckoutSubmit(e) {
    e.preventDefault();

    if (isSubmittingOrder) return;

    if (state.isCartEmpty()) {
        return ui.showToast('El carrito está vacío', 'warning');
    }

    const paymentMethodElement = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = paymentMethodElement ? paymentMethodElement.value : 'cash';

    if (!window.authToken) {
        return ui.showToast('Debes iniciar sesión para completar la compra', 'warning');
    }

    if (!validarTelefono('customerPhone', 'customerPhoneError')) {
        return ui.showToast('Revisa el teléfono de contacto', 'warning');
    }

    setOrderSubmittingState(true);

    try {
        const direccionId = await resolveDeliveryAddressId();
        if (!direccionId) {
            setOrderSubmittingState(false);
            return;
        }

        const activeCoupon = state.getActiveCoupon();
        const cuponId = activeCoupon ? activeCoupon.id : null;
        const orderPayload = buildOrderPayload(state.getCart(), state.getProductById, paymentMethod, direccionId, cuponId);

        if (paymentMethod === 'wallet') {
            await processWalletPayment(orderPayload, paymentMethod);
        } else if (paymentMethod === 'card') {
            await processCardPayment(orderPayload, paymentMethod);
        } else {
            await submitOrder(orderPayload, paymentMethod);
        }
    } catch (err) {
        console.error(err);
        setOrderSubmittingState(false);
        ui.showToast('Ocurrió un error inesperado al procesar el pedido', 'danger');
    }
}

/**
 * Resuelve la dirección de entrega del pedido.
 *
 * Antes se enviaba `direccion_entrega_id: 1` fijo, que apunta a la dirección
 * de otro usuario: cualquier pedido se entregaba allí. Ahora se reutiliza la
 * dirección guardada si coincide con lo escrito y con el punto del mapa, y si
 * no se crea.
 */
async function resolveDeliveryAddressId() {
    const input = document.getElementById('customerAddress');
    const texto = input?.value.trim();

    if (!texto) {
        ui.showToast('Indica la dirección de entrega', 'warning');
        input?.focus();
        return null;
    }

    // El punto es el destino del recorrido del repartidor: con el mapa a la
    // vista no se acepta un pedido sin él.
    const { disponible, coords: marcadas } = obtenerUbicacion();
    if (faltaMarcarUbicacion({ mapaDisponible: disponible, coords: marcadas })) {
        ui.showToast('Marca en el mapa dónde entregamos tu pedido', 'warning');
        enfocarMapa();
        return null;
    }

    // Sin mapa, las coordenadas (si las hay) las dejó el GPS en el campo.
    const coords = marcadas ?? coordenadasDelCampo(input);
    const referencia = document.getElementById('customerReference')?.value.trim() || null;

    const guardadas = await api.fetchMyAddressesAPI(window.authToken);
    const existente = buscarDireccionGuardada(guardadas, texto, coords);

    if (existente) return existente.id;

    const resultado = await api.createAddressAPI({
        direccion_detallada: texto,
        referencia,
        latitud: coords?.lat ?? null,
        longitud: coords?.lng ?? null,
        // La última dirección nueva pasa a ser la predeterminada: es donde
        // abrirá el mapa en el próximo pedido.
        es_predeterminada: true
    }, window.authToken);

    if (isAuthFailure(resultado.status)) {
        cerrarSesionCaducada('Tu sesión expiró. Inicia sesión de nuevo para completar la compra.');
        return null;
    }

    if (!resultado.ok) {
        ui.showToast(resultado.data?.error || 'No se pudo guardar la dirección', 'warning');
        return null;
    }

    return resultado.data.id;
}

/** Coordenadas que el GPS del navegador dejó en el campo, o null. */
function coordenadasDelCampo(input) {
    if (!input?.dataset.lat || !input?.dataset.lon) return null;
    const lat = Number(input.dataset.lat);
    const lng = Number(input.dataset.lon);
    return coordenadasValidas(lat, lng) ? { lat, lng } : null;
}

// ==========================================
// PAGO CON TARJETA
// ==========================================

/** Formatea el número y la fecha mientras se escriben. */
/**
 * Impide escribir cualquier cosa que no sea un teléfono válido.
 *
 * QA reportó que el campo aceptaba letras y más de 9 dígitos: el registro se
 * enviaba igual y solo fallaba en el servidor. Filtrar mientras se escribe
 * evita el viaje de ida y vuelta.
 */
function setupPhoneInput(inputId, errorId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', () => {
        const limpio = sanitizePhone(input.value);
        if (input.value !== limpio) input.value = limpio;

        input.classList.remove('is-invalid');
        const feedback = document.getElementById(errorId);
        if (feedback) feedback.textContent = '';
    });
}

/** Marca el campo si el teléfono no es válido y lleva el foco. @returns {boolean} */
function validarTelefono(inputId, errorId) {
    const input = document.getElementById(inputId);
    if (!input) return true;

    const { valid, error } = validatePhone(input.value);
    const feedback = document.getElementById(errorId);

    input.classList.toggle('is-invalid', !valid);
    if (feedback) feedback.textContent = valid ? '' : error;

    if (!valid) input.focus();
    return valid;
}

function setupCardInputs() {
    const numero = document.getElementById('cardNumber');
    const expiracion = document.getElementById('cardExpiry');
    const cvc = document.getElementById('cardCvc');

    numero?.addEventListener('input', (e) => {
        e.target.value = formatCardNumber(e.target.value);
        const marca = detectBrand(e.target.value);
        const brandIcon = document.getElementById('detectedBrandIcon');
        if (brandIcon) {
            if (marca === 'visa') {
                brandIcon.className = 'bi bi-credit-card-2-front-fill text-primary';
            } else if (marca === 'mastercard') {
                brandIcon.className = 'bi bi-credit-card-2-front-fill text-warning';
            } else if (marca === 'amex') {
                brandIcon.className = 'bi bi-credit-card-2-front-fill text-info';
            } else {
                brandIcon.className = 'bi bi-credit-card fs-6 text-muted';
            }
        }
    });
    expiracion?.addEventListener('input', (e) => { e.target.value = formatExpiry(e.target.value); });
    cvc?.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });

    // Al corregir un campo desaparece su error, sin esperar a reenviar.
    [numero, expiracion, cvc].forEach((campo) => {
        campo?.addEventListener('input', () => ui.clearFieldError(campo.id));
    });
}

function setupCouponHandlers() {
    const couponInput = document.getElementById('couponCode');
    const applyBtn = document.getElementById('applyCouponBtn');
    const removeBtn = document.getElementById('removeCouponBtn');
    const couponMessage = document.getElementById('couponMessage');

    if (!couponInput || !applyBtn) return;

    const handleApply = () => {
        const rawCode = couponInput.value;
        const { valid, error, coupon } = validateCoupon(rawCode);

        if (!valid) {
            state.setActiveCoupon(null);
            couponInput.classList.add('is-invalid');
            couponInput.classList.remove('is-valid');
            if (couponMessage) {
                couponMessage.innerHTML = `<span class="text-danger fw-semibold"><i class="bi bi-exclamation-circle me-1"></i>${error}</span>`;
            }
            ui.renderCheckoutCart();
            return;
        }

        state.setActiveCoupon(coupon);
        couponInput.classList.remove('is-invalid');
        couponInput.classList.add('is-valid');
        couponInput.disabled = true;
        applyBtn.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'inline-flex';

        if (couponMessage) {
            couponMessage.innerHTML = `
                <div class="alert alert-success py-2 px-3 rounded-3 mb-0 d-flex align-items-center">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <span>Cupón '<strong>${coupon.codigo}</strong>' (${coupon.porcentaje}%) aplicado</span>
                </div>
            `;
        }
        ui.renderCheckoutCart();
    };

    const handleRemove = () => {
        state.setActiveCoupon(null);
        couponInput.value = '';
        couponInput.disabled = false;
        couponInput.classList.remove('is-valid', 'is-invalid');
        applyBtn.style.display = 'inline-flex';
        if (removeBtn) removeBtn.style.display = 'none';
        if (couponMessage) couponMessage.innerHTML = '';
        ui.renderCheckoutCart();
    };

    applyBtn.addEventListener('click', handleApply);
    if (removeBtn) removeBtn.addEventListener('click', handleRemove);
    couponInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleApply();
        }
    });
}

function setupCancelOrderHandler() {
    const cancelBtn = document.getElementById('cancelOrderBtn');
    if (!cancelBtn) return;

    cancelBtn.addEventListener('click', async () => {
        const orderId = cancelBtn.dataset.orderId;
        if (!orderId) return;

        if (!confirm('¿Estás seguro de que deseas cancelar este pedido?')) return;

        cancelBtn.disabled = true;
        try {
            const API_URL = (typeof window !== 'undefined' && window.FOODJET_API_URL) || '/api';
            const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.authToken}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                ui.showToast('Pedido cancelado exitosamente', 'info');
                if (typeof ui.pollTrackingOnce === 'function') {
                    await ui.pollTrackingOnce();
                }
            } else {
                ui.showToast(data.error || 'No se pudo cancelar el pedido', 'warning');
            }
        } catch (error) {
            console.error('Error al cancelar pedido:', error);
            ui.showToast('Error al conectar con el servidor', 'danger');
        } finally {
            cancelBtn.disabled = false;
        }
    });
}

function readCardForm() {
    return {
        numero: document.getElementById('cardNumber')?.value || '',
        expiracion: document.getElementById('cardExpiry')?.value || '',
        cvc: document.getElementById('cardCvc')?.value || ''
    };
}

/**
 * Valida la tarjeta y simula la autorización bancaria.
 *
 * Los datos de la tarjeta no salen de aquí: el pedido viaja al backend solo
 * con metodo_pago = 'card'.
 */
async function processCardPayment(orderPayload, paymentMethod) {
    const datos = readCardForm();
    const { valid, errors, marca } = validateCard(datos);

    if (!valid) {
        setOrderSubmittingState(false);
        ui.showCardErrors(errors);
        return ui.showToast('Revisa los datos de tu tarjeta', 'warning');
    }

    ui.showCardErrors({});
    await ui.runCardAuthorization(marca);
    await submitOrder(orderPayload, paymentMethod);
}


// 3. Función Auxiliar: Maneja la lógica de la billetera y el QR in-place
async function processWalletPayment(orderPayload, paymentMethod) {
    const firstProduct = state.getProductById(Object.keys(state.getCart())[0]);
    const restaurante = getProductRestaurant(firstProduct);

    if (!restaurante || !restaurante.qr_pago) {
        setOrderSubmittingState(false);
        return ui.showToast('No se encontró el QR de pago para este restaurante', 'warning');
    }

    // El QR ya está presentado in-place en la zona de pago y el cliente presionó "Ya pagué".
    // Detenemos el temporizador y enviamos el pedido directamente.
    ui.stopInPlaceWalletQR();
    await submitOrder(orderPayload, paymentMethod);
}

// 4. Función Auxiliar: Compatibilidad de apertura de QR
function openQRModal(restaurante, orderPayload, paymentMethod) {
    processWalletPayment(orderPayload, paymentMethod);
}

async function submitOrder(orderPayload, paymentMethod) {
    try {
        const result = await api.createOrderAPI(orderPayload, window.authToken);

        if (result.ok) {
            // Limpiar carrito
            state.clearCart();
            state.setActiveCoupon(null);
            ui.renderCartOffcanvas(); 
            ui.renderCheckoutCart();

            // Mostrar seguimiento
            ui.showView('trackingView');
            ui.startOrderTracking(paymentMethod, result.data.order);
        } else if (isAuthFailure(result.status)) {
            // El token pudo caducar con la pestaña abierta, o el servidor pudo
            // reiniciarse con otro secreto. En ambos casos el mensaje crudo del
            // servidor ("Token inválido o expirado") no le dice al usuario qué
            // hacer, y la interfaz seguiría aparentando que tiene sesión.
            cerrarSesionCaducada('Tu sesión expiró. Inicia sesión de nuevo para completar la compra.');
        } else {
            ui.showToast(result.data.error || 'Error al procesar el pedido', 'warning');
        }
    } catch (err) {
        console.error(err);
        ui.showToast('Error de conexión al crear el pedido', 'warning');
    } finally {
        setOrderSubmittingState(false);
    }
}


// ==========================================
// MÉTODOS PÚBLICOS GLOBALES
// (Necesarios para onClick en HTML y compatibilidad)
// ==========================================
window.app = {

    loadFavorites: () => loadFavorites(),

    handleToggleFavorite: async (productId) => {
        if (!window.currentUser || !window.authToken) {
            ui.showToast('Debes iniciar sesión para guardar favoritos', 'warning');
            return;
        }

        try {
            const result = await api.toggleFavoriteAPI(productId, window.authToken);

            if (result.ok) {
                await window.app.loadFavorites();
                ui.showToast(result.data.isFavorite ? 'Añadido a favoritos' : 'Eliminado de favoritos', 'success');
            } else {
                ui.showToast(result.data.error || 'Error al actualizar favorito', 'warning');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            ui.showToast('Error de conexión', 'warning');
        }
    },
    handleAddToCart: (productId) => {
        const result = state.addToCart(productId);
        if (result.success) {
            ui.renderProducts();
            ui.renderCartOffcanvas(); 
            ui.renderCheckoutCart();
            ui.showToast('Producto agregado al carrito');
        } else {
            if (result.error === 'DIFFERENT_RESTAURANT') {
                const restaurante = getCartRestaurant(state.getCart(), state.getProductById);
                ui.showToast(
                    restaurante?.nombre
                        ? `Tu pedido es de ${restaurante.nombre}. Vacía el carrito para pedir de otro restaurante.`
                        : 'No puedes mezclar productos de diferentes restaurantes.',
                    'warning'
                );
            } else {
                ui.showToast('Producto no disponible o agotado', 'warning');
            }
        }
    },
    handleRemoveFromCart: (productId) => {
        state.removeFromCart(productId);
        ui.renderProducts();
        ui.renderCartOffcanvas(); 
        ui.renderCheckoutCart();
    },
    handleRemoveItemCompletely: (productId) => {
        state.removeItemCompletely(productId);
        ui.renderProducts();
        ui.renderCartOffcanvas(); 
        ui.renderCheckoutCart();
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
    document.getElementById('reviewRestaurantName').textContent = restaurantName || 'Restaurante';
    document.getElementById('reviewOrderDate').textContent = orderDate || 'Fecha reciente';

    // Reset stars
    document.getElementById('reviewRating').value = '';
    document.getElementById('reviewComment').value = '';
    const stars = document.querySelectorAll('#starRatingContainer .bi, #starRatingContainer .foodjet-star-icon');
    stars.forEach(s => {
        s.classList.remove('bi-star-fill');
        s.classList.add('bi-star');
        s.setAttribute('aria-checked', 'false');
    });

    const reviewModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('reviewModal'));
    reviewModal.show();
}

function handleStarRatingClick(e) {
    const star = e.target.closest('.foodjet-star-icon, .bi');
    if (!star) return;

    const rating = parseInt(star.dataset.rating);
    if (!rating) return;
    document.getElementById('reviewRating').value = rating;

    const stars = document.querySelectorAll('#starRatingContainer .bi, #starRatingContainer .foodjet-star-icon');
    stars.forEach(s => {
        const r = parseInt(s.dataset.rating);
        if (r <= rating) {
            s.classList.remove('bi-star');
            s.classList.add('bi-star-fill');
            s.setAttribute('aria-checked', 'true');
        } else {
            s.classList.remove('bi-star-fill');
            s.classList.add('bi-star');
            s.setAttribute('aria-checked', 'false');
        }
    });
}

function handleStarRatingHover(e) {
    const star = e.target.closest('.foodjet-star-icon, .bi');
    if (!star) return;

    const hoverRating = parseInt(star.dataset.rating);
    if (!hoverRating) return;

    const stars = document.querySelectorAll('#starRatingContainer .bi, #starRatingContainer .foodjet-star-icon');
    stars.forEach(s => {
        const r = parseInt(s.dataset.rating);
        if (r <= hoverRating) {
            s.classList.remove('bi-star');
            s.classList.add('bi-star-fill');
        } else {
            s.classList.remove('bi-star-fill');
            s.classList.add('bi-star');
        }
    });
}

function handleStarRatingLeave() {
    const currentRating = parseInt(document.getElementById('reviewRating')?.value || '0');
    const stars = document.querySelectorAll('#starRatingContainer .bi, #starRatingContainer .foodjet-star-icon');
    stars.forEach(s => {
        const r = parseInt(s.dataset.rating);
        if (r <= currentRating) {
            s.classList.remove('bi-star');
            s.classList.add('bi-star-fill');
            s.setAttribute('aria-checked', 'true');
        } else {
            s.classList.remove('bi-star-fill');
            s.classList.add('bi-star');
            s.setAttribute('aria-checked', 'false');
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

// Función para sincronizar datos del perfil en #miCuentaModal
export function syncMiCuentaModalData() {
    if (!window.currentUser) return;

    const nombreEl = document.getElementById('accountNombre');
    if (nombreEl) nombreEl.textContent = window.currentUser.nombre || 'Usuario FoodJet';

    const emailEl = document.getElementById('accountEmail');
    if (emailEl) emailEl.textContent = window.currentUser.email || 'Sin correo registrado';

    const telefonoEl = document.getElementById('accountTelefono');
    const telefonoContainer = document.getElementById('accountTelefonoContainer');
    if (telefonoEl && window.currentUser.telefono) {
        telefonoEl.textContent = window.currentUser.telefono;
        if (telefonoContainer) telefonoContainer.style.display = 'block';
    } else if (telefonoContainer) {
        telefonoContainer.style.display = 'none';
    }

    const rolEl = document.getElementById('accountRol');
    if (rolEl) rolEl.textContent = window.currentUser.rol === 'admin' ? 'Administrador' : 'Cliente';

    const estBadge = document.getElementById('accountEstudianteBadge');
    if (estBadge) estBadge.style.display = window.currentUser.es_estudiante ? 'inline-flex' : 'none';

    const adminBtn = document.getElementById('accountAdminBtn');
    if (adminBtn) adminBtn.style.display = window.currentUser.rol === 'admin' ? 'flex' : 'none';

    const statusContainer = document.getElementById('studentStatusContainer');
    const formContainer = document.getElementById('verifyStudentFormContainer');

    if (window.currentUser.es_estudiante) {
        if (statusContainer) {
            statusContainer.className = 'alert alert-success d-flex align-items-center';
            statusContainer.innerHTML = '<i class="bi bi-check-circle-fill me-2 fs-5" aria-hidden="true"></i><div><strong>Estudiante Verificado</strong> — Disfrutas de descuentos exclusivos de estudiante.</div>';
        }
        if (formContainer) formContainer.style.display = 'none';
    } else {
        if (statusContainer) {
            statusContainer.className = 'alert alert-secondary d-flex align-items-center';
            statusContainer.innerHTML = '<i class="bi bi-info-circle-fill me-2 fs-5" aria-hidden="true"></i><div><strong>Cuenta Regular</strong> — Sube tu carnet para acceder a descuentos para estudiantes.</div>';
        }
        if (formContainer) formContainer.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Sincronizar automáticamente #miCuentaModal cada vez que se abre
    document.getElementById('miCuentaModal')?.addEventListener('show.bs.modal', () => {
        syncMiCuentaModalData();
    });

    // Escuchar botón "Mi Cuenta"
    document.getElementById('miCuentaBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!window.currentUser) {
            ui.showToast('Debes iniciar sesión primero.', 'warning');
            return;
        }

        syncMiCuentaModalData();

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('miCuentaModal'));
        modal.show();
    });

    // Botón de acceso directo a Panel de Operaciones dentro de Mi Cuenta
    document.getElementById('accountAdminBtn')?.addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('miCuentaModal'));
        if (modal) modal.hide();
        const dashboardBtn = document.getElementById('dashboardBtn');
        if (dashboardBtn) {
            dashboardBtn.click();
        } else if (typeof displayDashboard === 'function') {
            displayDashboard();
        }
    });

    // Botón de cerrar sesión dentro de Mi Cuenta
    document.getElementById('accountLogoutBtn')?.addEventListener('click', (e) => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('miCuentaModal'));
        if (modal) modal.hide();
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.click();
        } else if (typeof handleLogout === 'function') {
            handleLogout(e);
        }
    });

    // Feedback visual en vivo del carnet seleccionado
    document.getElementById('carnetImage')?.addEventListener('change', (e) => {
        const feedback = document.getElementById('carnetImageFeedback');
        const file = e.target.files?.[0];
        if (feedback) {
            if (file) {
                feedback.textContent = `Archivo seleccionado: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`;
                feedback.style.display = 'block';
            } else {
                feedback.style.display = 'none';
            }
        }
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

            // Sincronizar modal actualizado
            syncMiCuentaModalData();

            // Refrescar catálogo (precios tachados) y el checkout si está abierto
            ui.renderProducts();
            ui.renderCartOffcanvas(); 
            ui.renderCheckoutCart();
            if (document.getElementById('checkoutView').style.display !== 'none') {
                ui.renderCheckoutSummary();
            }

            // Opcional: Cerrar modal tras 1.5s
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('miCuentaModal'));
                if(modal) modal.hide();
            }, 1500);

        } else {
            ui.showToast(result.data.error || 'Error en la verificación', 'danger');
        }
    });
});