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
        cart[productId] = (cart[productId] || 0) + 1;
        return true;
    }
    return false;
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
            total += product.precio * quantity;
        }
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
