import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { isTokenExpired, isAuthFailure, decodeJwtPayload } from '../../js/domain/session.js';

// Se prueba el modulo real que usa app.js para decidir si la sesion sigue viva.

const AHORA = new Date('2026-09-08T12:00:00Z').getTime();

/** Construye un JWT de mentira: solo importa la carga util, no la firma. */
function tokenConExp(expSegundos) {
    const cabecera = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const carga = Buffer.from(JSON.stringify({ userId: 1, exp: expSegundos })).toString('base64url');
    return `${cabecera}.${carga}.firma-irrelevante`;
}

Given('un token que caduca dentro de {int} segundos', function (segundos) {
    this.token = tokenConExp(Math.floor(AHORA / 1000) + segundos);
});

Given('un token que caduco hace {int} segundos', function (segundos) {
    this.token = tokenConExp(Math.floor(AHORA / 1000) - segundos);
});

Given('un token con el valor {string}', function (valor) {
    this.token = valor;
});

When('se comprueba si la sesion caduco', function () {
    this.resultado = isTokenExpired(this.token, AHORA);
});

Then('el resultado es {word}', function (esperado) {
    expect(this.resultado).to.equal(esperado === 'true');
});

Given('una respuesta del servidor con codigo {int}', function (codigo) {
    this.codigo = codigo;
});

Then('se considera fallo de sesion: {word}', function (esperado) {
    expect(isAuthFailure(this.codigo)).to.equal(esperado === 'true');
});

Then('la carga util del token contiene el usuario {int}', function (userId) {
    expect(decodeJwtPayload(this.token).userId).to.equal(userId);
});
