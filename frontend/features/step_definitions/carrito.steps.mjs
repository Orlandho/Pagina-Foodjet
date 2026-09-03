import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import * as state from '../../js/state.js';

// Se prueba la addToCart real de js/state.js, no una copia.

Given('el estado inicial del carrito es vacio', function () {
    state.clearCart();
    expect(state.isCartEmpty()).to.equal(true);
});

Given(
    'el estado inicial del carrito tiene el producto {int} con cantidad {int} del restaurante_id {int}',
    function (productId, cantidad, restauranteId) {
        state.setProducts([{ id: productId, disponibilidad: true, restaurante_id: restauranteId, precio: 10 }]);

        for (let i = 0; i < cantidad; i++) {
            state.addToCart(productId);
        }

        expect(state.getCart()[productId]).to.equal(cantidad);
    }
);

Given(
    'la funcion getProductById retorna para el producto {int}: disponibilidad {word} y restaurante_id {int}',
    function (productId, disponibilidad, restauranteId) {
        state.setProducts([
            ...state.getProducts(),
            { id: productId, disponibilidad: disponibilidad === 'true', restaurante_id: restauranteId, precio: 10 }
        ]);
    }
);

Given(
    'la funcion getProductById retorna para el producto {int}: disponibilidad {word}',
    function (productId, disponibilidad) {
        state.setProducts([
            ...state.getProducts(),
            { id: productId, disponibilidad: disponibilidad === 'true', restaurante_id: 10, precio: 10 }
        ]);
    }
);

When('ejecuto addToCart con el producto {int}', function (productId) {
    this.resultado = state.addToCart(productId);
});

Then('el objeto cart se actualiza a contener el id {int} con cantidad {int}', function (productId, cantidad) {
    expect(state.getCart()[productId]).to.equal(cantidad);
});

Then('la funcion retorna success true', function () {
    expect(this.resultado.success).to.equal(true);
});

Then('el objeto cart no sufre modificaciones y queda vacio', function () {
    expect(state.isCartEmpty()).to.equal(true);
});

Then('el objeto cart no sufre modificaciones y mantiene solo el producto {int}', function (productId) {
    expect(Object.keys(state.getCart())).to.deep.equal([String(productId)]);
});

Then('la funcion retorna success false y error {string}', function (error) {
    expect(this.resultado.success).to.equal(false);
    expect(this.resultado.error).to.equal(error);
});
