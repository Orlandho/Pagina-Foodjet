const API_URL = window.FOODJET_API_URL;

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

/**
 * Obtiene la lista de productos favoritos del usuario.
 * @param {string} token Token de autorización del usuario
 * @returns {Promise<Array>} Lista de productos favoritos
 */
export async function fetchFavoritesAPI(token) {
    try {
        const response = await fetch(`${API_URL}/favorites`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            return await response.json();
        } else {
            console.error('Error al cargar favoritos');
            return [];
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        return [];
    }
}

/**
 * Obtiene el historial de pedidos del usuario.
 * @param {string} token Token de autorización del usuario
 * @returns {Promise<Array>} Lista de pedidos
 */
export async function fetchMyOrdersAPI(token) {
    try {
        const response = await fetch(`${API_URL}/orders/my-orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            return await response.json();
        } else {
            console.error('Error al cargar historial de pedidos');
            return [];
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        return [];
    }
}

/**
 * Consulta un pedido concreto. La vista de seguimiento la llama cada pocos
 * segundos para saber en qué etapa va la entrega.
 * @param {number} orderId ID del pedido
 * @param {string} token Token de autorización del usuario
 * @returns {Promise<Object>} {ok, data}
 */
export async function fetchOrderByIdAPI(orderId, token) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        return { ok: response.ok, status: response.status, data };
    } catch (error) {
        console.error('Error de conexión al consultar el pedido:', error);
        return { ok: false, status: 0, data: null };
    }
}

/**
 * Alterna el estado de favorito de un producto.
 * @param {number} productId ID del producto
 * @param {string} token Token de autorización del usuario
 * @returns {Promise<Object>} Resultado de la operación {ok, data}
 */
export async function toggleFavoriteAPI(productId, token) {
    try {
        const response = await fetch(`${API_URL}/favorites/${productId}/toggle`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        return { ok: response.ok, data };
    } catch (error) {
        console.error('Error de conexión al alternar favorito:', error);
        return { ok: false, data: { error: 'Error de conexión con el servidor' } };
    }
}

/**
 * Envía una reseña para un pedido.
 * @param {Object} payload { pedido_id, puntuacion, comentario }
 * @param {string} token Token de autorización
 * @returns {Promise<Object>} Resultado
 */
export async function createReviewAPI(payload, token) {
    try {
        const response = await fetch(`${API_URL}/reviews`, {
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
        console.error('Error de conexión al enviar la reseña:', error);
        return { ok: false, data: { error: 'Error de conexión con el servidor' } };
    }
}

/**
 * Verifica el estado de estudiante enviando una imagen.
 * @param {File} imageFile Imagen del carnet universitario
 * @param {string} token Token de autorización del usuario
 * @returns {Promise<Object>} Resultado de la verificación
 */
export async function verifyStudentAPI(imageFile, token) {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await fetch(`${API_URL}/users/verify-student`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        return { ok: response.ok, data };
    } catch (error) {
        console.error('Error de conexión al verificar estudiante:', error);
        return { ok: false, data: { error: 'Error de conexión con el servidor' } };
    }
}
