/**
 * Armado del pedido que se envía a la API.
 *
 * Vivía en app.js, que registra listeners del DOM al importarse; extraerlo
 * permite probarlo sin navegador.
 */

/**
 * @param {Object} cart Carrito en formato { productId: cantidad }
 * @param {Function} getProductById Resolutor de productos
 * @param {string} metodoPago 'cash' | 'card' | 'wallet'
 * @param {number} direccionEntregaId Dirección de entrega elegida
 */
export function buildOrderPayload(cart, getProductById, metodoPago, direccionEntregaId = 1) {
    const items = Object.entries(cart).map(([productId, cantidad]) => ({
        productId: parseInt(productId, 10),
        cantidad
    }));

    const primerProducto = getProductById(Object.keys(cart)[0]);
    const restauranteId = primerProducto ? primerProducto.restaurante_id : 1;

    return {
        items,
        metodo_pago: metodoPago,
        restaurante_id: restauranteId,
        direccion_entrega_id: direccionEntregaId
    };
}
