const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// ==========================================
// 1. MOCKS Y SIMULACIÓN DEL ENTORNO
// ==========================================
global.window = global.window || {};
let testProduct = {};
let resultHtml = '';

// ==========================================
// CÓDIGO REFACTORIZADO
// ==========================================

// 1. Función de lógica de negocio (Matemática pura)
function calculateStudentPrice(product, user) {
    let finalPrice = product.precio;
    let hasDiscount = false;

    if (user && user.es_estudiante && product.descuento_estudiante > 0) {
        finalPrice = product.precio - (product.precio * (product.descuento_estudiante / 100));
        hasDiscount = true;
    }

    return {
        originalPrice: product.precio,
        finalPrice: finalPrice,
        hasDiscount: hasDiscount
    };
}

// 2. Función de lógica de presentación (UI)
function executeOriginalDiscountLogic() {
    // Consumimos la función pura pasándole las variables del entorno
    const priceData = calculateStudentPrice(testProduct, global.window.currentUser);

    if (priceData.hasDiscount) {
        return `<span class="text-decoration-line-through text-muted fs-6">S/ ${priceData.originalPrice.toFixed(2)}</span>
                <span class="text-success fw-bold ms-2">S/ ${priceData.finalPrice.toFixed(2)}</span>`;
    }
    
    return `S/ ${priceData.originalPrice.toFixed(2)}`;
}

// ==========================================
// 3. PASOS DE CUCUMBER
// ==========================================

Given('el usuario actual tiene la condicion de estudiante en true', function () {
    global.window.currentUser = { es_estudiante: true };
});

Given('el usuario actual tiene la condicion de estudiante en false', function () {
    global.window.currentUser = { es_estudiante: false };
});

Given('un producto con precio de {float} y un descuento de {int} por ciento', function (precio, descuento) {
    testProduct = {
        precio: precio,
        descuento_estudiante: descuento
    };
});

When('se calcula y genera el HTML del precio', function () {
    resultHtml = executeOriginalDiscountLogic();
});

Then('el HTML resultante debe contener el precio rebajado {string}', function (precioEsperado) {
    expect(resultHtml).to.include(precioEsperado);
});

Then('el HTML debe incluir la clase visual {string}', function (claseHtml) {
    expect(resultHtml).to.include(claseHtml);
});

Then('el HTML resultante debe mostrar exactamente {string}', function (precioEsperado) {
    expect(resultHtml.trim()).to.equal(precioEsperado);
});

Then('no debe incluir etiquetas span de descuento', function () {
    expect(resultHtml).to.not.include('<span');
    expect(resultHtml).to.not.include('text-success');
});