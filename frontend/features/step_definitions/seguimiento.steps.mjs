import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { getTrackingViewModel, deriveSubtotal, ETAPAS } from '../../js/domain/orderStatus.js';

// Se prueba el mapeo real que usa la vista de seguimiento.

Given('un pedido cuyo estado en la base de datos es {string}', function (estado) {
    this.estado = estado;
});

Given('un pedido con total {float}, impuestos {float} y envio {float}', function (total, impuestos, envio) {
    this.order = { total, impuestos, costo_envio: envio };
});

When('se calcula la vista de seguimiento', function () {
    this.vm = getTrackingViewModel(this.estado);
});

When('se calcula el subtotal del pedido', function () {
    this.subtotal = deriveSubtotal(this.order);
});

Then('la etapa activa es la numero {int}', function (etapa) {
    expect(this.vm.activeIndex + 1).to.equal(etapa);
});

Then('el titulo mostrado es {string}', function (titulo) {
    expect(this.vm.title).to.equal(titulo);
});

Then('el estado normalizado es {string}', function (estado) {
    expect(this.vm.estado).to.equal(estado);
});

Then('las {int} etapas quedan completadas', function (cantidad) {
    expect(cantidad).to.equal(ETAPAS.length);
    expect(this.vm.completedCount).to.equal(cantidad);
});

Then('la vista se marca como terminal', function () {
    expect(this.vm.terminal).to.equal(true);
});

Then('no hay ninguna etapa activa', function () {
    expect(this.vm.activeIndex).to.equal(-1);
});

Then('el subtotal resultante es {float}', function (esperado) {
    expect(Number(this.subtotal.toFixed(2))).to.equal(esperado);
});
