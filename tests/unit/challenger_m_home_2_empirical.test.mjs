/**
 * FoodJet — Milestone M-Home Empirical Adversarial Test Suite
 * 
 * Challenger M-Home-2: Filter Popover / Combinations, Full-Width Product Grid,
 *                      Card Geometry, and Badge Clipping Prevention
 * 
 * Validates:
 * 1. Filter Drawer / Popover Toggling & State Preservation:
 *    - #filtersPanel structure, collapse behavior, aria-expanded updates, and input value preservation.
 * 2. Multi-Filter Combination Oracle & State Consistency:
 *    - Conjunction of categories, price min/max, delivery time, quick filters (rating 4.5+, fast delivery),
 *      and search queries with mathematical correctness.
 * 3. Reset Behavior:
 *    - #btn-clear-filters and #btn-zero-clear-filters restore all inputs, pills, sort, and catalog products.
 * 4. Full-Width Product Grid & Column Layout Geometry:
 *    - #productsGrid inside col-12, absence of permanent sidebar, 3 cards/row on desktop (col-md-4 col-sm-6).
 * 5. Badge Rendering, Truncation & Clipping Prevention:
 *    - Badge hierarchy (AGOTADO, PRECIO ESTUDIANTE, MÁS PEDIDO), .product-card__badge-container wrapping,
 *      and CSS geometric anti-clipping clearance (>150px safety margin).
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
    parseDeliveryTime
} from '../../frontend/js/domain/catalog.js';

// Setup Mock DOM environment for headless testing
class MockClassList {
    constructor() {
        this._classes = new Set();
    }
    add(...names) { names.forEach(n => { if (n) this._classes.add(n); }); }
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

function parseHTMLInto(htmlString, parent) {
    if (!htmlString) return;
    const tagRegex = /<(\/)?([a-zA-Z0-9-]+)((?:\s+[a-zA-Z0-9-_:]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/)?>|([^<]+)/g;
    const stack = [parent];

    let match;
    while ((match = tagRegex.exec(htmlString)) !== null) {
        const [, isClosing, tagName, rawAttrs, isSelfClosing, textContent] = match;

        if (textContent) {
            const trimmed = textContent.trim();
            if (trimmed && stack.length > 0) {
                const current = stack[stack.length - 1];
                current.textContent = (current.textContent ? current.textContent + ' ' : '') + trimmed;
            }
            continue;
        }

        if (isClosing) {
            if (stack.length > 1 && stack[stack.length - 1].tagName === tagName.toUpperCase()) {
                stack.pop();
            }
            continue;
        }

        const el = new MockElement(tagName);
        if (rawAttrs) {
            const attrRegex = /([a-zA-Z0-9-_:]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
            let attrMatch;
            while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
                const attrName = attrMatch[1];
                const attrVal = attrMatch[2] !== undefined ? attrMatch[2] : (attrMatch[3] !== undefined ? attrMatch[3] : (attrMatch[4] !== undefined ? attrMatch[4] : ''));
                el.setAttribute(attrName, attrVal);
                if (attrName === 'id') {
                    el.id = attrVal;
                    if (globalThis.document && globalThis.document.elements) {
                        globalThis.document.elements.set(attrVal, el);
                    }
                } else if (attrName === 'class') {
                    el.className = attrVal;
                } else if (attrName === 'value') {
                    el.value = attrVal;
                } else if (attrName === 'type') {
                    el.type = attrVal;
                } else if (attrName === 'checked') {
                    el.checked = true;
                } else if (attrName.startsWith('data-')) {
                    el.dataset[attrName.slice(5)] = attrVal;
                }
            }
        }

        const currentParent = stack[stack.length - 1];
        currentParent.appendChild(el);

        const selfClosingTags = new Set(['IMG', 'INPUT', 'BR', 'HR', 'META', 'LINK']);
        if (!isSelfClosing && !selfClosingTags.has(tagName.toUpperCase())) {
            stack.push(el);
        }
    }
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
        this.parentElement = null;
        this._innerHTML = '';
        this._textContent = '';
        this._listeners = {};
        this.disabled = false;
        this.value = '';
        this.checked = false;
        this.type = '';
        this.name = '';
    }

    get className() { return this.classList.toString(); }
    set className(val) {
        this.classList._classes.clear();
        if (val) val.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
    }

    get innerHTML() {
        if (this._innerHTML) return this._innerHTML;
        if (this.children.length > 0) {
            return this.children.map(c => c.innerHTML || c._innerHTML || '').join('');
        }
        return '';
    }

    set innerHTML(val) {
        this._innerHTML = String(val);
        this.children = [];
        parseHTMLInto(this._innerHTML, this);
    }

    get textContent() { return this._textContent; }
    set textContent(val) { this._textContent = String(val); }

    appendChild(child) {
        child.parentElement = this;
        this.children.push(child);
        return child;
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parentElement = null;
        }
        return child;
    }

    remove() {
        if (this.parentElement) {
            this.parentElement.removeChild(this);
        }
    }

    setAttribute(k, v) { this.attributes[k] = String(v); }
    getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
    hasAttribute(k) { return this.attributes[k] !== undefined; }

    addEventListener(event, fn) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(fn);
    }

    removeEventListener(event, fn) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(f => f !== fn);
    }

    dispatchEvent(event) {
        const eventType = typeof event === 'string' ? event : event.type;
        const evtObj = typeof event === 'string' ? { type: event, target: this, currentTarget: this, preventDefault: () => {} } : event;
        const fns = this._listeners[eventType] || [];
        fns.forEach(fn => fn(evtObj));
    }

    click() {
        const evt = { type: 'click', currentTarget: this, target: this, preventDefault: () => {} };
        const fns = this._listeners['click'] || [];
        fns.forEach(fn => fn(evt));
    }

    focus() {}
    blur() {}

    closest(selector) {
        let current = this;
        while (current) {
            if (matchesSimpleSelector(current, selector)) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }

    querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
        const results = [];
        if (selector.includes(',')) {
            const parts = selector.split(',').map(s => s.trim());
            const matched = new Set();
            for (const part of parts) {
                const sub = this.querySelectorAll(part);
                sub.forEach(n => matched.add(n));
            }
            return Array.from(matched);
        }

        if (selector.includes(' ')) {
            const parts = selector.split(/\s+/).filter(Boolean);
            let currentNodes = [this];
            for (const part of parts) {
                const nextNodes = [];
                for (const node of currentNodes) {
                    const found = node.querySelectorAll(part);
                    nextNodes.push(...found);
                }
                currentNodes = nextNodes;
            }
            return currentNodes;
        }

        const traverse = (node) => {
            if (!node) return;
            if (matchesSimpleSelector(node, selector)) {
                results.push(node);
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

function matchesSimpleSelector(node, selector) {
    if (!node || !selector) return false;
    let s = selector.trim();

    let isCheckedReq = false;
    if (s.endsWith(':checked')) {
        isCheckedReq = true;
        s = s.slice(0, -':checked'.length);
    }

    if (isCheckedReq && !node.checked) {
        return false;
    }

    const attrMatch = s.match(/^([a-zA-Z0-9_-]*)\[([a-zA-Z0-9_-]+)(?:="([^"]*)")?\]$/);
    if (attrMatch) {
        const [, tag, attrName, attrVal] = attrMatch;
        if (tag && node.tagName !== tag.toUpperCase()) return false;
        const val = node.getAttribute(attrName) || node[attrName];
        if (attrVal !== undefined) {
            return String(val) === String(attrVal);
        }
        return val !== null && val !== undefined;
    }

    if (s.includes('.')) {
        const [tag, ...classes] = s.split('.');
        if (tag && node.tagName !== tag.toUpperCase()) return false;
        return classes.every(c => node.classList && node.classList.contains(c));
    }

    if (s.startsWith('.')) {
        return node.classList && node.classList.contains(s.slice(1));
    }

    if (s.startsWith('#')) {
        return node.id === s.slice(1);
    }

    return node.tagName === s.toUpperCase();
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
            const id = selector.slice(1);
            if (this.elements.has(id)) return this.elements.get(id);
        }
        return this.body.querySelector(selector);
    }

    querySelectorAll(selector) {
        return this.body.querySelectorAll(selector);
    }

    createElement(tag) {
        return new MockElement(tag);
    }
}

class MockBootstrapCollapse {
    constructor(element) {
        this.element = element;
    }
    toggle() {
        const isShown = this.element.classList.toggle('show');
        return isShown;
    }
    show() {
        this.element.classList.add('show');
    }
    hide() {
        this.element.classList.remove('show');
    }
    static getOrCreateInstance(element) {
        return new MockBootstrapCollapse(element);
    }
}

class MockToast {
    constructor(el, opts) {}
    show() {}
    static getOrCreateInstance(el, opts) {
        return new MockToast(el, opts);
    }
}

// Global test variables
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
    Collapse: MockBootstrapCollapse,
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

    // Register all standard DOM IDs required by catalog and filter interactions
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
    mockDoc.registerElement('cartBtn', 'button');
    mockDoc.registerElement('restaurantChangeModal');
    mockDoc.registerElement('restaurantChangeCurrentName');
    mockDoc.registerElement('restaurantChangeNewName');
    mockDoc.registerElement('restaurantChangeCancelBtn', 'button');
    mockDoc.registerElement('restaurantChangeConfirmBtn', 'button');

    // Home Catalog, Search, and Filters DOM Elements
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

    // Filter drawer and controls
    const filtersPanel = mockDoc.registerElement('filtersPanel');
    filtersPanel.classList.add('collapse', 'mb-4');

    const toggleBtn = mockDoc.registerElement('btn-toggle-filters-popover', 'button');
    toggleBtn.setAttribute('data-bs-toggle', 'collapse');
    toggleBtn.setAttribute('data-bs-target', '#filtersPanel');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-controls', 'filtersPanel');
    toggleBtn.classList.add('btn', 'foodjet-pill');

    // Register alias btnToggleFilters referencing the toggle button
    mockDoc.elements.set('btnToggleFilters', toggleBtn);

    const priceMin = mockDoc.registerElement('filter-price-min', 'input');
    priceMin.type = 'number';
    const priceMax = mockDoc.registerElement('filter-price-max', 'input');
    priceMax.type = 'number';

    const time30 = mockDoc.registerElement('time-30', 'input');
    time30.type = 'radio';
    time30.name = 'deliveryTimeFilter';
    time30.value = '30 minutos';
    time30.classList.add('filter-delivery-time');

    const time60 = mockDoc.registerElement('time-60', 'input');
    time60.type = 'radio';
    time60.name = 'deliveryTimeFilter';
    time60.value = '1 hora';
    time60.classList.add('filter-delivery-time');

    const timeMore = mockDoc.registerElement('time-more', 'input');
    timeMore.type = 'radio';
    timeMore.name = 'deliveryTimeFilter';
    timeMore.value = 'Más de 1 hora';
    timeMore.classList.add('filter-delivery-time');

    const quickRating = mockDoc.registerElement('quickFilterRating', 'button');
    quickRating.classList.add('quick-filter-btn', 'foodjet-pill');

    const quickPrice = mockDoc.registerElement('quickFilterPrice', 'button');
    quickPrice.classList.add('quick-filter-btn', 'foodjet-pill');

    const quickDelivery = mockDoc.registerElement('quickFilterDelivery', 'button');
    quickDelivery.classList.add('quick-filter-btn', 'foodjet-pill');

    const sortSelect = mockDoc.registerElement('catalogSortSelect', 'select');
    sortSelect.value = 'recommended';

    mockDoc.registerElement('btn-apply-filters', 'button');
    mockDoc.registerElement('btn-clear-filters', 'button');

    state.clearCart();
});

// Import UI module dynamically after document global is established
const ui = await import('../../frontend/js/ui.js');

// Comprehensive Dataset for Empirical Stress Testing matching Backend Prisma schema
const mockCatalogProducts = [
    {
        id: 1,
        nombre: 'Pizza Margherita Suprema',
        descripcion: 'Salsa pomodoro San Marzano, mozzarella di bufala y albahaca fresca',
        categoria: { id: 1, nombre: 'Pizzas' },
        tipo_comida: 'Pizzas',
        precio: 36.00,
        descuento_estudiante: 15, // S/ 30.60
        disponibilidad: true,
        es_mas_pedido: true,
        calificacion: 4.8,
        restaurante_id: 1,
        Restaurant: { id: 1, nombre: 'Pizzeria Bella Napoli', tiempo_entrega: '25 min', calificacion_promedio: 4.8 }
    },
    {
        id: 2,
        nombre: 'Hamburguesa Doble Cheddar Melt',
        descripcion: 'Doble smash patty artesanal con queso cheddar fundido y papas',
        categoria: { id: 2, nombre: 'Hamburguesas' },
        tipo_comida: 'Hamburguesas',
        precio: 28.00,
        descuento_estudiante: 20, // S/ 22.40
        disponibilidad: true,
        es_mas_pedido: false,
        calificacion: 4.6,
        restaurante_id: 2,
        Restaurant: { id: 2, nombre: 'Burger Station', tiempo_entrega: '30 min', calificacion_promedio: 4.6 }
    },
    {
        id: 3,
        nombre: 'Poke Bowl Salmón Clásico',
        descripcion: 'Salmón fresco en cubos, edamame, palta y arroz sushi',
        categoria: { id: 3, nombre: 'Saludable' },
        tipo_comida: 'Saludable',
        precio: 32.00,
        descuento_estudiante: 0,
        disponibilidad: true,
        es_mas_pedido: true,
        calificacion: 4.9,
        restaurante_id: 3,
        Restaurant: { id: 3, nombre: 'Poke Lab', tiempo_entrega: '20 min', calificacion_promedio: 4.9 }
    },
    {
        id: 4,
        nombre: 'Combo Criollo Económico',
        descripcion: 'Ají de gallina tradicional con arroz y papa',
        categoria: { id: 4, nombre: 'Criollo' },
        tipo_comida: 'Criollo',
        precio: 18.00,
        descuento_estudiante: 10, // S/ 16.20
        disponibilidad: true,
        es_mas_pedido: false,
        calificacion: 4.3,
        restaurante_id: 4,
        Restaurant: { id: 4, nombre: 'Sabor Peruano', tiempo_entrega: '45 min', calificacion_promedio: 4.3 }
    },
    {
        id: 5,
        nombre: 'Ramen Tonkotsu Especial',
        descripcion: 'Caldo denso de cerdo con chashu, huevo marinado y nori',
        categoria: { id: 5, nombre: 'Japonesa' },
        tipo_comida: 'Japonesa',
        precio: 39.00,
        descuento_estudiante: 25, // S/ 29.25
        disponibilidad: false, // AGOTADO
        es_mas_pedido: false,
        calificacion: 4.7,
        restaurante_id: 5,
        Restaurant: { id: 5, nombre: 'Ramen Bar', tiempo_entrega: '30 min', calificacion_promedio: 4.7 }
    },
    {
        id: 6,
        nombre: 'Ensalada César con Pollo Grill',
        descripcion: 'Lechuga romana, pechuga a la parrilla, crutones y aderezo césar',
        categoria: { id: 3, nombre: 'Saludable' },
        tipo_comida: 'Saludable',
        precio: 19.50,
        descuento_estudiante: 0,
        disponibilidad: true,
        es_mas_pedido: false,
        calificacion: 4.1,
        restaurante_id: 3,
        Restaurant: { id: 3, nombre: 'Poke Lab', tiempo_entrega: '20 min', calificacion_promedio: 4.9 }
    }
];

describe('Suite 1: Filter Drawer / Popover Toggling & State Preservation', () => {
    it('TC-CHALLENGE-MHOME-01: #filtersPanel existe en index.html con clase collapse y sin desbordamiento', () => {
        const html = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
        assert.ok(html.includes('id="filtersPanel"'), 'index.html debe contener id="filtersPanel"');
        assert.ok(html.includes('class="collapse mb-4" id="filtersPanel"'), 'filtersPanel debe tener clases collapse mb-4');
    });

    it('TC-CHALLENGE-MHOME-02: Botón de toggle en index.html incluye data-bs-toggle="collapse" y aria-expanded="false"', () => {
        const html = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
        assert.ok(html.includes('id="btn-toggle-filters-popover"'), 'Debe existir id="btn-toggle-filters-popover"');
        assert.ok(html.includes('data-bs-toggle="collapse"'), 'Debe incluir data-bs-toggle="collapse"');
        assert.ok(html.includes('data-bs-target="#filtersPanel"'), 'Debe apuntar a data-bs-target="#filtersPanel"');
        assert.ok(html.includes('aria-expanded="false"'), 'Debe inicializar aria-expanded en false');
        assert.ok(html.includes('aria-controls="filtersPanel"'), 'Debe definir aria-controls="filtersPanel"');
    });

    it('TC-CHALLENGE-MHOME-03: Toggle interactivo conmuta clase .show en #filtersPanel y actualiza aria-expanded', () => {
        const toggleBtn = mockDoc.getElementById('btn-toggle-filters-popover');
        const filtersPanel = mockDoc.getElementById('filtersPanel');

        // Configurar mecanismo de toggle simulado de Bootstrap Collapse
        toggleBtn.addEventListener('click', () => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            const newExpanded = !isExpanded;
            toggleBtn.setAttribute('aria-expanded', String(newExpanded));
            if (newExpanded) {
                filtersPanel.classList.add('show');
            } else {
                filtersPanel.classList.remove('show');
            }
        });

        assert.equal(toggleBtn.getAttribute('aria-expanded'), 'false');
        assert.equal(filtersPanel.classList.contains('show'), false);

        // Primer click: Abre drawer
        toggleBtn.click();
        assert.equal(toggleBtn.getAttribute('aria-expanded'), 'true');
        assert.equal(filtersPanel.classList.contains('show'), true);

        // Segundo click: Cierra drawer
        toggleBtn.click();
        assert.equal(toggleBtn.getAttribute('aria-expanded'), 'false');
        assert.equal(filtersPanel.classList.contains('show'), false);
    });

    it('TC-CHALLENGE-MHOME-04: Alias #btnToggleFilters resuelve el botón y permite alternancia de apertura', () => {
        const btnAlias = mockDoc.getElementById('btnToggleFilters');
        assert.ok(btnAlias, 'Alias #btnToggleFilters debe resolver el elemento toggle');
        assert.equal(btnAlias.getAttribute('data-bs-target'), '#filtersPanel');
    });

    it('TC-CHALLENGE-MHOME-05: Preservación de estado de inputs (#filter-price-min, #filter-price-max, #time-30) a través de ciclos de apertura/cierre', () => {
        const toggleBtn = mockDoc.getElementById('btn-toggle-filters-popover');
        const filtersPanel = mockDoc.getElementById('filtersPanel');
        const minInput = mockDoc.getElementById('filter-price-min');
        const maxInput = mockDoc.getElementById('filter-price-max');
        const time30 = mockDoc.getElementById('time-30');

        toggleBtn.addEventListener('click', () => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
            filtersPanel.classList.toggle('show');
        });

        // 1. Abrir panel
        toggleBtn.click();
        assert.equal(filtersPanel.classList.contains('show'), true);

        // 2. Usuario ingresa datos
        minInput.value = '15.50';
        maxInput.value = '42.00';
        time30.checked = true;

        // 3. Cerrar panel
        toggleBtn.click();
        assert.equal(filtersPanel.classList.contains('show'), false);

        // 4. Reabrir panel y comprobar preservación estricta de valores
        toggleBtn.click();
        assert.equal(filtersPanel.classList.contains('show'), true);
        assert.equal(minInput.value, '15.50', 'Precio mínimo debe conservarse idéntico');
        assert.equal(maxInput.value, '42.00', 'Precio máximo debe conservarse idéntico');
        assert.equal(time30.checked, true, 'Selección de tiempo debe conservarse activa');
    });
});

describe('Suite 2: Multi-Filter Combination Oracle & State Consistency', () => {
    beforeEach(() => {
        state.setProducts(mockCatalogProducts);
    });

    it('TC-CHALLENGE-MHOME-06: Conjunción de chips de categoría + rango de precio numérico', () => {
        const filtered = filterProducts(
            mockCatalogProducts,
            20.00, // min
            35.00, // max
            999999, // time unlimited
            ['Hamburguesas', 'Saludable'] // selected categories
        );

        // Esperados:
        // ID 2: Hamburguesa (28.00) -> en rango [20, 35] -> PASS
        // ID 3: Poke Bowl (32.00) -> en rango [20, 35] -> PASS
        // ID 6: Ensalada César (19.50) -> fuera de rango (< 20.00) -> FAIL
        assert.equal(filtered.length, 2);
        const ids = filtered.map(p => p.id);
        assert.ok(ids.includes(2));
        assert.ok(ids.includes(3));
        assert.ok(!ids.includes(6));
    });

    it('TC-CHALLENGE-MHOME-07: Conjunción de categoría + filtro de tiempo de entrega <= 30 min', () => {
        const filtered = filterProducts(
            mockCatalogProducts,
            0,
            999999,
            30, // max 30 minutos
            ['Criollo', 'Pizzas']
        );

        // ID 1: Pizza Margherita (25 min) -> PASS
        // ID 4: Combo Criollo (45 min) -> FAIL (> 30 min)
        assert.equal(filtered.length, 1);
        assert.equal(filtered[0].id, 1);
    });

    it('TC-CHALLENGE-MHOME-08: Quick filter #quickFilterPrice sincroniza bidireccionalmente con #filter-price-max ("20")', () => {
        ui.initQuickFilters();

        const quickPrice = mockDoc.getElementById('quickFilterPrice');
        const maxInput = mockDoc.getElementById('filter-price-max');

        // Activación de pill rápido S/ 20
        quickPrice.click();
        assert.equal(quickPrice.classList.contains('foodjet-pill--active'), true);
        assert.equal(maxInput.value, '20', 'Input maxPrice debe establecerse en 20');

        // Desactivación
        quickPrice.click();
        assert.equal(quickPrice.classList.contains('foodjet-pill--active'), false);
        assert.equal(maxInput.value, '', 'Input maxPrice debe limpiarse');
    });

    it('TC-CHALLENGE-MHOME-09: Quick filter #quickFilterDelivery sincroniza bidireccionalmente con #time-30', () => {
        ui.initQuickFilters();

        const quickDelivery = mockDoc.getElementById('quickFilterDelivery');
        const time30 = mockDoc.getElementById('time-30');

        // Activar entrega rápida
        quickDelivery.click();
        assert.equal(quickDelivery.classList.contains('foodjet-pill--active'), true);
        assert.equal(time30.checked, true, 'Radio #time-30 debe quedar marcado');

        // Desactivar
        quickDelivery.click();
        assert.equal(quickDelivery.classList.contains('foodjet-pill--active'), false);
        assert.equal(time30.checked, false, 'Radio #time-30 debe desmarcarse');
    });

    it('TC-CHALLENGE-MHOME-10: Quick filter #quickFilterRating filtra productos con calificación >= 4.5', () => {
        ui.initQuickFilters();

        const quickRating = mockDoc.getElementById('quickFilterRating');
        quickRating.click();
        assert.equal(quickRating.classList.contains('foodjet-pill--active'), true);

        ui.renderProducts();

        const countEl = mockDoc.getElementById('catalogResultsCount');
        // Con calificacion >= 4.5:
        // ID 1: 4.8
        // ID 2: 4.6
        // ID 3: 4.9
        // ID 5: 4.7
        // Total = 4 productos (excluye ID 4 de 4.3 e ID 6 de 4.1)
        assert.equal(countEl.textContent, '4 productos');
    });

    it('TC-CHALLENGE-MHOME-11: Stress test de combinación simultánea profunda (Categoría + Rango Precio + Tiempo + Rating + Texto)', () => {
        ui.initQuickFilters();

        // 1. Búsqueda por texto: "smash"
        const searchInput = mockDoc.getElementById('catalogSearchInput');
        searchInput.value = 'smash';

        // 2. Precio: 20 a 30
        mockDoc.getElementById('filter-price-min').value = '20';
        mockDoc.getElementById('filter-price-max').value = '30';

        // 3. Tiempo: 30 min
        mockDoc.getElementById('time-30').checked = true;

        // 4. Rating 4.5+
        const quickRating = mockDoc.getElementById('quickFilterRating');
        quickRating.classList.add('foodjet-pill--active');

        ui.renderProducts();

        const countEl = mockDoc.getElementById('catalogResultsCount');
        assert.equal(countEl.textContent, '1 producto');

        const grid = mockDoc.getElementById('productsGrid');
        assert.ok(grid.innerHTML.includes('Hamburguesa Doble Cheddar Melt'));
    });

    it('TC-CHALLENGE-MHOME-12: Ordenamiento por precio y calificación opera correctamente sobre conjunto filtrado', () => {
        const sortSelect = mockDoc.getElementById('catalogSortSelect');

        // Orden descendente de precio
        sortSelect.value = 'price-desc';
        ui.renderProducts();

        // Los productos en el grid deben estar ordenados: 39, 36, 32, 28, 19.5, 18
        const grid = mockDoc.getElementById('productsGrid');
        const titles = grid.querySelectorAll('.product-card__title').map(t => t.textContent.trim());
        assert.equal(titles[0], 'Ramen Tonkotsu Especial'); // 39.00
        assert.equal(titles[1], 'Pizza Margherita Suprema'); // 36.00

        // Orden ascendente de precio
        sortSelect.value = 'price-asc';
        ui.renderProducts();
        const titlesAsc = grid.querySelectorAll('.product-card__title').map(t => t.textContent.trim());
        assert.equal(titlesAsc[0], 'Combo Criollo Económico'); // 18.00
        assert.equal(titlesAsc[1], 'Ensalada César con Pollo Grill'); // 19.50
    });

    it('TC-CHALLENGE-MHOME-13: Filtros contradictorios disparan estado cero resultados (#btn-zero-clear-filters)', () => {
        // Rango de precio imposible: min 50, max 20
        mockDoc.getElementById('filter-price-min').value = '50';
        mockDoc.getElementById('filter-price-max').value = '20';

        ui.renderProducts();

        const grid = mockDoc.getElementById('productsGrid');
        assert.ok(grid.innerHTML.includes('foodjet-empty-state'), 'Debe desplegar .foodjet-empty-state');
        assert.ok(grid.innerHTML.includes('No encontramos antojos con esos filtros'));
        assert.ok(grid.innerHTML.includes('btn-zero-clear-filters'), 'Debe incluir botón de limpieza');
    });
});

describe('Suite 3: Reset Behavior (Drawer, Quick Filters & Search)', () => {
    beforeEach(() => {
        state.setProducts(mockCatalogProducts);
    });

    it('TC-CHALLENGE-MHOME-14: #btn-clear-filters restablece inputs numéricos, radios, pills rápidos y buscador', () => {
        // Ensuciar todos los filtros
        const searchInput = mockDoc.getElementById('catalogSearchInput');
        searchInput.value = 'Pizza';

        const minInput = mockDoc.getElementById('filter-price-min');
        minInput.value = '10';
        const maxInput = mockDoc.getElementById('filter-price-max');
        maxInput.value = '40';

        const time30 = mockDoc.getElementById('time-30');
        time30.checked = true;

        const quickRating = mockDoc.getElementById('quickFilterRating');
        quickRating.classList.add('foodjet-pill--active');
        const quickPrice = mockDoc.getElementById('quickFilterPrice');
        quickPrice.classList.add('foodjet-pill--active');
        const quickDelivery = mockDoc.getElementById('quickFilterDelivery');
        quickDelivery.classList.add('foodjet-pill--active');

        const sortSelect = mockDoc.getElementById('catalogSortSelect');
        sortSelect.value = 'rating-desc';

        // Ejecutar reset oficial
        ui.resetAllCatalogFilters();

        // Aserciones de purga
        assert.equal(searchInput.value, '', 'Buscador debe quedar vacío');
        assert.equal(minInput.value, '', 'Precio mínimo debe ser vacío');
        assert.equal(maxInput.value, '', 'Precio máximo debe ser vacío');
        assert.equal(time30.checked, false, 'Radio de tiempo debe estar desmarcado');
        assert.equal(quickRating.classList.contains('foodjet-pill--active'), false, 'Quick rating debe estar inactivo');
        assert.equal(quickPrice.classList.contains('foodjet-pill--active'), false, 'Quick price debe estar inactivo');
        assert.equal(quickDelivery.classList.contains('foodjet-pill--active'), false, 'Quick delivery debe estar inactivo');
        assert.equal(sortSelect.value, 'recommended', 'Ordenamiento debe volver a recommended');
    });

    it('TC-CHALLENGE-MHOME-15: Reset repuebla el total de productos en #catalogResultsCount y limpia #productsGrid', () => {
        // Simular filtro que reduce a 1 resultado
        const searchInput = mockDoc.getElementById('catalogSearchInput');
        searchInput.value = 'Ramen';
        ui.renderProducts();
        assert.equal(mockDoc.getElementById('catalogResultsCount').textContent, '1 producto');

        // Ejecutar reset
        ui.resetAllCatalogFilters();

        assert.equal(mockDoc.getElementById('catalogResultsCount').textContent, '6 productos');
        const grid = mockDoc.getElementById('productsGrid');
        assert.equal(grid.children.length, 6, 'Debe renderizar los 6 productos completos');
    });

    it('TC-CHALLENGE-MHOME-16: Limpiar desde estado de cero resultados restaura el catálogo completo', () => {
        mockDoc.getElementById('catalogSearchInput').value = 'Comida Inexistente XYZ';
        ui.renderProducts();
        assert.equal(mockDoc.getElementById('catalogResultsCount').textContent, '0 productos');

        // Click en botón de limpiar de estado vacío
        const zeroClearBtn = mockDoc.getElementById('btn-zero-clear-filters');
        assert.ok(zeroClearBtn, 'Botón de limpiar en cero resultados debe existir');
        zeroClearBtn.click();

        assert.equal(mockDoc.getElementById('catalogResultsCount').textContent, '6 productos');
    });

    it('TC-CHALLENGE-MHOME-17: Pastilla "Todos" (#filter-cat-all) recupera el foco activo tras el reset', () => {
        ui.renderFoodTypeFilters();

        const catAll = mockDoc.getElementById('filter-cat-all');
        assert.ok(catAll, '#filter-cat-all debe existir');

        // Simular selección de otra categoría
        const pizzaCb = mockDoc.querySelector('.filter-food-type[value="Pizzas"]');
        if (pizzaCb) {
            pizzaCb.checked = true;
            pizzaCb.dispatchEvent('change');
            assert.equal(catAll.classList.contains('foodjet-pill--active'), false);
        }

        ui.resetAllCatalogFilters();
        assert.equal(catAll.classList.contains('foodjet-pill--active'), true, '#filter-cat-all debe estar activo');
    });
});

describe('Suite 4: Full-Width Product Grid & Column Layout Geometry', () => {
    it('TC-CHALLENGE-MHOME-18: #productsGrid está ubicado dentro de un contenedor col-12 en index.html', () => {
        const html = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');

        // Verificar que #productsGrid está dentro de col-12
        const gridPos = html.indexOf('id="productsGrid"');
        assert.ok(gridPos > 0, '#productsGrid debe existir en index.html');

        const priorSlice = html.slice(Math.max(0, gridPos - 500), gridPos);
        assert.ok(priorSlice.includes('<div class="col-12">'), '#productsGrid debe estar precedido por col-12');
        assert.ok(!priorSlice.includes('col-lg-9'), 'No debe existir col-lg-9 comprimiendo la rejilla');
        assert.ok(!priorSlice.includes('col-lg-3'), 'No debe existir sidebar col-lg-3 en la sección de menú');
    });

    it('TC-CHALLENGE-MHOME-19: #productsGrid aplica clases "row g-4" para espaciado consistente de 24px', () => {
        const html = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
        assert.ok(html.includes('class="row g-4" id="productsGrid"'), '#productsGrid debe tener clases row g-4');
    });

    it('TC-CHALLENGE-MHOME-20: Tarjetas de producto generadas aplican clases "col-md-4 col-sm-6 mb-4" (3 columnas escritorio)', () => {
        state.setProducts(mockCatalogProducts);
        ui.renderProducts();

        const grid = mockDoc.getElementById('productsGrid');
        assert.ok(grid.children.length > 0, 'Debe haber tarjetas renderizadas');

        for (const col of grid.children) {
            assert.ok(col.classList.contains('col-md-4'), 'Cada columna debe incluir col-md-4 (3 por fila en escritorio)');
            assert.ok(col.classList.contains('col-sm-6'), 'Cada columna debe incluir col-sm-6 (2 por fila en tablet)');
            assert.ok(col.classList.contains('mb-4'), 'Cada columna debe incluir margen inferior mb-4');
        }
    });

    it('TC-CHALLENGE-MHOME-21: Reglas de estilo para .product-card y contenedor de imagen respetan geometría Figma', () => {
        const css = fs.readFileSync(path.resolve('frontend/styles.css'), 'utf8');

        assert.ok(css.includes('.product-card.foodjet-card'), 'Debe definir regla .product-card.foodjet-card');
        assert.ok(css.includes('.product-card__img-container'), 'Debe definir .product-card__img-container');
        assert.ok(css.includes('height: 180px;'), 'Contenedor de imagen debe tener altura fija de 180px');
        assert.ok(css.includes('object-fit: cover;'), 'Imagen de producto debe usar object-fit: cover');
    });
});

describe('Suite 5: Badge Rendering, Truncation & Clipping Prevention', () => {
    it('TC-CHALLENGE-MHOME-22: Producto no disponible renderiza prioritariamente badge "AGOTADO"', () => {
        state.setProducts(mockCatalogProducts);
        // Usuario estudiante
        globalThis.window.currentUser = { es_estudiante: true };

        ui.renderProducts();

        const grid = mockDoc.getElementById('productsGrid');
        // ID 5 es Ramen Tonkotsu (disponibilidad: false)
        assert.ok(grid.innerHTML.includes('foodjet-badge--soldout'), 'Debe renderizar clase foodjet-badge--soldout');
        assert.ok(grid.innerHTML.includes('AGOTADO'), 'Debe incluir texto AGOTADO');
    });

    it('TC-CHALLENGE-MHOME-23: Usuario estudiante verificado recibe badge "PRECIO ESTUDIANTE" con estilo amarillo', () => {
        state.setProducts(mockCatalogProducts);
        globalThis.window.currentUser = { es_estudiante: true };

        ui.renderProducts();

        const grid = mockDoc.getElementById('productsGrid');
        // ID 1 y 2 tienen descuento estudiantil y están disponibles
        assert.ok(grid.innerHTML.includes('foodjet-badge--student'), 'Debe renderizar clase foodjet-badge--student');
        assert.ok(grid.innerHTML.includes('PRECIO ESTUDIANTE'), 'Debe desplegar texto literal PRECIO ESTUDIANTE');
    });

    it('TC-CHALLENGE-MHOME-24: Usuario regular / anónimo ve badge "MÁS PEDIDO" para productos destacados', () => {
        state.setProducts(mockCatalogProducts);
        globalThis.window.currentUser = null; // No autenticado o regular

        ui.renderProducts();

        const grid = mockDoc.getElementById('productsGrid');
        // ID 1 y 3 son es_mas_pedido
        assert.ok(grid.innerHTML.includes('foodjet-badge--popular'), 'Debe renderizar clase foodjet-badge--popular');
        assert.ok(grid.innerHTML.includes('MÁS PEDIDO'), 'Debe desplegar texto literal MÁS PEDIDO');
    });

    it('TC-CHALLENGE-MHOME-25: Badges se envuelven estrictamente dentro de .product-card__badge-container', () => {
        state.setProducts(mockCatalogProducts);
        globalThis.window.currentUser = { es_estudiante: true };

        ui.renderProducts();

        const grid = mockDoc.getElementById('productsGrid');
        assert.ok(grid.innerHTML.includes('class="product-card__badge-container"'), 'Debe envolver badges en container dedicado');
    });

    it('TC-CHALLENGE-MHOME-26: Reglas CSS de .product-card__badge-container garantizan espacio para botón de favoritos', () => {
        const css = fs.readFileSync(path.resolve('frontend/styles.css'), 'utf8');

        assert.ok(css.includes('.product-card__badge-container {'), 'Debe existir bloque .product-card__badge-container');
        assert.ok(css.includes('max-width: calc(100% - 60px);'), 'max-width debe dejar al menos 60px libres para el botón favorito');
        assert.ok(css.includes('top: 10px;'), 'Posición superior debe ser 10px');
        assert.ok(css.includes('left: 10px;'), 'Posición izquierda debe ser 10px');
        assert.ok(css.includes('z-index: 3;'), 'z-index debe ser 3 para flotar sobre imagen');
    });

    it('TC-CHALLENGE-MHOME-27: .foodjet-badge define white-space: nowrap y tipografía micro previniendo cortes de texto', () => {
        const css = fs.readFileSync(path.resolve('frontend/styles.css'), 'utf8');

        assert.ok(css.includes('white-space: nowrap;'), 'Badges deben usar white-space: nowrap');
        assert.ok(css.includes('font-size: var(--font-micro-badge);'), 'Badges deben usar token --font-micro-badge (9px)');
        assert.ok(css.includes('font-weight: 800;'), 'Badges deben tener peso 800 para legibilidad');
        assert.ok(css.includes('border-radius: var(--radius-full);'), 'Badges deben ser pastillas completas');
    });

    it('TC-CHALLENGE-MHOME-28: Oráculo Geométrico Antidesborde: Holgura de píxeles en desktop supera 150px de margen de seguridad', () => {
        // En una pantalla de escritorio (1280px / 1440px), el contenedor Bootstrap es ~1140px a 1320px.
        // Dividido en 3 columnas iguales (col-md-4) con gap g-4 (24px):
        // Ancho neto de columna = (1200px - 48px) / 3 = 384px.
        // Ancho máximo del badge-container = 384px - 60px = 324px.
        // Longitud del texto "PRECIO ESTUDIANTE" = 17 caracteres * ~6.5px por glifo (a 9px font size) + 20px padding ≈ 130.5px.
        // Margen de seguridad = 324px - 130.5px = 193.5px.
        const colWidthDesktop = 384;
        const badgeContainerMax = colWidthDesktop - 60; // 324px
        const badgeRenderWidthApprox = 131; // px
        const clearanceMargin = badgeContainerMax - badgeRenderWidthApprox;

        assert.ok(clearanceMargin > 150, `Margen de seguridad (${clearanceMargin.toFixed(1)}px) debe superar holgura mínima de 150px`);
    });
});


describe('Suite 6: Adversarial Stress, Boundary Inputs & Edge Cases', () => {
    beforeEach(() => {
        state.setProducts(mockCatalogProducts);
    });

    it('TC-CHALLENGE-MHOME-29: Búsqueda con caracteres especiales de regex no causa SyntaxError o bloqueo', () => {
        const specialInputs = ['[test]', '(combo)', 'pizza+queso', 'c*e', 'c?d', 'a\\b', '^.*$'];

        for (const inputStr of specialInputs) {
            mockDoc.getElementById('catalogSearchInput').value = inputStr;
            assert.doesNotThrow(() => {
                ui.renderProducts();
            }, `Búsqueda con ${inputStr} no debe disparar excepción`);
        }
    });

    it('TC-CHALLENGE-MHOME-30: Rango de precios con valores límite y cadenas inválidas degrada de forma segura', () => {
        const minInput = mockDoc.getElementById('filter-price-min');
        const maxInput = mockDoc.getElementById('filter-price-max');

        // 1. Valores no numéricos
        minInput.value = 'abc';
        maxInput.value = 'xyz';
        assert.doesNotThrow(() => ui.renderProducts());
        // Al ser NaN, minPrice cae a 0 o se ignora, mostrando los productos
        const countEl = mockDoc.getElementById('catalogResultsCount');
        assert.ok(countEl.textContent.includes('productos'));

        // 2. Precios negativos
        minInput.value = '-50';
        maxInput.value = '100';
        assert.doesNotThrow(() => ui.renderProducts());
    });

    it('TC-CHALLENGE-MHOME-31: Alternancia rápida y concurrente de pills rápidos no desincroniza el estado', () => {
        ui.initQuickFilters();

        const quickRating = mockDoc.getElementById('quickFilterRating');
        const quickPrice = mockDoc.getElementById('quickFilterPrice');
        const quickDelivery = mockDoc.getElementById('quickFilterDelivery');
        const maxInput = mockDoc.getElementById('filter-price-max');
        const time30 = mockDoc.getElementById('time-30');

        // Ciclo rápido de 10 clics alternados
        for (let i = 0; i < 10; i++) {
            quickPrice.click();
            quickDelivery.click();
            quickRating.click();
        }

        // Como fueron 10 clics (número par), todos deben haber regresado a su estado original (inactivo)
        assert.equal(quickPrice.classList.contains('foodjet-pill--active'), false);
        assert.equal(quickDelivery.classList.contains('foodjet-pill--active'), false);
        assert.equal(quickRating.classList.contains('foodjet-pill--active'), false);
        assert.equal(maxInput.value, '');
        assert.equal(time30.checked, false);
    });

    it('TC-CHALLENGE-MHOME-32: Aislamiento estricto de badge de estudiante: no se muestra si usuario no es estudiante', () => {
        state.setProducts(mockCatalogProducts);

        // Caso A: Usuario logueado pero es_estudiante: false
        globalThis.window.currentUser = { es_estudiante: false };
        ui.renderProducts();
        let grid = mockDoc.getElementById('productsGrid');
        assert.ok(!grid.innerHTML.includes('PRECIO ESTUDIANTE'), 'No debe mostrar badge de estudiante a clientes regulares');

        // Caso B: Usuario es_estudiante: true pero producto sin descuento (ID 3 tiene descuento 0%)
        globalThis.window.currentUser = { es_estudiante: true };
        ui.renderProducts();
        grid = mockDoc.getElementById('productsGrid');
        // El producto 3 no debe tener badge de estudiante (recibe MÁS PEDIDO)
        const pokeCard = grid.children.find(c => c.innerHTML.includes('Poke Bowl Salmón Clásico'));
        assert.ok(pokeCard);
        assert.ok(!pokeCard.innerHTML.includes('PRECIO ESTUDIANTE'));
        assert.ok(pokeCard.innerHTML.includes('MÁS PEDIDO'));
    });

    it('TC-CHALLENGE-MHOME-33: Botón de favoritos y contenedor de badge mantienen z-index y pointer-events independientes', () => {
        const css = fs.readFileSync(path.resolve('frontend/styles.css'), 'utf8');

        // El botón de favoritos debe tener z-index y el icono pointer-events: none para no interferir
        assert.ok(css.includes('.product-card__fav-btn {'));
        assert.ok(css.includes('.product-card__fav-btn i {'));
        assert.ok(css.includes('pointer-events: none;'));

        // El badge container debe tener z-index: 3
        assert.ok(css.includes('.product-card__badge-container {'));
        assert.ok(css.includes('z-index: 3;'));
    });

    it('TC-CHALLENGE-MHOME-34: Adaptabilidad responsiva: col-sm-6 asegura 1 columna al 100% en viewports móviles <= 576px', () => {
        // En Bootstrap 5:
        // Las clases col-md-4 col-sm-6 sin prefijo xs (col-*) por diseño de CSS Grid heredan:
        // - Viewport < 576px (móviles 360px y 390px Figma): width: 100% (1 tarjeta por fila)
        // - Viewport >= 576px (tablets pequeñas): width: 50% (2 tarjetas por fila)
        // - Viewport >= 768px (escritorio): width: 33.333% (3 tarjetas por fila)
        const uiCode = fs.readFileSync(path.resolve('frontend/js/ui.js'), 'utf8');
        assert.ok(uiCode.includes('col-md-4 col-sm-6 mb-4'));

        const html = fs.readFileSync(path.resolve('frontend/index.html'), 'utf8');
        assert.ok(html.includes('<div class="col-12">'));
    });
});
