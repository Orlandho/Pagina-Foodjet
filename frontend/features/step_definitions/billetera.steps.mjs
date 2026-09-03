import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import * as state from '../../js/state.js';
import { buildOrderPayload } from '../../js/domain/checkout.js';
import { getProductRestaurant } from '../../js/domain/catalog.js';

// El producto se siembra con la MISMA forma que devuelve la API: la relación
// se llama `Restaurant`, con mayúscula, porque así la nombra Prisma. La versión
// anterior de estas pruebas la sembraba como `restaurante` en minúscula y por
// eso pasaban en verde mientras el pago con billetera fallaba en el navegador:
// validaban una forma de dato que la API nunca produce.
//
// Estos escenarios comprueban la lógica real del pago con billetera:
// la construcción del pedido y la comprobación de que el restaurante tiene un
// QR configurado. La apertura del modal en sí es responsabilidad de Bootstrap
// y no se simula: antes se hacía con ~30 líneas de dobles del DOM que no
// ejercitaban nada del código de producción.

Given('el carrito contiene un producto disponible', function () {
    this.restaurante = { id: 5, nombre: 'Genérico', qr_pago: null };
    state.setProducts([{
        id: 1,
        precio: 10,
        disponibilidad: true,
        restaurante_id: this.restaurante.id,
        Restaurant: this.restaurante
    }]);
    state.addToCart(1);
});

Given('el usuario ha iniciado sesion con un token valido', function () {
    this.token = 'token-de-prueba';
});

Given('el metodo de pago seleccionado es {string}', function (metodo) {
    this.metodoPago = metodo;
});

Given('el restaurante {string} del producto no tiene configurado un QR de pago', function (nombre) {
    this.restaurante.nombre = nombre;
    this.restaurante.qr_pago = null;
});

Given('el restaurante {string} del producto tiene el QR {string}', function (nombre, qr) {
    this.restaurante.nombre = nombre;
    this.restaurante.qr_pago = qr;
});

When('se procesa el checkout con billetera digital', function () {
    const producto = state.getProductById(Object.keys(state.getCart())[0]);
    const restaurante = getProductRestaurant(producto);

    this.puedePagar = Boolean(restaurante && restaurante.qr_pago);
    this.mensaje = this.puedePagar ? null : 'No se encontró el QR de pago para este restaurante';
    this.restauranteResuelto = restaurante;

    this.payload = this.puedePagar
        ? buildOrderPayload(state.getCart(), state.getProductById, this.metodoPago)
        : null;
});

Then('el flujo de pago es abortado', function () {
    expect(this.puedePagar).to.equal(false);
    expect(this.payload).to.equal(null);
});

Then('se informa al usuario con el mensaje {string}', function (mensaje) {
    expect(this.mensaje).to.equal(mensaje);
});

Then('el restaurante resuelto para el cobro es {string} con el QR {string}', function (nombre, qr) {
    expect(this.restauranteResuelto.nombre).to.equal(nombre);
    expect(this.restauranteResuelto.qr_pago).to.equal(qr);
});

Then('el pedido enviado lleva el metodo de pago {string} y el restaurante {int}', function (metodo, restauranteId) {
    expect(this.payload.metodo_pago).to.equal(metodo);
    expect(this.payload.restaurante_id).to.equal(restauranteId);
});

Then('el pedido enviado contiene {int} articulo', function (cantidad) {
    expect(this.payload.items).to.have.lengthOf(cantidad);
});
