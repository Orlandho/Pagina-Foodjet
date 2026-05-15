// Estado local de la aplicación para el CUN01

let products = [];
let cart = {}; // Formato: { productId: cantidad }

export function getProducts() {
    return products;
}

export function setProducts(newProducts) {
    products = newProducts;
}

export function getProductById(productId) {
    return products.find(p => p.id == productId);
}

export function getCart() {
    return cart;
}

export function isCartEmpty() {
    return Object.keys(cart).length === 0;
}

export function getCartItemCount() {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

export function addToCart(productId) {
    const product = getProductById(productId);
    // Verificar que el producto exista y esté disponible
    if (product && product.disponibilidad !== false) {
        // Verificar si el carrito no está vacío y comparar el restaurante
        const cartItemKeys = Object.keys(cart);
        if (cartItemKeys.length > 0) {
            const firstItemProductId = cartItemKeys[0];
            const firstItemProduct = getProductById(firstItemProductId);

            if (firstItemProduct && firstItemProduct.restaurante_id !== product.restaurante_id) {
                return { success: false, error: 'DIFFERENT_RESTAURANT' };
            }
        }

        cart[productId] = (cart[productId] || 0) + 1;
        return { success: true };
    }
    return { success: false, error: 'UNAVAILABLE' };
}

export function removeFromCart(productId) {
    if (cart[productId] > 1) {
        cart[productId]--;
    } else {
        delete cart[productId];
    }
}

export function removeItemCompletely(productId) {
    delete cart[productId];
}

export function clearCart() {
    cart = {};
}

export function getCartTotal() {
    let total = 0;
    Object.entries(cart).forEach(([productId, quantity]) => {
        const product = getProductById(productId);
        if (product) {


            let price = product.precio;
            if (window.currentUser && window.currentUser.es_estudiante && product.descuento_estudiante > 0) {
                price = price - (price * (product.descuento_estudiante / 100));
            }
            total += price * quantity;        }
    });
    return total;
}

let activeCoupon = null;

export function setActiveCoupon(coupon) {
    activeCoupon = coupon;
}

export function getActiveCoupon() {
    return activeCoupon;
}


// Estado de favoritos
let favorites = []; // Array de IDs o objetos de producto completos devueltos por el backend

export function getFavorites() {
    return favorites;
}

export function setFavorites(newFavorites) {
    favorites = newFavorites;
}

export function isFavorite(productId) {
    return favorites.some(fav => fav.id == productId);
}

export function addFavorite(productObj) {
    if (!isFavorite(productObj.id)) {
        favorites.push(productObj);
    }
}

export function removeFavorite(productId) {
    favorites = favorites.filter(fav => fav.id != productId);
}
