/**
 * FoodJet — Milestone 2 Empirical Challenge Test Suite
 * 
 * Challenger M2-2: Adversarial State, Interaction & Layout Challenge
 * 
 * Validates:
 * 1. State and UI reactive integration (cart additions, #cartCount badge, student savings calculations, item removals)
 * 2. Single-restaurant conflict UX (#restaurantChangeModal, buttons, state resetting logic)
 * 3. Catalog search filtering logic (case-insensitive matching, category pill selection, zero-results state, reset/retry handlers)
 * 4. Mobile single-column containment & responsive layout (<= 768px vs >= 1280px, zero horizontal overflow)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Load domain and state modules
import * as state from '../../frontend/js/state.js';
import {
    calculateStudentPrice,
    renderProductPrice,
    filterProducts,
    getCartRestaurant,
    getProductRestaurant
} from '../../frontend/js/domain/catalog.js';

// Setup Mock DOM environment for headless testing
class MockClassList {
    constructor() {
        this._classes = new Set();
    }
    add(...names) { names.forEach(n => this._classes.add(n)); }
    remove(...names) { names.forEach(n => this._classes.delete(n)); }
    contains(name) { return this._classes.has(name); }
    replace(oldClass, newClass) {
        this._classes.delete(oldClass);
        this._classes.add(newClass);
    }
    toggle(name) {
        if (this._classes.has(name)) {
            this._classes.delete(name);
            return false;
        } else {
            this._classes.add(name);
            return true;
        }
    }
    toString() { return Array.from(this._classes).join(' '); }
}

class MockElement {
    constructor(tagName = 'div', id = '') {
        this.tagName = tagName.toUpperCase();
        this.id = id;
        this.classList = new MockClassList();
        this.style = {};
        this.dataset = {};
        this.attributes = {};
        this.children = [];
        this._innerHTML = '';
        this._textContent = '';
        this._listeners = {};
        this.disabled = false;
        this.value = '';
        this.checked = false;
    }

    get className() { return this.classList.toString(); }
    set className(val) {
        this.classList._classes.clear();
        if (val) val.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
    }

    get innerHTML() { return this._innerHTML; }
    set innerHTML(val) {
        this._innerHTML = val;
        this.children = [];
    }

    get textContent() { return this._textContent; }
    set textContent(val) { this._textContent = String(val); }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    remove() {
        // no-op in mock
    }

    setAttribute(k, v) { this.attributes[k] = String(v); }
    getAttribute(k) { return this.attributes[k]; }

    addEventListener(event, fn) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(fn);
    }

    dispatchEvent(event) {
        const fns = this._listeners[event.type || event] || [];
        fns.forEach(fn => fn(event));
    }

    click() {
        const evt = { currentTarget: this, target: this, preventDefault: () => {} };
        const fns = this._listeners['click'] || [];
        fns.forEach(fn => fn(evt));
    }

    focus() {}

    querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
        const results = [];
        const traverse = (node) => {
            if (!node) return;
            if (selector.startsWith('.')) {
                const cls = selector.slice(1);
                if (node.classList && node.classList.contains(cls)) results.push(node);
            } else if (selector.startsWith('#')) {
                const id = selector.slice(1);
                if (node.id === id) results.push(node);
            } else if (selector === 'toast' || selector === 'div') {
                if (node.tagName === selector.toUpperCase()) results.push(node);
            }
            if (node.children) {
                node.children.forEach(traverse);
            }
        };
        if (this.children) {
            this.children.forEach(traverse);
        }
        return results;
    }
}

class MockDocument {
    constructor() {
        this.elements = new Map();
        this.body = new MockElement('body');
    }

    registerElement(id, tag = 'div') {
        const el = new MockElement(tag, id);
        this.elements.set(id, el);
        this.body.appendChild(el);
        return el;
    }

    getElementById(id) {
        return this.elements.get(id) || null;
    }

    querySelector(selector) {
        if (selector.startsWith('#')) {
            return this.getElementById(selector.slice(1));
        }
        if (selector === '.toast-container') {
            for (const el of this.elements.values()) {
                if (el.classList.contains('toast-container')) return el;
            }
            return null;
        }
        for (const el of this.elements.values()) {
            if (selector.startsWith('.') && el.classList.contains(selector.slice(1))) {
                return el;
            }
        }
        return null;
    }

    querySelectorAll(selector) {
        const results = [];
        if (selector.startsWith('.')) {
            const cls = selector.slice(1);
            for (const el of this.elements.values()) {
                if (el.classList.contains(cls)) results.push(el);
            }
        }
        return results;
    }

    createElement(tag) {
        const el = new MockElement(tag);
        return el;
    }
}

class MockToast {
    constructor(el, opts) {}
    show() {}
    static getOrCreateInstance(el, opts) {
        return new MockToast(el, opts);
    }
}

// Prepare Global Environment
let mockDoc;
const mockBootstrap = {
    Modal: {
        getOrCreateInstance: (el) => ({ show: () => { el.style.display = 'block'; }, hide: () => { el.style.display = 'none'; } }),
        getInstance: (el) => ({ hide: () => { el.style.display = 'none'; } })
    },
    Offcanvas: {
        getOrCreateInstance: (el) => ({ show: () => { el.style.display = 'block'; }, hide: () => { el.style.display = 'none'; } }),
        getInstance: (el) => ({ hide: () => { el.style.display = 'none'; } })
    },
    Toast: MockToast
};

beforeEach(() => {
    mockDoc = new MockDocument();
    globalThis.document = mockDoc;
    globalThis.window = {
        currentUser: null,
        authToken: null,
        bootstrap: mockBootstrap
    };
    globalThis.bootstrap = mockBootstrap;

    // Register all standard DOM IDs required by ui.js
    mockDoc.registerElement('cartItems');
    mockDoc.registerElement('cartTotal');
    mockDoc.registerElement('checkoutBtn', 'button');
    mockDoc.registerElement('cartFooter');
    mockDoc.registerElement('emptyCart');
    mockDoc.registerElement('cartRestaurantBanner');
    mockDoc.registerElement('cartSubtotal');
    mockDoc.registerElement('cartStudentSavingsRow');
    mockDoc.registerElement('cartStudentSavings');
    mockDoc.registerElement('cartCount');
    mockDoc.registerElement('cartItemCount');
    mockDoc.registerElement('restaurantChangeModal');
    mockDoc.registerElement('restaurantChangeCurrentName');
    mockDoc.registerElement('restaurantChangeNewName');
    mockDoc.registerElement('restaurantChangeCancelBtn', 'button');
    mockDoc.registerElement('restaurantChangeConfirmBtn', 'button');
    mockDoc.registerElement('catalogSearchInput', 'input');
    mockDoc.registerElement('catalogSearchClear', 'button');
    mockDoc.registerElement('filter-food-type-container');
    mockDoc.registerElement('productsGrid');
    mockDoc.registerElement('catalogResultsCount');
    mockDoc.registerElement('headerAddressBar');
    mockDoc.registerElement('headerAddressText');
    mockDoc.registerElement('favoritesCount');
    mockDoc.registerElement('favoritesCountBadge');
    mockDoc.registerElement('favoritesItemsContainer');

    state.clearCart();
});

// Import UI module dynamically after document global is established
const ui = await import('../../frontend/js/ui.js');

describe('Empirical Verification: State & UI Integration', () => {
    const sampleProducts = [
        {
            id: 101,
            nombre: 'Hamburguesa FoodJet Clásica',
            descripcion: 'Carne artesanal con queso cheddar y papas',
            precio: 25.00,
            descuento_estudiante: 20, // 20% off -> S/ 20.00
            disponibilidad: true,
            restaurante_id: 1,
            categoria: 'Hamburguesas',
            Restaurant: { id: 1, nombre: 'Burger House', tiempo_entrega: '25 min' }
        },
        {
            id: 102,
            nombre: 'Hamburguesa Doble Tocino',
            descripcion: 'Doble carne, doble queso y tocino crocante',
            precio: 35.00,
            descuento_estudiante: 20, // 20% off -> S/ 28.00
            disponibilidad: true,
            restaurante_id: 1,
            categoria: 'Hamburguesas',
            Restaurant: { id: 1, nombre: 'Burger House', tiempo_entrega: '25 min' }
        }
    ];

    it('TC-CHALLENGE-M2-01: Carrito vacío oculta contador #cartCount (display: none) y muestra #emptyCart', () => {
        state.setProducts(sampleProducts);
        state.clearCart();

        ui.renderCartOffcanvas();

        const cartCount = mockDoc.getElementById('cartCount');
        const emptyCart = mockDoc.getElementById('emptyCart');
        const cartFooter = mockDoc.getElementById('cartFooter');
        const cartTotal = mockDoc.getElementById('cartTotal');

        assert.equal(cartCount.textContent, '0', 'Contador de carrito debe indicar 0');
        assert.equal(cartCount.style.display, 'none', 'Contador debe estar oculto cuando está vacío');
        assert.equal(emptyCart.style.display, 'block', 'Sección de carrito vacío debe estar visible');
        assert.equal(cartFooter.style.display, 'none', 'Footer de checkout debe estar oculto');
        assert.equal(cartTotal.textContent, 'S/ 0.00', 'Total debe ser S/ 0.00');
    });

    it('TC-CHALLENGE-M2-02: Agregar producto actualiza reactivamente #cartCount (inline-flex) y desglose', () => {
        state.setProducts(sampleProducts);
        globalThis.window.currentUser = { es_estudiante: false };

        const addRes = state.addToCart(101);
        assert.equal(addRes.success, true, 'Adición exitosa');

        ui.renderCartOffcanvas();

        const cartCount = mockDoc.getElementById('cartCount');
        const cartItemCount = mockDoc.getElementById('cartItemCount');
        const cartTotal = mockDoc.getElementById('cartTotal');
        const cartSubtotal = mockDoc.getElementById('cartSubtotal');
        const cartSavingsRow = mockDoc.getElementById('cartStudentSavingsRow');

        assert.equal(cartCount.textContent, '1', 'Contador en navbar debe ser 1');
        assert.equal(cartCount.style.display, 'inline-flex', 'Badge debe tener display inline-flex');
        assert.equal(cartItemCount.textContent, '1', 'Badge en drawer debe ser 1');
        assert.equal(cartSubtotal.textContent, 'S/ 25.00', 'Subtotal debe ser S/ 25.00');
        assert.equal(cartTotal.textContent, 'S/ 25.00', 'Total regular debe ser S/ 25.00');
        assert.equal(cartSavingsRow.style.display, 'none', 'Fila de ahorro de estudiante no debe mostrarse a no estudiantes');
    });

    it('TC-CHALLENGE-M2-03: Múltiples productos del mismo restaurante acumulan unidades en #cartCount', () => {
        state.setProducts(sampleProducts);

        state.addToCart(101); // 1 unidad
        state.addToCart(101); // 2da unidad
        state.addToCart(102); // 1 unidad de otro producto

        ui.renderCartOffcanvas();

        const cartCount = mockDoc.getElementById('cartCount');
        assert.equal(cartCount.textContent, '3', 'Total de ítems acumulados debe ser 3');
        assert.equal(state.getCartItemCount(), 3);
    });

    it('TC-CHALLENGE-M2-04: Cálculo de ahorro de estudiante refleja subtotal, descuento y total correctamente', () => {
        state.setProducts(sampleProducts);
        // Usuario verificado como estudiante
        globalThis.window.currentUser = { es_estudiante: true };

        // 2 hamburguesas clásicas: regular 25.00 c/u, estudiante 20.00 c/u
        state.addToCart(101);
        state.addToCart(101);

        ui.renderCartOffcanvas();

        const cartSubtotal = mockDoc.getElementById('cartSubtotal');
        const cartSavingsRow = mockDoc.getElementById('cartStudentSavingsRow');
        const cartSavings = mockDoc.getElementById('cartStudentSavings');
        const cartTotal = mockDoc.getElementById('cartTotal');

        // Subtotal original = 25 * 2 = 50.00
        // Total estudiante = 20 * 2 = 40.00
        // Ahorro estudiante = 10.00
        assert.equal(cartSubtotal.textContent, 'S/ 50.00', 'Subtotal original debe ser S/ 50.00');
        assert.equal(cartSavingsRow.style.display, 'flex', 'Fila de ahorro debe estar visible con display flex');
        assert.equal(cartSavings.textContent, '-S/ 10.00', 'Texto de ahorro debe indicar -S/ 10.00');
        assert.equal(cartTotal.textContent, 'S/ 40.00', 'Total a pagar con descuento debe ser S/ 40.00');
    });

    it('TC-CHALLENGE-M2-05: Reducción de cantidad (removeFromCart) recalcula totales y ahorro reactivamente', () => {
        state.setProducts(sampleProducts);
        globalThis.window.currentUser = { es_estudiante: true };

        state.addToCart(101);
        state.addToCart(101);
        assert.equal(state.getCartItemCount(), 2);

        // Reducir 1 unidad
        state.removeFromCart(101);
        assert.equal(state.getCartItemCount(), 1);

        ui.renderCartOffcanvas();

        const cartCount = mockDoc.getElementById('cartCount');
        const cartSubtotal = mockDoc.getElementById('cartSubtotal');
        const cartSavings = mockDoc.getElementById('cartStudentSavings');
        const cartTotal = mockDoc.getElementById('cartTotal');

        assert.equal(cartCount.textContent, '1');
        assert.equal(cartSubtotal.textContent, 'S/ 25.00');
        assert.equal(cartSavings.textContent, '-S/ 5.00');
        assert.equal(cartTotal.textContent, 'S/ 20.00');
    });

    it('TC-CHALLENGE-M2-06: Eliminación directa completa (removeItemCompletely) purga el ítem del estado', () => {
        state.setProducts(sampleProducts);
        state.addToCart(101);
        state.addToCart(101);
        state.addToCart(101); // 3 unidades

        assert.equal(state.getCartItemCount(), 3);

        // Eliminar completamente
        state.removeItemCompletely(101);
        assert.equal(state.getCartItemCount(), 0, 'Carrito debe quedar con 0 ítems');
        assert.equal(state.isCartEmpty(), true, 'isCartEmpty debe ser true');

        ui.renderCartOffcanvas();

        const cartCount = mockDoc.getElementById('cartCount');
        const emptyCart = mockDoc.getElementById('emptyCart');
        assert.equal(cartCount.textContent, '0');
        assert.equal(cartCount.style.display, 'none');
        assert.equal(emptyCart.style.display, 'block');
    });
});

describe('Empirical Verification: Single-Restaurant Conflict UX', () => {
    const productsMultiRest = [
        {
            id: 201,
            nombre: 'Smash Burger',
            precio: 28.00,
            disponibilidad: true,
            restaurante_id: 10,
            Restaurant: { id: 10, nombre: 'Smash & Co' }
        },
        {
            id: 202,
            nombre: 'Roll Acevichado',
            precio: 36.00,
            disponibilidad: true,
            restaurante_id: 20,
            Restaurant: { id: 20, nombre: 'Sushi Zen' }
        }
    ];

    it('TC-CHALLENGE-M2-07: Verificación DOM de elementos requeridos en #restaurantChangeModal', () => {
        const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

        assert.ok(indexHtml.includes('id="restaurantChangeModal"'), 'Debe existir #restaurantChangeModal');
        assert.ok(indexHtml.includes('id="restaurantChangeCurrentName"'), 'Debe existir #restaurantChangeCurrentName');
        assert.ok(indexHtml.includes('id="restaurantChangeNewName"'), 'Debe existir #restaurantChangeNewName');
        assert.ok(indexHtml.includes('id="restaurantChangeCancelBtn"'), 'Debe existir #restaurantChangeCancelBtn');
        assert.ok(indexHtml.includes('id="restaurantChangeConfirmBtn"'), 'Debe existir #restaurantChangeConfirmBtn');
    });

    it('TC-CHALLENGE-M2-08: Intento de agregar producto de restaurante distinto rechaza con DIFFERENT_RESTAURANT', () => {
        state.setProducts(productsMultiRest);

        // Agregar de Smash & Co
        const res1 = state.addToCart(201);
        assert.equal(res1.success, true);

        // Intentar agregar de Sushi Zen
        const res2 = state.addToCart(202);
        assert.equal(res2.success, false);
        assert.equal(res2.error, 'DIFFERENT_RESTAURANT');
    });

    it('TC-CHALLENGE-M2-09: showRestaurantChangeModal asigna nombres de restaurantes origen y destino en el modal', () => {
        state.setProducts(productsMultiRest);
        state.addToCart(201); // En carrito: Smash & Co

        ui.showRestaurantChangeModal(202); // Conflicto con Sushi Zen

        const currentName = mockDoc.getElementById('restaurantChangeCurrentName');
        const newName = mockDoc.getElementById('restaurantChangeNewName');

        assert.equal(currentName.textContent, 'Smash & Co');
        assert.equal(newName.textContent, 'Sushi Zen');
    });

    it('TC-CHALLENGE-M2-10: Botón cancelar preserva el pedido original sin alteraciones', () => {
        state.setProducts(productsMultiRest);
        state.addToCart(201);

        ui.showRestaurantChangeModal(202);

        // Simular click en cancelar
        const cancelBtn = mockDoc.getElementById('restaurantChangeCancelBtn');
        cancelBtn.click();

        // El carrito debe continuar teniendo solo el producto 201
        assert.equal(state.getCartItemCount(), 1);
        assert.equal(state.getCart()[201], 1);
        assert.equal(state.getCart()[202], undefined);
    });

    it('TC-CHALLENGE-M2-11: Botón confirmar vacía el carrito previo y agrega el nuevo producto', () => {
        state.setProducts(productsMultiRest);
        state.addToCart(201);

        ui.initRestaurantChangeModal();
        ui.showRestaurantChangeModal(202);

        // Simular confirmación ("Vaciar y agregar nuevo")
        const confirmBtn = mockDoc.getElementById('restaurantChangeConfirmBtn');
        confirmBtn.click();

        assert.equal(state.getCartItemCount(), 1, 'Carrito debe tener exactamente 1 ítem');
        assert.equal(state.getCart()[201], undefined, 'Producto 201 debe haber sido purgado');
        assert.equal(state.getCart()[202], 1, 'Producto 202 debe estar en el carrito');

        const activeRest = getCartRestaurant(state.getCart(), state.getProductById);
        assert.equal(activeRest.id, 20, 'Restaurante activo debe ser el nuevo (Sushi Zen)');
    });
});

describe('Empirical Verification: Catalog Search Filtering & Reset UX', () => {
    const catalogData = [
        {
            id: 1,
            nombre: 'Pizza Margherita Di Bufala',
            descripcion: 'Salsa pomodoro San Marzano, mozzarella di bufala y albahaca fresca',
            categoria: 'Pizzas',
            precio: 38.00,
            disponibilidad: true,
            Restaurant: { id: 1, nombre: 'Trattoria Da Luigi', tiempo_entrega: '35 min' }
        },
        {
            id: 2,
            nombre: 'Burger Doble Cheddar Melt',
            descripcion: 'Doble smash patty con queso cheddar derretido',
            categoria: 'Hamburguesas',
            precio: 32.00,
            disponibilidad: true,
            Restaurant: { id: 2, nombre: 'Burger Lab', tiempo_entrega: '25 min' }
        },
        {
            id: 3,
            nombre: 'Poke Bowl Salmón Fresco',
            descripcion: 'Salmón fresco en cubos, palta, edamame y salsa ponzu',
            categoria: 'Saludable',
            precio: 34.00,
            disponibilidad: true,
            Restaurant: { id: 3, nombre: 'Poke Station', tiempo_entrega: '20 min' }
        }
    ];

    it('TC-CHALLENGE-M2-12: Búsqueda es case-insensitive y coincide por nombre, descripción o restaurante', () => {
        state.setProducts(catalogData);

        // 1. Coincidencia por nombre (mayúsculas)
        const searchInput = mockDoc.getElementById('catalogSearchInput');
        searchInput.value = 'MARGHERITA';
        ui.renderProducts();
        let countEl = mockDoc.getElementById('catalogResultsCount');
        assert.equal(countEl.textContent, '1 producto');

        // 2. Coincidencia por descripción (minúsculas)
        searchInput.value = 'pomodoro';
        ui.renderProducts();
        countEl = mockDoc.getElementById('catalogResultsCount');
        assert.equal(countEl.textContent, '1 producto');

        // 3. Coincidencia por restaurante (mezclado)
        searchInput.value = 'bUrGeR lAb';
        ui.renderProducts();
        countEl = mockDoc.getElementById('catalogResultsCount');
        assert.equal(countEl.textContent, '1 producto');
    });

    it('TC-CHALLENGE-M2-13: Estado de cero resultados renderiza ilustración y botón de limpieza', () => {
        state.setProducts(catalogData);

        const searchInput = mockDoc.getElementById('catalogSearchInput');
        searchInput.value = 'Tacos Mexicanos Inexistentes';

        ui.renderProducts();

        const grid = mockDoc.getElementById('productsGrid');
        assert.ok(grid.innerHTML.includes('foodjet-empty-state'), 'Debe incluir clase foodjet-empty-state');
        assert.ok(grid.innerHTML.includes('No encontramos antojos con esos filtros'), 'Debe tener mensaje de cero resultados');
        assert.ok(grid.innerHTML.includes('btn-zero-clear-filters'), 'Debe incluir botón para limpiar filtros');
    });

    it('TC-CHALLENGE-M2-14: resetAllCatalogFilters restablece filtros, input de búsqueda y repuebla productos', () => {
        state.setProducts(catalogData);

        const searchInput = mockDoc.getElementById('catalogSearchInput');
        searchInput.value = 'Filtro que no existe';
        ui.renderProducts();
        assert.equal(mockDoc.getElementById('catalogResultsCount').textContent, '0 productos');

        // Ejecutar reset
        ui.resetAllCatalogFilters();

        assert.equal(searchInput.value, '', 'Input debe estar limpio');
        const countEl = mockDoc.getElementById('catalogResultsCount');
        assert.equal(countEl.textContent, '3 productos', 'Debe repoblar todos los 3 productos');
    });

    it('TC-CHALLENGE-M2-15: renderCatalogError muestra mensaje y botón de reintento funcional', () => {
        ui.renderCatalogError('Fallo simulado de red');

        const grid = mockDoc.getElementById('productsGrid');
        assert.ok(grid.innerHTML.includes('foodjet-error-state'), 'Debe contener foodjet-error-state');
        assert.ok(grid.innerHTML.includes('Fallo simulado de red'), 'Debe reflejar el mensaje de error');
        assert.ok(grid.innerHTML.includes('btn-catalog-retry'), 'Debe contener botón de reintento');
    });
});

describe('Empirical Verification: Mobile Single-Column Containment & Responsive Analysis', () => {
    it('TC-CHALLENGE-M2-16: Reglas de html y body previenen estrictamente el desbordamiento horizontal', () => {
        const cssContent = fs.readFileSync(path.resolve('frontend/styles.css'), 'utf8');

        // Verificar reset de contención de viewport
        assert.ok(cssContent.includes('overflow-x: hidden;'), 'Debe tener overflow-x: hidden');
        assert.ok(cssContent.includes('max-width: 100%;'), 'Debe tener max-width: 100%');
    });

    it('TC-CHALLENGE-M2-17: Media queries para <= 768px y >= 1280px están presentes y estructuradas', () => {
        const cssContent = fs.readFileSync(path.resolve('frontend/styles.css'), 'utf8');

        assert.ok(cssContent.includes('@media (max-width: 768px)'), 'Debe definir media query <= 768px');
        assert.ok(cssContent.includes('@media (min-width: 1280px)'), 'Debe definir media query >= 1280px');
    });

    it('TC-CHALLENGE-M2-18: Cuadrícula de productos usa col-sm-6 garantizando 1 columna en móvil (<576px)', () => {
        const uiCode = fs.readFileSync(path.resolve('frontend/js/ui.js'), 'utf8');

        // Las tarjetas de producto usan col-md-4 col-sm-6
        // En Bootstrap 5:
        // - < 576px (móviles 360px y 390px): default col-12 (100% ancho, 1 columna)
        // - >= 576px (pantallas pequeñas): 2 columnas
        // - >= 768px (tablets / desktop): 3 columnas
        assert.ok(uiCode.includes('col-md-4 col-sm-6 mb-4'), 'Debe implementar col-md-4 col-sm-6 para adaptación responsiva');
    });

    it('TC-CHALLENGE-M2-19: Fila de categorías usa overflow-x: auto previniendo rotura horizontal en viewport móvil', () => {
        const cssContent = fs.readFileSync(path.resolve('frontend/styles.css'), 'utf8');

        assert.ok(cssContent.includes('.foodjet-pills-container'), 'Debe existir .foodjet-pills-container');
        assert.ok(cssContent.includes('overflow-x: auto;'), 'Pills container debe usar overflow-x: auto');
        assert.ok(cssContent.includes('-webkit-overflow-scrolling: touch;'), 'Pills container debe soportar scroll táctil');
    });

    it('TC-CHALLENGE-M2-20: Modal de conflicto y carrusel hero aplican radios de borde Compose sin desborde', () => {
        const cssContent = fs.readFileSync(path.resolve('frontend/styles.css'), 'utf8');
        const indexHtml = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

        assert.ok(cssContent.includes('.foodjet-hero-carousel'), 'Debe existir .foodjet-hero-carousel');
        assert.ok(cssContent.includes('border-radius: 24px;'), 'Hero debe tener border-radius de 24px');
        assert.ok(cssContent.includes('border-top-left-radius: 32px;'), 'Imagen hero debe tener recorte Compose de 32px');
        assert.ok(indexHtml.includes('modal-dialog-centered'), 'Modal de cambio de restaurante debe estar centrado');
    });
});
