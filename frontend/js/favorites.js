/**
 * Carga de favoritos.
 *
 * Estaba dentro de window.app en app.js, inalcanzable desde una prueba. Se
 * extrae con inyección de dependencias: los colaboradores llegan por
 * parámetro, así que las pruebas pasan dobles sin necesitar una librería de
 * mocks ni un DOM.
 */
import * as defaultApi from './api.js';
import * as defaultState from './state.js';
import * as defaultUi from './ui.js';

export async function loadFavorites(deps = {}) {
    const {
        api = defaultApi,
        state = defaultState,
        ui = defaultUi,
        token = typeof window !== 'undefined' ? window.authToken : undefined
    } = deps;

    if (!token) return;

    try {
        const favorites = await api.fetchFavoritesAPI(token);
        state.setFavorites(favorites);
        ui.renderProducts();
        ui.renderFavoritesOffcanvas();
    } catch (error) {
        console.error('Error al cargar favoritos:', error);
    }
}
