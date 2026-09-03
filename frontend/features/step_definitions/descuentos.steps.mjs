import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { renderProductPrice } from '../../js/domain/catalog.js';

// Se prueba la renderProductPrice real de js/domain/catalog.js.

Given('el usuario actual tiene la condicion de estudiante en {word}', function (valor) {
    this.user = { es_estudiante: valor === 'true' };
});

Given('un producto con precio de {float} y un descuento de {int} por ciento', function (precio, descuento) {
    this.product = { precio, descuento_estudiante: descuento };
});

When('se calcula y genera el HTML del precio', function () {
    this.html = renderProductPrice(this.product, this.user);
});

Then('el HTML resultante debe contener el precio rebajado {string}', function (texto) {
    expect(this.html).to.include(texto);
});

Then('el HTML debe incluir la clase visual {string}', function (clase) {
    expect(this.html).to.include(clase);
});

Then('el HTML resultante debe mostrar exactamente {string}', function (texto) {
    expect(this.html.trim()).to.equal(texto);
});

Then('no debe incluir etiquetas span de descuento', function () {
    expect(this.html).to.not.include('<span');
});
