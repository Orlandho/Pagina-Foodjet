import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { validateCard, detectBrand } from '../../js/domain/payment.js';

// Se prueba la validacion real de js/domain/payment.js.

// Fecha fija: si no, los escenarios de vencimiento caducarian con el tiempo.
const AHORA = new Date(2026, 0, 15);

Given('los datos de tarjeta numero {string}, expiracion {string} y cvc {string}', function (numero, expiracion, cvc) {
    this.tarjeta = { numero, expiracion, cvc };
});

When('se valida la tarjeta', function () {
    this.resultado = validateCard(this.tarjeta, AHORA);
});

Then('el resultado de la validacion es {word}', function (esperado) {
    expect(this.resultado.valid).to.equal(esperado === 'true');
});

Then('la marca detectada es {string}', function (marca) {
    expect(detectBrand(this.tarjeta.numero)).to.equal(marca);
});

Then('el campo {string} reporta el error {string}', function (campo, mensaje) {
    expect(this.resultado.errors[campo]).to.equal(mensaje);
});
