const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// ==========================================
// 1. MOCKS Y SIMULACIÓN DEL ENTORNO DEL NAVEGADOR (DOM & API)
// ==========================================
global.window = { authToken: null };

// Estado y UI falsos para interactuar con tu código
let toastMessage = "";
let toastType = "";
let mockCartData = {};
let mockProductDB = {};

global.state = global.state || {};
global.state.isCartEmpty = () => Object.keys(mockCartData).length === 0;
global.state.getCart = () => mockCartData;
global.state.getProductById = (id) => mockProductDB[id];

global.ui = global.ui || {};
global.ui.showToast = (msg, type) => {
    toastMessage = msg;
    toastType = type;
};

// Controladores del DOM y de clases de Bootstrap
let selectedPaymentMethod = 'cash';
let mockElements = {};
let modalShowCalled = false;
let modalHideCalled = false;
let submitOrderPayload = null;
let submitOrderMethod = null;
let capturedIntervalCallback = null;

global.document = {
    querySelector: (selector) => {
        if (selector === 'input[name="paymentMethod"]:checked') {
            return { value: selectedPaymentMethod };
        }
        return null;
    },
    getElementById: (id) => {
        if (!mockElements[id]) {
            mockElements[id] = {
                textContent: "",
                src: "",
                addEventListener: () => {} ,
                removeEventListener: () => {}
            };
        }
        return mockElements[id];
    }
};

global.bootstrap = {
    Modal: {
        getOrCreateInstance: (el) => ({
            show: () => { modalShowCalled = true; },
            hide: () => { modalHideCalled = true; }
        })
    }
};

global.submitOrder = async (payload, method) => {
    submitOrderPayload = payload;
    submitOrderMethod = method;
};

// Capturamos el setInterval para poder avanzar los 5 segundos manualmente
global.setInterval = (callback, delay) => {
    capturedIntervalCallback = callback;
    return 123; // ID de temporizador simulado
};
global.clearInterval = (id) => {
    capturedIntervalCallback = null;
};

// ==========================================
// CÓDIGO REFACTORIZADO
// ==========================================

// 1. Función Principal (Orquestador)
async function handleCheckoutSubmit(e) {
    e.preventDefault();

    if (state.isCartEmpty()) {
        return ui.showToast('El carrito está vacío', 'warning');
    }

    const paymentMethodElement = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = paymentMethodElement ? paymentMethodElement.value : 'cash';

    if (!window.authToken) {
        return ui.showToast('Debes iniciar sesión para completar la compra', 'warning');
    }

    const orderPayload = buildOrderPayload(paymentMethod);

    if (paymentMethod === 'wallet') {
        await processWalletPayment(orderPayload, paymentMethod);
    } else {
        await submitOrder(orderPayload, paymentMethod);
    }
}

// 2. Función Auxiliar: Arma el cuerpo de la petición
function buildOrderPayload(paymentMethod) {
    const cart = state.getCart();
    const items = Object.entries(cart).map(([productId, quantity]) => ({
        productId: parseInt(productId),
        cantidad: quantity
    }));

    const firstProduct = state.getProductById(Object.keys(cart)[0]);
    const restauranteId = firstProduct ? firstProduct.restaurante_id : 1;

    return {
        items,
        metodo_pago: paymentMethod,
        restaurante_id: restauranteId,
        direccion_entrega_id: 1 // TODO: Implementar selección dinámica de dirección
    };
}

// 3. Función Auxiliar: Maneja la lógica de la billetera y el QR
async function processWalletPayment(orderPayload, paymentMethod) {
    const firstProduct = state.getProductById(Object.keys(state.getCart())[0]);
    const restaurante = firstProduct ? firstProduct.restaurante : null;

    if (!restaurante || !restaurante.qr_pago) {
        return ui.showToast('No se encontró el QR de pago para este restaurante', 'warning');
    }

    openQRModal(restaurante, orderPayload, paymentMethod);
}

