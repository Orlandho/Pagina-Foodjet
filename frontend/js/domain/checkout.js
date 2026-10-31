/**
 * Armado del pedido que se envía a la API.
 *
 * Vivía en app.js, que registra listeners del DOM al importarse; extraerlo
 * permite probarlo sin navegador.
 */

/**
 * Cupones soportados en la base del backend (`backend/prisma/seed.js`).
 */
export const CUPONES_SOPORTADOS = {
    'pruebacupon': { id: 1, codigo: 'PruebaCupon', porcentaje: 10.0, tipo: 'porcentaje', valor: 10.0 },
    'foodjet20': { id: 2, codigo: 'FOODJET20', porcentaje: 20.0, tipo: 'porcentaje', valor: 20.0 }
};

/**
 * Valida un código de cupón de forma pura e insensible a mayúsculas/minúsculas.
 * @param {string} codigo
 * @returns {{valid: boolean, error?: string, coupon?: Object}}
 */
export function validateCoupon(codigo) {
    const limpio = String(codigo || '').trim().toLowerCase();
    if (!limpio) {
        return { valid: false, error: 'Ingresa un código de cupón.' };
    }
    const cupon = CUPONES_SOPORTADOS[limpio];
    if (!cupon) {
        return { valid: false, error: 'Código de cupón no válido.' };
    }
    return { valid: true, coupon: cupon };
}

/**
 * @param {Object} cart Carrito en formato { productId: cantidad }
 * @param {Function} getProductById Resolutor de productos
 * @param {string} metodoPago 'cash' | 'card' | 'wallet'
 * @param {number} direccionEntregaId Dirección de entrega elegida
 * @param {number|null} cuponId ID de cupón opcional
 */
export function buildOrderPayload(cart, getProductById, metodoPago, direccionEntregaId = 1, cuponId = null) {
    const items = Object.entries(cart).map(([productId, cantidad]) => ({
        productId: parseInt(productId, 10),
        cantidad
    }));

    const primerProducto = getProductById(Object.keys(cart)[0]);
    const restauranteId = primerProducto ? primerProducto.restaurante_id : 1;

    const payload = {
        items,
        metodo_pago: metodoPago,
        restaurante_id: restauranteId,
        direccion_entrega_id: direccionEntregaId
    };

    if (cuponId) {
        payload.cupon_id = Number(cuponId);
    }

    return payload;
}

