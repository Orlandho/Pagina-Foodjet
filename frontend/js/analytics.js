/**
 * Módulo de analítica web para Google Analytics 4 (G-Z47ZE0BZL9 vía Google tag).
 *
 * Centraliza el envío de eventos GA4 recomendados sin acoplar la lógica de
 * negocio ni exponer datos personales (PII). Si `gtag` no está disponible
 * (bloqueadores, entorno offline o pruebas unitarias), degrada en silencio.
 */

export const CURRENCY = 'PEN';

export const VIEWS = Object.freeze({
    homeView: Object.freeze({ path: '/inicio', title: 'Inicio - Catálogo' }),
    checkoutView: Object.freeze({ path: '/checkout', title: 'Checkout' }),
    trackingView: Object.freeze({ path: '/seguimiento', title: 'Seguimiento del pedido' }),
    orderHistoryView: Object.freeze({ path: '/mis-pedidos', title: 'Mis pedidos' }),
    dashboardView: Object.freeze({ path: '/panel', title: 'Panel de operaciones' })
});

// La carga inicial de index.html ya emite el page_view de Inicio a través del
// Google tag; arrancamos en 'homeView' para no duplicarlo.
let activeViewId = 'homeView';

function roundMoney(amount) {
    const num = Number(amount);
    if (!Number.isFinite(num) || num < 0) return 0;
    return Number(num.toFixed(2));
}

export function track(name, params = {}, win = globalThis.window) {
    try {
        if (typeof name !== 'string' || !name.trim()) return false;
        if (typeof win?.gtag !== 'function') return false;
        win.gtag('event', name, params);
        return true;
    } catch {
        // La analítica nunca debe interrumpir el flujo de compra ni la interfaz.
        return false;
    }
}

export function trackView(viewId, win = globalThis.window) {
    const view = VIEWS[viewId];
    if (!view) return false;

    const origin = win?.location?.origin && win.location.origin !== 'null'
        ? win.location.origin
        : '';

    return track('page_view', {
        page_title: view.title,
        page_location: `${origin}${view.path}`
    }, win);
}

export function trackViewChange(viewId, win = globalThis.window) {
    if (!VIEWS[viewId] || viewId === activeViewId) return false;
    activeViewId = viewId;
    return trackView(viewId, win);
}

export function resetActiveView(viewId = 'homeView') {
    activeViewId = VIEWS[viewId] ? viewId : 'homeView';
}

export function toItem(product, quantity = 1) {
    if (!product || product.id === undefined || product.id === null) return null;

    const parsedQty = Number(quantity);
    const safeQty = Number.isFinite(parsedQty) && parsedQty > 0 ? Math.floor(parsedQty) : 1;

    return {
        item_id: String(product.id),
        item_name: String(product.nombre ?? ''),
        item_category: String(product.categoria?.nombre || product.tipo_comida || 'General'),
        price: roundMoney(product.precio),
        quantity: safeQty
    };
}

export function buildCartItems(cart, getProductById) {
    if (!cart || typeof getProductById !== 'function') {
        return { items: [], value: 0 };
    }

    const items = [];
    let rawTotal = 0;

    for (const [productId, qty] of Object.entries(cart)) {
        const product = getProductById(productId);
        const item = toItem(product, qty);
        if (!item) continue;
        items.push(item);
        rawTotal += item.price * item.quantity;
    }

    return { items, value: roundMoney(rawTotal) };
}

export function trackAddToCart(product, quantity = 1, win = globalThis.window) {
    const item = toItem(product, quantity);
    if (!item) return false;

    return track('add_to_cart', {
        currency: CURRENCY,
        value: roundMoney(item.price * item.quantity),
        items: [item]
    }, win);
}

export function trackRemoveFromCart(items, valueOverride, win = globalThis.window) {
    if (!Array.isArray(items) || items.length === 0) return false;

    const computedValue = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
    const value = valueOverride !== undefined ? roundMoney(valueOverride) : roundMoney(computedValue);

    return track('remove_from_cart', {
        currency: CURRENCY,
        value,
        items
    }, win);
}

export function trackCartEvent(eventName, cart, getProductById, totalOverride, win = globalThis.window) {
    const { items, value } = buildCartItems(cart, getProductById);
    if (items.length === 0) return false;

    return track(eventName, {
        currency: CURRENCY,
        value: totalOverride !== undefined ? roundMoney(totalOverride) : value,
        items
    }, win);
}

export function trackPurchase({ order, items, paymentMethod, couponCode } = {}, win = globalThis.window) {
    if (!order || order.id === undefined || order.id === null) return false;

    const payload = {
        transaction_id: String(order.id),
        currency: CURRENCY,
        value: roundMoney(order.total),
        shipping: roundMoney(order.costo_envio),
        tax: roundMoney(order.impuestos),
        payment_type: String(paymentMethod || 'unknown'),
        items: Array.isArray(items) ? items : []
    };

    if (couponCode) {
        payload.coupon = String(couponCode);
    }

    return track('purchase', payload, win);
}

const CATALOG_SEARCH_TERMS = new Set([
    'bebida', 'cena', 'comida rápida', 'ensalada', 'hamburguesa', 'pizza', 'sushi'
]);

export function trackSearch(term, win = globalThis.window) {
    if (typeof term !== 'string') return false;
    const query = term.trim().toLowerCase();
    if (query.length < 2) return false;

    // El buscador acepta texto libre. GA4 solo recibe términos públicos predefinidos.
    const searchTerm = CATALOG_SEARCH_TERMS.has(query) ? query : '(otro)';
    return track('search', { search_term: searchTerm }, win);
}

export function trackSelectContent(contentType, itemId, win = globalThis.window) {
    if (typeof contentType !== 'string' || !contentType.trim()) return false;
    if (itemId === undefined || itemId === null || String(itemId).trim() === '') return false;

    return track('select_content', {
        content_type: contentType.trim(),
        item_id: String(itemId).trim()
    }, win);
}

// Exposición controlada para legacy.js (script clásico que no puede usar import).
if (typeof window !== 'undefined') {
    window.foodjetAnalytics = {
        track,
        trackView,
        trackViewChange
    };
}
