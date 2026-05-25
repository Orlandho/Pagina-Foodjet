const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// 1. CONFIGURACIÓN DEL ENTORNO (Mocks Globales)
// Como tu código original no recibe 'cart' ni 'getProductById' por parámetros,
// debemos declararlos globalmente para que la función pueda acceder a ellos.
global.cart = {};
global.mockBaseDatos = {};
global.getProductById = (id) => global.mockBaseDatos[id];

// 2.CÓDIGO REFACTORIZADO
function addToCart(productId) {
    const product = getProductById(productId);

    // Validación temprana: Si no existe o no está disponible, salimos rápido
    if (!product || product.disponibilidad === false) {
        return { success: false, error: 'UNAVAILABLE' };
    }

    const cartItemKeys = Object.keys(cart);

    // Validación de restaurante: Solo verificamos si el carrito ya tiene items
    if (cartItemKeys.length > 0) {
        const firstItemProduct = getProductById(cartItemKeys[0]);
        if (firstItemProduct && firstItemProduct.restaurante_id !== product.restaurante_id) {
            return { success: false, error: 'DIFFERENT_RESTAURANT' };
        }
    }

    // Si pasa todas las validaciones, agregamos al carrito
    cart[productId] = (cart[productId] || 0) + 1;
    return { success: true };
}


// Variable para guardar lo que responde la función
let resultadoActual;

// 3. PASOS DE CUCUMBER (GIVEN) - Preparar datos
Given('el estado inicial del carrito es vacio', function () {
    global.cart = {};
    global.mockBaseDatos = {}; // Limpiamos la BD simulada
});

Given('el estado inicial del carrito tiene el producto {int} con cantidad {int} del restaurante_id {int}', function (idProducto, cantidad, restauranteId) {
    global.cart = {};
    global.cart[idProducto] = cantidad;

    // Registramos ese primer producto en nuestra BD simulada
    global.mockBaseDatos[idProducto] = {
        id: idProducto,
        disponibilidad: true,
        restaurante_id: restauranteId
    };
});

Given('la funcion getProductById retorna para el producto {int}: disponibilidad true y restaurante_id {int}', function (idProducto, restauranteId) {
    global.mockBaseDatos[idProducto] = { id: idProducto, disponibilidad: true, restaurante_id: restauranteId };
});

Given('la funcion getProductById retorna para el producto {int}: disponibilidad false', function (idProducto) {
    global.mockBaseDatos[idProducto] = { id: idProducto, disponibilidad: false };
});

// 4. PASOS DE CUCUMBER (WHEN) - Ejecutar acción
When('ejecuto addToCart con el producto {int}', function (idProducto) {
    // Convertimos a string el ID porque Object.keys() maneja strings
    resultadoActual = addToCart(idProducto.toString());
});

// 5. PASOS DE CUCUMBER (THEN) - Validar resultados
Then('el objeto cart se actualiza a contener el id {int} con cantidad {int}', function (idProducto, cantidad) {
    expect(global.cart[idProducto.toString()]).to.equal(cantidad);
});

Then('el objeto cart no sufre modificaciones y queda vacio', function () {
    expect(Object.keys(global.cart).length).to.equal(0);
});

Then('el objeto cart no sufre modificaciones y mantiene solo el producto {int}', function (idProducto) {
    expect(Object.keys(global.cart).length).to.equal(1);
    expect(global.cart[idProducto.toString()]).to.equal(1);
});

Then('la funcion retorna success true', function () {
    expect(resultadoActual).to.deep.equal({ success: true });
});

Then('la funcion retorna success false y error {string}', function (mensajeError) {
    expect(resultadoActual).to.deep.equal({ success: false, error: mensajeError });
});