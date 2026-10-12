import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import {
    buscarDireccionGuardada,
    direccionInicial,
    faltaMarcarUbicacion,
    coordenadasValidas
} from '../../js/domain/ubicacion.js';

// Se prueba el modulo real que usa app.js para decidir que direccion guardar.

function guardada(id, texto, coords, predeterminada = false) {
    return {
        id,
        direccion_detallada: texto,
        latitud: coords ? coords.lat : null,
        longitud: coords ? coords.lng : null,
        es_predeterminada: predeterminada
    };
}

Given('el cliente tiene guardada {string} en {float}, {float}', function (texto, lat, lng) {
    this.guardadas = [guardada(1, texto, { lat, lng })];
});

Given('el cliente también tiene guardada {string} sin ubicar y predeterminada', function (texto) {
    this.guardadas.push(guardada(this.guardadas.length + 1, texto, null, true));
});

Given('el cliente también tiene guardada {string} en {float}, {float} y predeterminada', function (texto, lat, lng) {
    this.guardadas.push(guardada(this.guardadas.length + 1, texto, { lat, lng }, true));
});

Given('el cliente solo tiene guardada {string} sin ubicar', function (texto) {
    this.guardadas = [guardada(1, texto, null, true)];
});

When('confirma {string} con el pin en {float}, {float}', function (texto, lat, lng) {
    this.encontrada = buscarDireccionGuardada(this.guardadas, texto, { lat, lng });
});

When('confirma {string} sin marcar punto', function (texto) {
    this.encontrada = buscarDireccionGuardada(this.guardadas, texto, null);
});

Then('se reutiliza la dirección guardada', function () {
    expect(this.encontrada).to.not.equal(null);
    expect(this.encontrada.id).to.equal(1);
});

Then('se crea una dirección nueva', function () {
    expect(this.encontrada).to.equal(null);
});

Given('el mapa está disponible', function () {
    this.mapaDisponible = true;
});

Given('el mapa no está disponible', function () {
    this.mapaDisponible = false;
});

Given('el cliente no ha marcado ningún punto', function () {
    this.coords = null;
});

Given('el cliente marcó el punto {float}, {float}', function (lat, lng) {
    this.coords = { lat, lng };
});

Then('falta marcar la ubicación: {word}', function (esperado) {
    const falta = faltaMarcarUbicacion({ mapaDisponible: this.mapaDisponible, coords: this.coords });
    expect(falta).to.equal(esperado === 'true');
});

Then('el mapa abre en {string}', function (texto) {
    expect(direccionInicial(this.guardadas)?.direccion_detallada).to.equal(texto);
});

Then('el mapa no abre en ninguna dirección guardada', function () {
    expect(direccionInicial(this.guardadas)).to.equal(null);
});

Then('las coordenadas {float}, {float} son válidas: {word}', function (lat, lng, esperado) {
    expect(coordenadasValidas(lat, lng)).to.equal(esperado === 'true');
});
