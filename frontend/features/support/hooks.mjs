import { Before } from '@cucumber/cucumber';
import * as state from '../../js/state.js';

/**
 * El carrito, el catálogo y los favoritos viven en variables de módulo, así
 * que persisten entre escenarios. Sin este reinicio las pruebas se contaminan
 * unas a otras y fallan de forma no determinista según el orden de ejecución.
 */
Before(function () {
    state.clearCart();
    state.setProducts([]);
    state.setFavorites([]);
    state.setActiveCoupon(null);
});
