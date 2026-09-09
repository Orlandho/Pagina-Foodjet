import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { sanitizePhone, validatePhone } from '../../js/domain/validation.js';

// Se prueban las funciones reales que usan el registro y el checkout.

Given('el usuario escribe {string} en el telefono', function (valor) {
    this.telefono = valor;
});

When('se filtra el valor mientras escribe', function () {
    this.resultado = sanitizePhone(this.telefono);
});

When('se valida el telefono', function () {
    this.revision = validatePhone(this.telefono);
});

Then('el campo queda con {string}', function (esperado) {
    expect(this.resultado).to.equal(esperado);
});

Then('el telefono es valido', function () {
    expect(this.revision.valid).to.equal(true);
});

Then('el telefono es invalido con el mensaje {string}', function (mensaje) {
    expect(this.revision.valid).to.equal(false);
    expect(this.revision.error).to.equal(mensaje);
});
