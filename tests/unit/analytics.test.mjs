import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    CURRENCY,
    VIEWS,
    track,
    trackView,
    trackViewChange,
    resetActiveView,
    toItem,
    buildCartItems,
    trackAddToCart,
    trackRemoveFromCart,
    trackCartEvent,
    trackPurchase,
    trackSearch,
    trackSelectContent
} from '../../frontend/js/analytics.js';

function createFakeWindow(origin = 'http://localhost:8081') {
    const calls = [];
    return {
        calls,
        location: { origin },
        gtag(...args) {
            calls.push(args);
        }
    };
}

describe('White-Box Unit Tests - Google Analytics 4 Module (Frontend)', () => {
    beforeEach(() => {
        resetActiveView('homeView');
    });

    it('track no debe lanzar error cuando gtag no existe y debe devolver false', () => {
        assert.equal(track('add_to_cart', { value: 10 }, {}), false);
        assert.equal(track('add_to_cart', { value: 10 }, null), false);
        assert.equal(track('', {}, createFakeWindow()), false);
        assert.equal(track(null, {}, createFakeWindow()), false);
    });

    it('track no debe propagar errores si gtag lanza una excepción', () => {
        const brokenWin = {
            gtag() {
                throw new Error('Blocked by extension');
            }
        };
        assert.equal(track('view_cart', { value: 25 }, brokenWin), false);
    });

    it('track debe invocar gtag("event", name, params) y devolver true', () => {
        const win = createFakeWindow();
        const ok = track('login', { method: 'email' }, win);
        assert.equal(ok, true);
        assert.deepEqual(win.calls, [['event', 'login', { method: 'email' }]]);
    });

    it('trackView debe mapear todas las vistas conocidas e ignorar IDs desconocidos', () => {
        const win = createFakeWindow('https://foodjet.example');

        for (const [viewId, meta] of Object.entries(VIEWS)) {
            assert.equal(trackView(viewId, win), true);
            const last = win.calls.at(-1);
            assert.deepEqual(last, [
                'event',
                'page_view',
                {
                    page_title: meta.title,
                    page_location: `https://foodjet.example${meta.path}`
                }
            ]);
        }

        const countBefore = win.calls.length;
        assert.equal(trackView('unknownView', win), false);
        assert.equal(win.calls.length, countBefore);
    });

    it('trackViewChange no debe duplicar homeView inicial ni vistas consecutivas iguales', () => {
        const win = createFakeWindow('http://localhost:8081');

        // La carga inicial ya emitió homeView desde el Google tag
        assert.equal(trackViewChange('homeView', win), false);
        assert.equal(win.calls.length, 0);

        // Transición a checkout -> tracking -> homeView
        assert.equal(trackViewChange('checkoutView', win), true);
        assert.equal(trackViewChange('checkoutView', win), false);
        assert.equal(trackViewChange('trackingView', win), true);
        assert.equal(trackViewChange('homeView', win), true);
        assert.equal(trackViewChange('homeView', win), false);

        assert.deepEqual(
            win.calls.map(c => c[2].page_location),
            [
                'http://localhost:8081/checkout',
                'http://localhost:8081/seguimiento',
                'http://localhost:8081/inicio'
            ]
        );
    });

    it('toItem debe limitar estrictamente los campos al catálogo sin exponer PII', () => {
        const productWithExtraFields = {
            id: 42,
            nombre: 'Pizza Artesanal',
            tipo_comida: 'Pizzas',
            precio: 34.9,
            email: 'secreto@mail.com',
            telefono: '999888777',
            direccion: 'Av. Secreta 123',
            usuario: 'admin'
        };

        const item = toItem(productWithExtraFields, 2);
        assert.deepEqual(item, {
            item_id: '42',
            item_name: 'Pizza Artesanal',
            item_category: 'Pizzas',
            price: 34.9,
            quantity: 2
        });
        assert.deepEqual(Object.keys(item).sort(), [
            'item_category',
            'item_id',
            'item_name',
            'price',
            'quantity'
        ]);
        assert.equal(toItem(null), null);
        assert.equal(toItem({}), null);
    });

    it('debe emitir eventos de carrito (add_to_cart, view_cart, begin_checkout, remove_from_cart)', () => {
        const win = createFakeWindow();
        const catalog = {
            1: { id: 1, nombre: 'Hamburguesa Clásica', tipo_comida: 'Hamburguesas', precio: 22.5 },
            2: { id: 2, nombre: 'Limonada', precio: 8 }
        };
        const getById = (id) => catalog[id];

        assert.equal(trackAddToCart(catalog[1], 1, win), true);
        assert.deepEqual(win.calls.at(-1), [
            'event',
            'add_to_cart',
            {
                currency: CURRENCY,
                value: 22.5,
                items: [{
                    item_id: '1',
                    item_name: 'Hamburguesa Clásica',
                    item_category: 'Hamburguesas',
                    price: 22.5,
                    quantity: 1
                }]
            }
        ]);

        const cart = { 1: 2, 2: 1 };
        const built = buildCartItems(cart, getById);
        assert.equal(built.value, 53);
        assert.equal(built.items.length, 2);

        assert.equal(trackCartEvent('view_cart', cart, getById, 48.5, win), true);
        assert.equal(win.calls.at(-1)[1], 'view_cart');
        assert.equal(win.calls.at(-1)[2].value, 48.5);

        assert.equal(trackCartEvent('begin_checkout', cart, getById, undefined, win), true);
        assert.equal(win.calls.at(-1)[1], 'begin_checkout');
        assert.equal(win.calls.at(-1)[2].value, 53);

        assert.equal(trackCartEvent('view_cart', {}, getById, 0, win), false);

        assert.equal(trackRemoveFromCart([toItem(catalog[2], 1)], undefined, win), true);
        assert.equal(win.calls.at(-1)[1], 'remove_from_cart');
        assert.equal(win.calls.at(-1)[2].value, 8);
        assert.equal(trackRemoveFromCart([], undefined, win), false);
    });

    it('debe emitir purchase con datos de transacción sin PII', () => {
        const win = createFakeWindow();
        const items = [toItem({ id: 7, nombre: 'Ceviche', tipo_comida: 'Marina', precio: 35 }, 1)];

        const ok = trackPurchase({
            order: { id: 105, total: 40, costo_envio: 5, impuestos: 6.1 },
            items,
            paymentMethod: 'wallet',
            couponCode: 'FOODJET20'
        }, win);

        assert.equal(ok, true);
        assert.deepEqual(win.calls.at(-1), [
            'event',
            'purchase',
            {
                transaction_id: '105',
                currency: 'PEN',
                value: 40,
                shipping: 5,
                tax: 6.1,
                payment_type: 'wallet',
                coupon: 'FOODJET20',
                items
            }
        ]);
        assert.equal(trackPurchase({ order: null, items }, win), false);
    });

    it('debe emitir search solo con al menos 2 caracteres y select_content válido', () => {
        const win = createFakeWindow();
        assert.equal(trackSearch('a', win), false);
        assert.equal(trackSearch('   ', win), false);
        assert.equal(trackSearch('  pizza  ', win), true);
        assert.deepEqual(win.calls.at(-1), ['event', 'search', { search_term: 'pizza' }]);

        assert.equal(trackSelectContent('categoria', 'Pizzas', win), true);
        assert.deepEqual(win.calls.at(-1), [
            'event',
            'select_content',
            { content_type: 'categoria', item_id: 'Pizzas' }
        ]);
        assert.equal(trackSelectContent('', 'Pizzas', win), false);
        assert.equal(trackSelectContent('favorito', null, win), false);
    });

    it('frontend/index.html debe mantener el Google tag GTM-MCHVQGP6 en <head>', () => {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const indexPath = path.resolve(__dirname, '../../frontend/index.html');
        const html = readFileSync(indexPath, 'utf8');
        const head = html.slice(0, html.indexOf('</head>'));

        assert.match(head, /https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=GTM-MCHVQGP6/);
        assert.match(head, /window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\]/);
        assert.match(head, /gtag\('js',\s*new Date\(\)\)/);
    });
});
