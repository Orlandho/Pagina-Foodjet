/**
 * Reglas de catálogo: precio con descuento estudiantil y filtrado.
 *
 * Vivían dentro de ui.js, un módulo que toca el DOM en cuanto se importa, así
 * que no había forma de probarlas contra el código real. Al ser puras, ahora
 * Cucumber puede importarlas directamente.
 */

/** Precio final de un producto para un usuario dado. */
export function calculateStudentPrice(product, user) {
    let finalPrice = product.precio;
    let hasDiscount = false;

    if (user && user.es_estudiante && product.descuento_estudiante > 0) {
        finalPrice = product.precio - (product.precio * (product.descuento_estudiante / 100));
        hasDiscount = true;
    }

    return {
        originalPrice: product.precio,
        finalPrice,
        hasDiscount
    };
}

/** HTML del precio: tachado + rebajado cuando hay descuento. */
export function renderProductPrice(product, user) {
    const priceData = calculateStudentPrice(product, user);

    if (priceData.hasDiscount) {
        return `
            <span class="text-decoration-line-through text-muted fs-6">
                S/ ${priceData.originalPrice.toFixed(2)}
            </span>
            <span class="text-success fw-bold ms-2">
                S/ ${priceData.finalPrice.toFixed(2)}
            </span>
        `;
    }

    return `S/ ${priceData.originalPrice.toFixed(2)}`;
}

/** Traduce el tiempo de entrega, que se guarda como texto libre, a minutos. */
export function parseDeliveryTime(tiempoStr) {
    if (!tiempoStr) return 999999;

    if (tiempoStr.includes("30")) return 30;
    if (tiempoStr.includes("1 hora") && !tiempoStr.includes("Más")) return 60;
    if (tiempoStr.includes("Más de 1 hora")) return 90;

    return parseInt(tiempoStr) || 0;
}

export function filterProducts(products, minPrice, maxPrice, maxTime, selectedCategories) {
    return products.filter(product => {
        const matchesPrice = product.precio >= minPrice && product.precio <= maxPrice;

        const productTime = parseDeliveryTime(product.Restaurant?.tiempo_entrega);
        const matchesTime = productTime <= maxTime;

        const categoryName = product.categoria?.nombre || product.tipo_comida;
        const matchesCategory =
            selectedCategories.length === 0 || selectedCategories.includes(categoryName);

        return matchesPrice && matchesTime && matchesCategory;
    });
}

/** Total del carrito, con el descuento estudiantil ya aplicado. */
export function calculateCartTotal(cart, getProductById, user) {
    return Object.entries(cart).reduce((total, [productId, cantidad]) => {
        const product = getProductById(productId);
        if (!product) return total;

        return total + calculateStudentPrice(product, user).finalPrice * cantidad;
    }, 0);
}