// 4. Función Auxiliar: Aísla la interacción con el DOM y el temporizador
function openQRModal(restaurante, orderPayload, paymentMethod) {
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

    // Función de limpieza para no repetir código
    const cleanupAndHide = () => {
        clearInterval(timerInterval);
        qrModal.hide();
    };

    const finishPayment = async () => {
        cleanupAndHide();
        await submitOrder(orderPayload, paymentMethod);
    };

    const handleCancel = () => cleanupAndHide();

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
}


// ==========================================
// 3. PASOS DE CUCUMBER (MAPEADO DE LÓGICA)
// ==========================================

Given('el carrito contiene un producto disponible', function () {
    mockCartData = { '1': 1 }; // 1 unidad del Producto ID: 1
});

Given('el usuario ha iniciado sesion con un token valido', function () {
    global.window.authToken = 'mockAuthToken_XYZ_123';
});

Given('el metodo de pago seleccionado es {string}', function (metodo) {
    selectedPaymentMethod = metodo;
});

Given('el restaurante {string} del producto no tiene configurado un QR de pago', function (nombreRestaurante) {
    mockProductDB['1'] = {
        id: 1,
        restaurante_id: 10,
        restaurante: { nombre: nombreRestaurante, qr_pago: null } // QR Ausente
    };
    // Reiniciamos variables de control
    toastMessage = "";
    modalShowCalled = false;
    submitOrderPayload = null;
});

Given('el restaurante {string} del producto tiene el QR {string}', function (nombreRestaurante, urlQr) {
    mockProductDB['1'] = {
        id: 1,
        restaurante_id: 20,
        restaurante: { nombre: nombreRestaurante, qr_pago: urlQr } // QR Válido
    };
    toastMessage = "";
    modalShowCalled = false;
    modalHideCalled = false;
    submitOrderPayload = null;
    mockElements = {}; // Limpiar DOM simulado
});

When('se procesa el checkout con handleCheckoutSubmit', {timeout: 10000}, async function () {
    const mockEvent = { preventDefault: () => {} };
    await handleCheckoutSubmit(mockEvent);
});

When('transcurren los 5 segundos completos del temporizador de pago', function () {
    // Si capturamos la función del setInterval, la llamamos 5 veces consecutivas
    // para obligar al contador a llegar a 0 de forma inmediata (Fake Timer manual)
    if (capturedIntervalCallback) {
        for (let i = 0; i < 5; i++) {
            capturedIntervalCallback();
        }
    }
});

Then('el flujo de pago es abortado', function () {
    expect(submitOrderPayload).to.be.null; // No debe haberse procesado la orden
});

Then('el modal de QR no se abre', function () {
    expect(modalShowCalled).to.be.false;
});

Then('se muestra una alerta toast con el mensaje {string}', function (mensajeEsperado) {
    expect(toastMessage).to.equal(mensajeEsperado);
});

Then('el elemento {string} muestra el texto {string}', function (idElemento, textoEsperado) {
    const cleanId = idElemento.replace('#', '');
    expect(mockElements[cleanId]?.textContent).to.equal(textoEsperado);
});

Then('el elemento {string} recibe la ruta {string}', function (idElemento, rutaEsperada) {
    const cleanId = idElemento.replace('#', '');
    expect(mockElements[cleanId]?.src).to.equal(rutaEsperada);
});

Then('el modal de QR se abre exitosamente llamando a qrModal.show\\(\\)', function () {
    expect(modalShowCalled).to.be.true;
});

Then('el modal de QR se oculta llamando a qrModal.hide\\(\\)', function () {
    expect(modalHideCalled).to.be.true;
});

Then('se ejecuta automaticamente la funcion submitOrder con los datos del pedido cargados', function () {
    expect(submitOrderPayload).to.not.be.null;
    expect(submitOrderMethod).to.equal('wallet');
    expect(submitOrderPayload.restaurante_id).to.equal(20);
    expect(submitOrderPayload.items).to.deep.equal([{ productId: 1, cantidad: 1 }]);
});