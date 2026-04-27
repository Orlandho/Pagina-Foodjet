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
 * Crea un nuevo pedido enviando el payload completo al backend.
 * @param {Object} payload Objeto con los datos de la orden (items, restaurante_id, direccion_entrega_id, metodo_pago)
 * @param {string} token Token de autorización del usuario
 * @returns {Promise<Object>} Resultado de la creación del pedido.
 */
export async function createOrderAPI(payload, token) {
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        return { ok: response.ok, data };
    } catch (error) {
        console.error('Error de conexión al crear el pedido:', error);
        return { ok: false, data: { error: 'Error de conexión con el servidor' } };
    }
}
