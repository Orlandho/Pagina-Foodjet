const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// ==========================================
// 1. MOCKS Y SIMULACIÓN DEL ENTORNO
// ==========================================
global.window = { authToken: null };

let fetchCalledWith = null;
let setFavoritesCalledWith = null;
let renderProductsCalled = false;
let renderFavoritesCalled = false;
let apiShouldThrowError = false;
let consoleErrorMsg = null;

// Respuestas falsas de la API
const mockFavoritesData = [ { id: 1, name: "Pizza" }, { id: 2, name: "Burger" } ];

global.api = {
    fetchFavoritesAPI: async (token) => {
        fetchCalledWith = token;
        if (apiShouldThrowError) {
            throw new Error("API Error");
        }
        return mockFavoritesData;
    }
};

// Si global.state ya existe, lo usa, si no, crea un objeto vacío
global.state = global.state || {};
global.state.setFavorites = (data) => { setFavoritesCalledWith = data; };

global.ui = global.ui || {};
global.ui.renderProducts = () => { renderProductsCalled = true; };
global.ui.renderFavoritesOffcanvas = () => { renderFavoritesCalled = true; };

// Capturamos el console.error para probar el CP-003
const originalConsoleError = console.error;
console.error = (msg, err) => {
    consoleErrorMsg = msg;
};

// ==========================================
// CÓDIGO REFACTORIZADO (CP-06)
// ==========================================
const app = {
    loadFavorites: async () => {
        if (!window.authToken) return;
        
        try {
            const favorites = await api.fetchFavoritesAPI(window.authToken);
            state.setFavorites(favorites);
            ui.renderProducts();
            ui.renderFavoritesOffcanvas();
        } catch (error) {
            console.error('Error al cargar los favoritos de la API', error);
        }
    }
};

// ==========================================
// 3. PASOS DE CUCUMBER
// ==========================================
Given('el usuario tiene un token {string}', function (token) {
    global.window.authToken = token;
    
    // Reiniciamos los espías (spies)
    fetchCalledWith = null;
    setFavoritesCalledWith = null;
    renderProductsCalled = false;
    renderFavoritesCalled = false;
    apiShouldThrowError = false;
    consoleErrorMsg = null;
});

Given('la API responde con la lista de favoritos', function () {
    apiShouldThrowError = false;
});

Given('el usuario no tiene un token de autenticacion', function () {
    global.window.authToken = null;
    fetchCalledWith = null;
    setFavoritesCalledWith = null;
    renderProductsCalled = false;
    renderFavoritesCalled = false;
});

Given('la API lanza un error', function () {
    apiShouldThrowError = true;
});

When('ejecuto loadFavorites', async function () {
    // Usamos un try/catch temporal en el test solo para que la prueba no colapse 
    // si el código original arroja un error no manejado
    try {
        await app.loadFavorites();
    } catch (e) {
        // No hacemos nada, dejamos que los Then evalúen el resultado
    }
});

Then('la funcion fetchFavoritesAPI es llamada con el token', function () {
    expect(fetchCalledWith).to.equal("mockAuthToken");
});

Then('los favoritos son almacenados en el estado con setFavorites', function () {
    expect(setFavoritesCalledWith).to.deep.equal(mockFavoritesData);
});

Then('se renderizan los productos y el panel de favoritos', function () {
    expect(renderProductsCalled).to.be.true;
    expect(renderFavoritesCalled).to.be.true;
});

Then('la funcion fetchFavoritesAPI no es llamada', function () {
    expect(fetchCalledWith).to.be.null;
});

Then('no se actualiza el estado ni se renderizan los favoritos', function () {
    expect(setFavoritesCalledWith).to.be.null;
    expect(renderProductsCalled).to.be.false;
    expect(renderFavoritesCalled).to.be.false;
});

Then('se captura el error y se muestra un mensaje en la consola', function () {
    // ESTA PRUEBA FALLARÁ INICIALMENTE CON EL CÓDIGO ORIGINAL
    expect(consoleErrorMsg).to.not.be.null;
});