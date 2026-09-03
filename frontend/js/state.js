import { calculateCartTotal } from './domain/catalog.js';

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

    // Validación temprana: Si no existe o no está disponible, salimos rápido
    if (!product || product.disponibilidad === false) {
        return { success: false, error: 'UNAVAILABLE' };
    }

    const cartItemKeys = Object.keys(cart);

    // Validación de restaurante: Solo verificamos si el carrito ya tiene items
    if (cartItemKeys.length > 0) {
        const firstItemProduct = getProductById(cartItemKeys[0]);

        if (
            firstItemProduct &&
            firstItemProduct.restaurante_id !== product.restaurante_id
        ) {
            return { success: false, error: 'DIFFERENT_RESTAURANT' };
        }
    }

    // Si pasa todas las validaciones, agregamos al carrito
    cart[productId] = (cart[productId] || 0) + 1;

    return { success: true };
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

/**
 * Total del carrito para un usuario dado.
 *
 * Antes leía window.currentUser desde dentro del módulo de estado, lo que
 * acoplaba el estado a una global del navegador y hacía imposible probarlo en
 * Node. Ahora el usuario llega por parámetro.
 */
export function getCartTotal(user = typeof window !== 'undefined' ? window.currentUser : null) {
    return calculateCartTotal(cart, getProductById, user);
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
