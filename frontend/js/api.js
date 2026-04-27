const API_URL = 'http://localhost:3000/api';

/**
 * Obtiene la lista de productos desde el backend.
 * @returns {Promise<Array>} Lista de productos o array vacío en caso de error.
 */
export async function fetchProductsAPI() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (response.ok) {
            return await response.json();
        } else {
            console.error('Error al cargar productos');
            return [];
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        return [];
    }
}

/**
 * Crea un nuevo pedido enviando los items al backend.
 * @param {Array} items Lista de items en el carrito {productId, cantidad}
 * @param {string} token Token de autorización del usuario
 * @returns {Promise<Object>} Resultado de la creación del pedido.
 */
export async function createOrderAPI(items, token) {
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ items })
        });

        const data = await response.json();
        return { ok: response.ok, data };
    } catch (error) {
        console.error('Error de conexión al crear el pedido:', error);
        return { ok: false, data: { error: 'Error de conexión con el servidor' } };
    }
}
