import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import {
    lineaDeTiempo,
    dividirRuta,
    formatearDistancia,
    formatearRestante
} from '../../js/domain/seguimiento.js';

// Se prueba el modulo real que usa ui.js para pintar el seguimiento.
// Las horas son UTC del 6 de octubre de 2026 para no depender de la zona.

const hora = (hhmmss) => new Date(`2026-10-06T${hhmmss}Z`).getTime();

Given('un pedido en efectivo creado a las {word} con plan pendiente {int} s, confirmado {int} s, preparación {int} s y reparto {int} s',
    function (creado, pendiente, confirmado, preparacion, reparto) {
        this.pedido = {
            estado: 'pendiente',
            fecha: new Date(hora(creado)).toISOString(),
            plan_tiempos: { pendiente, confirmado, en_preparacion: preparacion, en_camino: reparto },
            historial: [{ estado: 'pendiente', fecha: new Date(hora(creado)).toISOString() }]
        };
    });

Given('el pedido sigue {string} y son las {word}', function (estado, ahora) {
    this.pedido.estado = estado;
    this.ahora = hora(ahora);
});

Given('el pedido pasó a {string} a las {word}', function (estado, cuando) {
    this.pedido.estado = estado;
    this.pedido.historial.push({ estado, fecha: new Date(hora(cuando)).toISOString() });
});

Given('son las {word}', function (ahora) {
    this.ahora = hora(ahora);
});

Given('un pedido {string} sin plan ni historial', function (estado) {
    this.pedido = { estado, fecha: new Date(hora('19:00:00')).toISOString(), plan_tiempos: null, historial: [] };
    this.ahora = hora('20:00:00');
});

When('se calcula la línea de tiempo', function () {
    this.linea = lineaDeTiempo(this.pedido, this.ahora);
});

function etapa(mundo, nombre) {
    const encontrada = mundo.linea.etapas.find((e) => e.etiqueta === nombre);
    expect(encontrada, `etapa ${nombre}`).to.not.equal(undefined);
    return encontrada;
}

Then('la etapa {string} está {string} con hora estimada {word}', function (nombre, situacion, cuando) {
    const e = etapa(this, nombre);
    expect(e.situacion).to.equal(situacion);
    expect(e.estimada).to.equal(true);
    expect(e.hora).to.equal(hora(cuando));
});

Then('la etapa {string} está {string} con hora real {word}', function (nombre, situacion, cuando) {
    const e = etapa(this, nombre);
    expect(e.situacion).to.equal(situacion);
    expect(e.estimada).to.equal(false);
    expect(e.hora).to.equal(hora(cuando));
});

Then('la etapa {string} está {string} sin hora', function (nombre, situacion) {
    const e = etapa(this, nombre);
    expect(e.situacion).to.equal(situacion);
    expect(e.hora).to.equal(null);
});

Given('una ruta recta hacia el norte de {int} metros', function (metros) {
    this.ruta = [[-12, -77], [-12 + metros / 111195, -77]];
});

When('el repartidor lleva el {int} por ciento', function (porcentaje) {
    this.tramo = dividirRuta(this.ruta, porcentaje / 100);
});

Then('le quedan {int} metros', function (metros) {
    expect(Math.abs(this.tramo.restanteMetros - metros)).to.be.at.most(1);
});

Then('la parte recorrida empieza en el local y la pendiente acaba en la casa', function () {
    expect(this.tramo.recorrida[0]).to.deep.equal(this.ruta[0]);
    expect(this.tramo.pendiente.at(-1)).to.deep.equal(this.ruta.at(-1));
    expect(this.tramo.recorrida.at(-1)).to.deep.equal(this.tramo.posicion);
});

Then('{int} metros se leen {string}', function (metros, texto) {
    expect(formatearDistancia(metros)).to.equal(texto);
});

Then('faltar {int} segundos se lee {string}', function (segundos, texto) {
    expect(formatearRestante(segundos * 1000)).to.equal(texto);
});
