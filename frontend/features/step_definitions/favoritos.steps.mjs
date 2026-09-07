import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { loadFavorites } from '../../js/favorites.js';
import * as state from '../../js/state.js';

// Se prueba la loadFavorites real de js/favorites.js. Los colaboradores se
// inyectan por parámetro, así que no hace falta ni DOM ni librería de mocks.

function crearDobles() {
    const llamadas = { fetchFavoritesAPI: [], renderProducts: 0, renderFavoritesOffcanvas: 0 };

    return {
        llamadas,
        api: {
            fetchFavoritesAPI: async (token) => {
                llamadas.fetchFavoritesAPI.push(token);
                return llamadas.respuesta ?? [];
            }
        },
        ui: {
            renderProducts: () => { llamadas.renderProducts += 1; },
            renderFavoritesOffcanvas: () => { llamadas.renderFavoritesOffcanvas += 1; }
        }
    };
}

Given('el usuario tiene un token {string}', function (token) {
    this.token = token;
    this.dobles = crearDobles();
});

Given('el usuario no tiene un token de autenticacion', function () {
    this.token = undefined;
    this.dobles = crearDobles();
});

Given('la API responde con la lista de favoritos', function () {
    this.favoritosEsperados = [{ id: 1, nombre: 'Hamburguesa Clásica' }];
    this.dobles.llamadas.respuesta = this.favoritosEsperados;
});

Given('la API lanza un error', function () {
    this.dobles.api.fetchFavoritesAPI = async () => {
        throw new Error('fallo de red simulado');
    };

    this.erroresConsola = [];
    this.consoleErrorOriginal = console.error;
    console.error = (...args) => this.erroresConsola.push(args.join(' '));
});

When('ejecuto loadFavorites', async function () {
    await loadFavorites({
        api: this.dobles.api,
        state,
        ui: this.dobles.ui,
        token: this.token
    });

    if (this.consoleErrorOriginal) {
        console.error = this.consoleErrorOriginal;
        this.consoleErrorOriginal = null;
    }
});

Then('la funcion fetchFavoritesAPI es llamada con el token', function () {
    expect(this.dobles.llamadas.fetchFavoritesAPI).to.deep.equal([this.token]);
});

Then('los favoritos son almacenados en el estado con setFavorites', function () {
    expect(state.getFavorites()).to.deep.equal(this.favoritosEsperados);
});

Then('se renderizan los productos y el panel de favoritos', function () {
    expect(this.dobles.llamadas.renderProducts).to.equal(1);
    expect(this.dobles.llamadas.renderFavoritesOffcanvas).to.equal(1);
});

Then('la funcion fetchFavoritesAPI no es llamada', function () {
    expect(this.dobles.llamadas.fetchFavoritesAPI).to.have.lengthOf(0);
});

Then('no se actualiza el estado ni se renderizan los favoritos', function () {
    expect(state.getFavorites()).to.have.lengthOf(0);
    expect(this.dobles.llamadas.renderProducts).to.equal(0);
    expect(this.dobles.llamadas.renderFavoritesOffcanvas).to.equal(0);
});

Then('se captura el error y se muestra un mensaje en la consola', function () {
    expect(this.erroresConsola.join(' ')).to.include('Error al cargar favoritos');
});
