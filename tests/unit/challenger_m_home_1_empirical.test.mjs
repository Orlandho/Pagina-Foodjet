/**
 * FoodJet — Milestone M-Home Empirical Adversarial Verification Suite
 * 
 * Challenger: teamwork_challenger (challenger_m_home_1)
 * Target: Reconstrucción de Home y cabecera según diseño Figma (Milestone M-Home)
 * 
 * Verification Areas:
 * 1. DOM Contract Integrity:
 *    - All 165 baseline DOM IDs from commit 515e3ad strictly preserved
 *    - Zero duplicate DOM IDs in frontend/index.html
 *    - Valid HTML5 identifier syntax across all DOM IDs
 *    - Presence of newly added M-Home / M2 Milestone IDs
 * 2. Address Selector Modal & Geolocation Safeguard:
 *    - #headerAddressBar opens #addressSelectorModal
 *    - CRITICAL PRIVACY SAFEGUARD: Opening modal does NOT invoke navigator.geolocation
 *    - populateAddressSelectorModal handles unauthenticated guest state gracefully
 *    - populateAddressSelectorModal populates saved address cards with details and datasets
 *    - Idempotency & de-duplication: no duplicate address cards on repeated calls
 *    - Selecting a saved address card synchronizes #headerAddressText, #customerAddress, and coordinates
 * 3. Explicit GPS Action & Error Recovery:
 *    - Clicking #btnHeaderLocateGps explicitly triggers navigator.geolocation
 *    - Loading spinner displayed during geolocation query
 *    - Successful GPS resolution formats address text, syncs checkout, and sets coordinates
 *    - Geolocation denial/error handled gracefully with warning toast and button recovery
 *    - Missing navigator.geolocation handled gracefully without crash
 *    - Manual address input (#headerCustomAddressInput, #btnSaveHeaderAddress) with validation
 * 4. Centralized Navbar Search Bar & Reactive Filtering:
 *    - Structural placement: #catalogSearchInput and #catalogSearchClear inside <nav id="navbar">
 *    - Central layout classes on .foodjet-header-search
 *    - Input event triggers reactive filtering and displays clear button
 *    - Case-insensitive search across name, description, and restaurant
 *    - Clear button resets input, re-renders full catalog, and restores focus
 * 5. Textual Cart Button Contract & Reactive Counter:
 *    - Static HTML structure: #cartBtn has label "Mi carrito", separator, and #cartCount
 *    - Empty cart: #cartCount and separator hidden (display: none)
 *    - Non-empty cart: #cartCount and separator visible (inline-flex / inline)
 *    - Multi-item accumulation and full drain lifecycle
 *    - Label "Mi carrito" remains intact throughout all cart state transitions
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Helpers & Mock DOM Infrastructure
// ---------------------------------------------------------------------------

function toCamelCase(str) {
    return str.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
}

function applyAttrs(el, attrStr) {
    if (!attrStr) return;
    const attrRegex = /([a-zA-Z0-9_-]+)(?:=["']([^"']*)["'])?/g;
    let match;
    while ((match = attrRegex.exec(attrStr)) !== null) {
        const name = match[1];
        const val = match[2] !== undefined ? match[2] : '';
        if (name === 'class') {
            val.split(/\s+/).filter(Boolean).forEach(c => el.classList.add(c));
        } else if (name === 'id') {
            el.id = val;
        } else if (name.startsWith('data-')) {
            const key = toCamelCase(name.slice(5));
            el.dataset[key] = val;
        } else {
            el.setAttribute(name, val);
        }
    }
}

class MockClassList {
    constructor() { this._classes = new Set(); }
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
        this.focused = false;
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
        const fragment = parseHtmlFragment(val);
        fragment.children.forEach(c => this.appendChild(c));
    }

    get textContent() {
        if (this._textContent) return this._textContent;
        return this.children.map(c => c.textContent).join(' ');
    }
    set textContent(val) {
        this._textContent = String(val);
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    remove() {
        // no-op in headless mock
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

    focus() {
        this.focused = true;
    }

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
            } else {
                if (node.tagName === selector.toUpperCase()) results.push(node);
            }
            if (node.children) node.children.forEach(traverse);
        };
        this.children.forEach(traverse);
        return results;
    }
}

function parseHtmlFragment(html) {
    const root = new MockElement('div');
    if (!html || typeof html !== 'string') return root;

    const tagRegex = /<([a-zA-Z0-9]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z0-9]+)([^>]*)\/?>|([^<]+)/g;
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
        if (match[1]) {
            const el = new MockElement(match[1]);
            el._innerHTML = match[3];
            applyAttrs(el, match[2]);
            const sub = parseHtmlFragment(match[3]);
            sub.children.forEach(c => el.appendChild(c));
            root.appendChild(el);
        } else if (match[4]) {
            const el = new MockElement(match[4]);
            applyAttrs(el, match[5]);
            root.appendChild(el);
        } else if (match[6] && match[6].trim()) {
            root._textContent += match[6].trim();
        }
    }
    return root;
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
            for (const el of this.body.children) {
                if (el.classList.contains('toast-container')) return el;
            }
            return null;
        }
        for (const el of this.elements.values()) {
            if (selector.startsWith('.') && el.classList.contains(selector.slice(1))) {
                return el;
            }
        }
        return this.body.querySelector(selector);
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
        return new MockElement(tag);
    }

    addEventListener(event, fn) {
        if (!this._listeners) this._listeners = {};
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(fn);
    }

    removeEventListener(event, fn) {
        if (!this._listeners || !this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(f => f !== fn);
    }

    dispatchEvent(event) {
        if (!this._listeners) return;
        const fns = this._listeners[event.type || event] || [];
        fns.forEach(fn => fn(event));
    }
}

class MockToast {
    constructor(el, opts) {
        this.el = el;
        this.opts = opts;
    }
    show() {}
    static getOrCreateInstance(el, opts) {
        return new MockToast(el, opts);
    }
}

// Global modal instance registry
const modalInstances = new Map();
function getOrCreateMockModal(el) {
    if (!modalInstances.has(el)) {
        modalInstances.set(el, {
            el,
            visible: false,
            show() {
                this.visible = true;
                if (this.el && this.el.style) this.el.style.display = 'block';
            },
            hide() {
                this.visible = false;
                if (this.el && this.el.style) this.el.style.display = 'none';
            }
        });
    }
    return modalInstances.get(el);
}

const mockBootstrap = {
    Modal: {
        getOrCreateInstance: (el) => getOrCreateMockModal(el),
        getInstance: (el) => modalInstances.get(el) || null
    },
    Offcanvas: {
        getOrCreateInstance: (el) => getOrCreateMockModal(el),
        getInstance: (el) => modalInstances.get(el) || null
    },
    Toast: MockToast
};

// ---------------------------------------------------------------------------
// Environment & Global State Configuration
// ---------------------------------------------------------------------------

let mockDoc;
let geoCallCount = 0;
let geoBehavior = 'success'; // 'success' | 'denied' | 'none'
let mockPosition = { coords: { latitude: -12.0464, longitude: -77.0428 } };
let mockAddressesPayload = [];

// Setup Globals prior to loading modules
mockDoc = new MockDocument();
globalThis.document = mockDoc;
modalInstances.clear();

globalThis.window = {
    currentUser: null,
    authToken: null,
    bootstrap: mockBootstrap,
    FOODJET_API_URL: 'http://localhost:3000/api',
    headerDeliveryCoordinates: null
};
globalThis.bootstrap = mockBootstrap;

// Setup Geolocation Mock with Tracking Counter
Object.defineProperty(globalThis, 'navigator', {
    value: {
        geolocation: {
            getCurrentPosition: (successCb, errorCb, options) => {
                geoCallCount++;
                if (geoBehavior === 'success') {
                    successCb(mockPosition);
                } else if (geoBehavior === 'denied') {
                    errorCb(new Error('User denied Geolocation'));
                }
            }
        }
    },
    writable: true,
    configurable: true
});

// Setup Mock Fetch for API Endpoints
globalThis.fetch = async (url, opts) => {
    if (url.includes('/addresses')) {
        return {
            ok: true,
            status: 200,
            json: async () => mockAddressesPayload
        };
    }
    return {
        ok: true,
        status: 200,
        json: async () => ([])
    };
};

// Dynamically import tested modules
const state = await import('../../frontend/js/state.js');
const ui = await import('../../frontend/js/ui.js');

// ---------------------------------------------------------------------------
// TEST SUITES
// ---------------------------------------------------------------------------

describe('Milestone M-Home Empirical Verification — Challenger M-Home-1', () => {

    const currentHtmlPath = path.resolve('frontend/index.html');
    const currentHtml = fs.readFileSync(currentHtmlPath, 'utf8');

    // =======================================================================
    // SUITE 1: DOM Contract Integrity & Baseline Preservation
    // =======================================================================
    describe('Suite 1: DOM Contract Integrity & Preservation (165 Baseline IDs & Zero Duplicates)', () => {

        it('TC-HOME-DOM-01: Baseline commit 515e3ad exists and contains exactly 165 unique DOM IDs', () => {
            let baselineHtml;
            try {
                baselineHtml = execSync('git show 515e3ad:frontend/index.html', { encoding: 'utf8' });
            } catch (err) {
                assert.fail(`No se pudo leer el commit baseline 515e3ad: ${err.message}`);
            }

            const idRegex = /id=["']([^"']+)["']/g;
            const baselineIds = new Set();
            let m;
            while ((m = idRegex.exec(baselineHtml)) !== null) {
                baselineIds.add(m[1]);
            }

            assert.equal(baselineIds.size, 165, 'Baseline commit 515e3ad debe contener exactamente 165 IDs únicos');
        });

        it('TC-HOME-DOM-02: Todos los 165 IDs del baseline están preservados en el frontend/index.html actual', () => {
            const baselineHtml = execSync('git show 515e3ad:frontend/index.html', { encoding: 'utf8' });
            const idRegex = /id=["']([^"']+)["']/g;
            const baselineIds = new Set();
            let m;
            while ((m = idRegex.exec(baselineHtml)) !== null) {
                baselineIds.add(m[1]);
            }

            const currentMatches = [...currentHtml.matchAll(/id=["']([^"']+)["']/g)].map(x => x[1]);
            const currentIds = new Set(currentMatches);

            const missingIds = [...baselineIds].filter(id => !currentIds.has(id));
            assert.deepEqual(missingIds, [], `Se detectaron IDs faltantes del baseline: ${missingIds.join(', ')}`);
        });

        it('TC-HOME-DOM-03: Cero IDs duplicados en todo frontend/index.html (Unicidad estricta)', () => {
            const currentMatches = [...currentHtml.matchAll(/id=["']([^"']+)["']/g)].map(x => x[1]);
            const counts = {};
            for (const id of currentMatches) {
                counts[id] = (counts[id] || 0) + 1;
            }

            const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);
            assert.deepEqual(duplicates, [], `Existen IDs duplicados en frontend/index.html: ${JSON.stringify(duplicates)}`);
        });

        it('TC-HOME-DOM-04: Todos los IDs de DOM cumplen con la sintaxis válida de identificadores HTML5', () => {
            const currentMatches = [...currentHtml.matchAll(/id=["']([^"']+)["']/g)].map(x => x[1]);
            const invalidIdRegex = /[\s<>"'/=]/;
            const invalidIds = currentMatches.filter(id => invalidIdRegex.test(id) || id.length === 0);

            assert.deepEqual(invalidIds, [], `Existen IDs con sintaxis inválida: ${invalidIds.join(', ')}`);
        });

        it('TC-HOME-DOM-05: Presencia garantizada de todos los IDs requeridos por Milestone M-Home y M2', () => {
            const currentIds = new Set([...currentHtml.matchAll(/id=["']([^"']+)["']/g)].map(x => x[1]));
            const requiredMHomeIds = [
                'headerAddressBar',
                'headerAddressText',
                'addressSelectorModal',
                'btnHeaderLocateGps',
                'savedAddressCardsList',
                'savedAddressEmptyMsg',
                'headerCustomAddressInput',
                'btnSaveHeaderAddress',
                'catalogSearchInput',
                'catalogSearchClear',
                'cartBtn',
                'cartCount',
                'filter-food-type-container',
                'quickFilterRating',
                'quickFilterPrice',
                'quickFilterDelivery',
                'catalogSortSelect',
                'filtersPanel',
                'productsGrid',
                'catalogResultsCount'
            ];

            const missing = requiredMHomeIds.filter(id => !currentIds.has(id));
            assert.deepEqual(missing, [], `Faltan IDs requeridos de M-Home: ${missing.join(', ')}`);
        });
    });

    // =======================================================================
    // SUITE 2: Address Selector Modal & Geolocation Safeguard
    // =======================================================================
    describe('Suite 2: Address Selector Modal & Geolocation Safeguard', () => {

        beforeEach(() => {
            mockDoc = new MockDocument();
            globalThis.document = mockDoc;
            modalInstances.clear();
            geoCallCount = 0;
            geoBehavior = 'success';
            window.authToken = null;
            window.currentUser = null;
            window.headerDeliveryCoordinates = null;

            // Register standard required DOM elements
            mockDoc.registerElement('headerAddressBar');
            mockDoc.registerElement('headerAddressText');
            mockDoc.registerElement('addressSelectorModal');
            mockDoc.registerElement('btnHeaderLocateGps', 'button');
            mockDoc.registerElement('savedAddressCardsList');
            mockDoc.registerElement('savedAddressEmptyMsg');
            mockDoc.registerElement('headerCustomAddressInput', 'input');
            mockDoc.registerElement('btnSaveHeaderAddress', 'button');
            mockDoc.registerElement('customerAddress', 'input');
            mockDoc.registerElement('loginModal');
            mockDoc.registerElement('miCuentaModal');
        });

        it('TC-HOME-ADDR-01: Clic en #headerAddressBar abre #addressSelectorModal vía Bootstrap Modal', () => {
            const bar = mockDoc.getElementById('headerAddressBar');
            const modalEl = mockDoc.getElementById('addressSelectorModal');

            ui.initHeaderAddress();
            bar.click();

            const modalInst = mockBootstrap.Modal.getOrCreateInstance(modalEl);
            assert.equal(modalInst.visible, true, 'El modal #addressSelectorModal debe estar visible');
        });

        it('TC-HOME-ADDR-02: [PRIVACIDAD ESTRICTA] Abrir el modal NO debe invocar navigator.geolocation', () => {
            const bar = mockDoc.getElementById('headerAddressBar');
            assert.equal(geoCallCount, 0, 'Contador de geolocalización debe iniciar en 0');

            ui.initHeaderAddress();
            bar.click();

            // Stress test: múltiples clics en la barra de direcciones
            bar.click();
            bar.click();

            assert.equal(geoCallCount, 0, 'VIOLACIÓN DE PRIVACIDAD: Abrir el modal nunca debe invocar getCurrentPosition sin acción explícita');
        });

        it('TC-HOME-ADDR-03: populateAddressSelectorModal muestra mensaje de invitado y botón de login si no hay sesión', async () => {
            window.authToken = null;
            const listContainer = mockDoc.getElementById('savedAddressCardsList');

            await ui.populateAddressSelectorModal();

            assert.ok(listContainer.innerHTML.includes('Inicia sesión para ver tus direcciones guardadas'), 'Debe mostrar advertencia de inicio de sesión');
            assert.ok(listContainer.innerHTML.includes('data-bs-target="#loginModal"'), 'Debe ofrecer botón para ir a loginModal');
        });

        it('TC-HOME-ADDR-04: populateAddressSelectorModal muestra estado vacío cuando usuario no tiene direcciones guardadas', async () => {
            window.authToken = 'valid-jwt-token';
            mockAddressesPayload = [];
            const listContainer = mockDoc.getElementById('savedAddressCardsList');

            await ui.populateAddressSelectorModal();

            assert.ok(listContainer.innerHTML.includes('No tienes direcciones guardadas aún'), 'Debe indicar ausencia de direcciones');
        });

        it('TC-HOME-ADDR-05: populateAddressSelectorModal renderiza tarjetas de direcciones con atributos y selección', async () => {
            window.authToken = 'valid-jwt-token';
            mockAddressesPayload = [
                {
                    id: 11,
                    direccion_detallada: 'Av. Larco 1234, Miraflores',
                    referencia: 'Frente al parque',
                    latitud: -12.1250,
                    longitud: -77.0280
                },
                {
                    id: 12,
                    direccion_detallada: 'Calle San Martín 456, Barranco',
                    referencia: 'Dpto 302',
                    latitud: -12.1450,
                    longitud: -77.0210
                }
            ];

            const headerText = mockDoc.getElementById('headerAddressText');
            headerText.textContent = 'Av. Larco 1234, Miraflores';

            const listContainer = mockDoc.getElementById('savedAddressCardsList');
            await ui.populateAddressSelectorModal();

            const items = listContainer.querySelectorAll('.saved-address-item');
            assert.equal(items.length, 2, 'Deben renderizarse exactamente 2 tarjetas de dirección');

            // Verificar atributos dataset
            assert.equal(items[0].dataset.id, '11');
            assert.equal(items[0].dataset.address, 'Av. Larco 1234, Miraflores');
            assert.equal(items[0].dataset.lat, '-12.125');
            assert.equal(items[0].dataset.lng, '-77.028');

            // Verificar resaltado de dirección activa
            assert.ok(items[0].classList.contains('border-primary'), 'La dirección activa debe tener borde primario');
            assert.ok(!items[1].classList.contains('border-primary'), 'La otra dirección no debe tener borde primario');
        });

        it('TC-HOME-ADDR-06: Idempotencia: Invocaciones repetidas de populateAddressSelectorModal no duplican tarjetas', async () => {
            window.authToken = 'valid-jwt-token';
            mockAddressesPayload = [
                { id: 21, direccion_detallada: 'Av. Brasil 2040, Jesús María' }
            ];

            const listContainer = mockDoc.getElementById('savedAddressCardsList');

            // Ejecutar 3 veces seguidas
            await ui.populateAddressSelectorModal();
            await ui.populateAddressSelectorModal();
            await ui.populateAddressSelectorModal();

            const items = listContainer.querySelectorAll('.saved-address-item');
            assert.equal(items.length, 1, 'No deben existir tarjetas duplicadas tras múltiples recargas del modal');
        });

        it('TC-HOME-ADDR-07: Clic en tarjeta de dirección guardada actualiza cabecera, checkout, coordenadas y cierra modal', async () => {
            window.authToken = 'valid-jwt-token';
            mockAddressesPayload = [
                {
                    id: 31,
                    direccion_detallada: 'Av. Javier Prado 1500, San Isidro',
                    latitud: -12.0911,
                    longitud: -77.0345
                }
            ];

            const modalEl = mockDoc.getElementById('addressSelectorModal');
            const modalInst = mockBootstrap.Modal.getOrCreateInstance(modalEl);
            modalInst.show();

            await ui.populateAddressSelectorModal();

            const listContainer = mockDoc.getElementById('savedAddressCardsList');
            const itemBtn = listContainer.querySelector('.saved-address-item');
            assert.ok(itemBtn, 'Debe existir el botón de la tarjeta');

            itemBtn.click();

            const headerText = mockDoc.getElementById('headerAddressText');
            const customerAddress = mockDoc.getElementById('customerAddress');

            assert.equal(headerText.textContent, 'Av. Javier Prado 1500, San Isidro', 'Cabecera debe actualizarse con la dirección');
            assert.equal(customerAddress.value, 'Av. Javier Prado 1500, San Isidro', 'Checkout debe sincronizarse');
            assert.deepEqual(window.headerDeliveryCoordinates, { lat: -12.0911, lng: -77.0345 }, 'Coordenadas deben guardarse');
            assert.equal(modalInst.visible, false, 'El modal debe cerrarse tras la selección');
        });

        it('TC-HOME-ADDR-08: Accesibilidad de teclado: Tecla Enter en #headerAddressBar abre modal sin invocar GPS', () => {
            const bar = mockDoc.getElementById('headerAddressBar');
            const modalEl = mockDoc.getElementById('addressSelectorModal');
            ui.initHeaderAddress();

            const enterEvent = { type: 'keydown', key: 'Enter', preventDefault: () => {} };
            bar.dispatchEvent(enterEvent);

            const modalInst = mockBootstrap.Modal.getOrCreateInstance(modalEl);
            assert.equal(modalInst.visible, true, 'Modal debe abrirse con tecla Enter');
            assert.equal(geoCallCount, 0, 'Abrir modal por teclado no debe activar GPS');
        });

        it('TC-HOME-ADDR-09: Dirección guardada sin coordenadas (null/NaN) no corrompe window.headerDeliveryCoordinates', async () => {
            window.authToken = 'valid-jwt-token';
            mockAddressesPayload = [
                {
                    id: 99,
                    direccion_detallada: 'Av. Sin Coordenadas 123',
                    latitud: null,
                    longitud: null
                }
            ];
            window.headerDeliveryCoordinates = { lat: -12.0, lng: -77.0 };

            await ui.populateAddressSelectorModal();
            const listContainer = mockDoc.getElementById('savedAddressCardsList');
            const itemBtn = listContainer.querySelector('.saved-address-item');

            itemBtn.click();

            const headerText = mockDoc.getElementById('headerAddressText');
            assert.equal(headerText.textContent, 'Av. Sin Coordenadas 123');
            assert.deepEqual(window.headerDeliveryCoordinates, { lat: -12.0, lng: -77.0 });
        });
    });

    // =======================================================================
    // SUITE 3: Explicit GPS Geolocation Action & Error Recovery
    // =======================================================================
    describe('Suite 3: Explicit GPS Geolocation Action & Error Recovery', () => {

        beforeEach(() => {
            mockDoc = new MockDocument();
            globalThis.document = mockDoc;
            modalInstances.clear();
            geoCallCount = 0;
            geoBehavior = 'success';
            window.headerDeliveryCoordinates = null;

            mockDoc.registerElement('headerAddressText');
            mockDoc.registerElement('addressSelectorModal');
            mockDoc.registerElement('btnHeaderLocateGps', 'button');
            mockDoc.registerElement('headerCustomAddressInput', 'input');
            mockDoc.registerElement('btnSaveHeaderAddress', 'button');
            mockDoc.registerElement('customerAddress', 'input');

            // Reset initialized flags on buttons
            const locateBtn = mockDoc.getElementById('btnHeaderLocateGps');
            delete locateBtn.dataset.initialized;
            locateBtn.innerHTML = '<span>Usar mi ubicación actual (GPS)</span>';
            locateBtn.disabled = false;

            const saveManualBtn = mockDoc.getElementById('btnSaveHeaderAddress');
            delete saveManualBtn.dataset.initialized;
        });

        it('TC-HOME-GPS-01: Clic en #btnHeaderLocateGps invoca explícitamente navigator.geolocation', () => {
            ui.initAddressSelectorModal();
            const locateBtn = mockDoc.getElementById('btnHeaderLocateGps');

            locateBtn.click();
            assert.equal(geoCallCount, 1, 'Debe llamar exactamente 1 vez a getCurrentPosition tras clic explícito');
        });

        it('TC-HOME-GPS-02: Flujo exitoso de GPS actualiza cabecera, checkout, coordenadas y cierra modal', () => {
            geoBehavior = 'success';
            mockPosition = { coords: { latitude: -12.1192, longitude: -77.0298 } };

            const modalEl = mockDoc.getElementById('addressSelectorModal');
            const modalInst = mockBootstrap.Modal.getOrCreateInstance(modalEl);
            modalInst.show();

            ui.initAddressSelectorModal();
            const locateBtn = mockDoc.getElementById('btnHeaderLocateGps');

            locateBtn.click();

            const headerText = mockDoc.getElementById('headerAddressText');
            const customerAddress = mockDoc.getElementById('customerAddress');

            assert.equal(headerText.textContent, 'Ubicación GPS (-12.1192, -77.0298)');
            assert.equal(customerAddress.value, 'Ubicación GPS (-12.1192, -77.0298)');
            assert.deepEqual(window.headerDeliveryCoordinates, { lat: -12.1192, lng: -77.0298 });
            assert.equal(modalInst.visible, false, 'Modal debe haberse cerrado');
            assert.equal(locateBtn.disabled, false, 'Botón debe volver a quedar habilitado');
        });

        it('TC-HOME-GPS-03: Rechazo de permisos de GPS se maneja limpiamente sin caídas y re-habilita el botón', () => {
            geoBehavior = 'denied';

            ui.initAddressSelectorModal();
            const locateBtn = mockDoc.getElementById('btnHeaderLocateGps');
            const originalHtml = locateBtn.innerHTML;

            locateBtn.click();

            assert.equal(locateBtn.disabled, false, 'Botón debe rehabilitarse tras rechazo de permisos');
            assert.equal(locateBtn.innerHTML, originalHtml, 'El HTML original del botón debe restaurarse');
        });

        it('TC-HOME-GPS-04: Navegador sin soporte de geolocalización no arroja excepción', () => {
            const originalNav = globalThis.navigator;
            Object.defineProperty(globalThis, 'navigator', {
                value: {},
                writable: true,
                configurable: true
            });

            try {
                ui.initAddressSelectorModal();
                const locateBtn = mockDoc.getElementById('btnHeaderLocateGps');

                assert.doesNotThrow(() => {
                    locateBtn.click();
                }, 'No debe arrojar error si navigator.geolocation no existe');
            } finally {
                Object.defineProperty(globalThis, 'navigator', {
                    value: originalNav,
                    writable: true,
                    configurable: true
                });
            }
        });

        it('TC-HOME-GPS-05: Entrada manual de dirección vacía es rechazada', () => {
            ui.initAddressSelectorModal();
            const manualInput = mockDoc.getElementById('headerCustomAddressInput');
            const saveBtn = mockDoc.getElementById('btnSaveHeaderAddress');
            const headerText = mockDoc.getElementById('headerAddressText');
            headerText.textContent = 'Original Address';

            manualInput.value = '   ';
            saveBtn.click();

            assert.equal(headerText.textContent, 'Original Address', 'No debe alterar la dirección con texto vacío');
        });

        it('TC-HOME-GPS-06: Entrada manual válida actualiza cabecera, sincroniza checkout y cierra modal', () => {
            const modalEl = mockDoc.getElementById('addressSelectorModal');
            const modalInst = mockBootstrap.Modal.getOrCreateInstance(modalEl);
            modalInst.show();

            ui.initAddressSelectorModal();
            const manualInput = mockDoc.getElementById('headerCustomAddressInput');
            const saveBtn = mockDoc.getElementById('btnSaveHeaderAddress');
            const headerText = mockDoc.getElementById('headerAddressText');
            const customerAddress = mockDoc.getElementById('customerAddress');

            manualInput.value = 'Av. República de Panamá 3500';
            saveBtn.click();

            assert.equal(headerText.textContent, 'Av. República de Panamá 3500');
            assert.equal(customerAddress.value, 'Av. República de Panamá 3500');
            assert.equal(modalInst.visible, false, 'Modal debe cerrarse');
        });

        it('TC-HOME-GPS-07: Envío de dirección manual con tecla Enter en input actualiza cabecera', () => {
            const modalEl = mockDoc.getElementById('addressSelectorModal');
            const modalInst = mockBootstrap.Modal.getOrCreateInstance(modalEl);
            modalInst.show();

            ui.initAddressSelectorModal();
            const manualInput = mockDoc.getElementById('headerCustomAddressInput');
            const headerText = mockDoc.getElementById('headerAddressText');

            manualInput.value = 'Calle Las Flores 789, Lince';
            const enterEvt = { type: 'keydown', key: 'Enter', preventDefault: () => {} };
            manualInput.dispatchEvent(enterEvt);

            assert.equal(headerText.textContent, 'Calle Las Flores 789, Lince');
            assert.equal(modalInst.visible, false);
        });
    });

    // =======================================================================
    // SUITE 4: Centralized Navbar Search Bar & Reactive Filtering
    // =======================================================================
    describe('Suite 4: Centralized Navbar Search Bar & Reactive Filtering', () => {

        it('TC-HOME-SEARCH-01: #catalogSearchInput y #catalogSearchClear están físicamente dentro de <nav id="navbar">', () => {
            const navMatch = currentHtml.match(/<nav[^>]*id=["']navbar["'][^>]*>([\s\S]*?)<\/nav>/);
            assert.ok(navMatch, 'Debe existir el elemento <nav id="navbar"> en frontend/index.html');

            const navInner = navMatch[1];
            assert.ok(navInner.includes('id="catalogSearchInput"'), '#catalogSearchInput debe residir dentro de <nav id="navbar">');
            assert.ok(navInner.includes('id="catalogSearchClear"'), '#catalogSearchClear debe residir dentro de <nav id="navbar">');
        });

        it('TC-HOME-SEARCH-02: Contenedor .foodjet-header-search posee clases de centralización y expansión flexible', () => {
            const containerMatch = currentHtml.match(/<div[^>]*class=["']([^"']*foodjet-header-search[^"']*)["'][^>]*>/);
            assert.ok(containerMatch, 'Debe existir .foodjet-header-search');

            const classes = containerMatch[1].split(/\s+/);
            assert.ok(classes.includes('flex-grow-1'), 'Debe incluir flex-grow-1 para expandirse en el centro');
            assert.ok(classes.includes('order-last'), 'Debe ordenar abajo en móvil');
            assert.ok(classes.includes('order-lg-0'), 'Debe ordenar central en desktop (order-lg-0)');
        });

        it('TC-HOME-SEARCH-03: Evento input en #catalogSearchInput muestra botón limpiar y filtra productos', () => {
            mockDoc = new MockDocument();
            globalThis.document = mockDoc;

            const searchInput = mockDoc.registerElement('catalogSearchInput', 'input');
            const clearBtn = mockDoc.registerElement('catalogSearchClear', 'button');
            clearBtn.classList.add('d-none');

            mockDoc.registerElement('productsGrid');
            mockDoc.registerElement('catalogResultsCount');
            mockDoc.registerElement('filter-food-type-container');

            state.setProducts([
                { id: 101, nombre: 'Burger Clásica', descripcion: 'Carne y queso', categoria: 'Hamburguesas', Restaurant: { nombre: 'Burger King' }, disponibilidad: true, precio: 20 },
                { id: 102, nombre: 'Pizza Margherita', descripcion: 'Queso y albahaca', categoria: 'Pizzas', Restaurant: { nombre: 'Pizza Hut' }, disponibilidad: true, precio: 30 }
            ]);

            ui.initCatalogSearch();

            // Simular escritura de búsqueda
            searchInput.value = 'pizza';
            searchInput.dispatchEvent({ type: 'input' });

            assert.equal(clearBtn.classList.contains('d-none'), false, 'Botón de limpieza debe hacerse visible (remover d-none)');
            const countEl = mockDoc.getElementById('catalogResultsCount');
            assert.equal(countEl.textContent, '1 producto', 'Debe haber filtrado exactamente 1 producto');
        });

        it('TC-HOME-SEARCH-04: Clic en #catalogSearchClear resetea input, re-renderiza catálogo y restaura foco', () => {
            mockDoc = new MockDocument();
            globalThis.document = mockDoc;

            const searchInput = mockDoc.registerElement('catalogSearchInput', 'input');
            const clearBtn = mockDoc.registerElement('catalogSearchClear', 'button');
            mockDoc.registerElement('productsGrid');
            mockDoc.registerElement('catalogResultsCount');
            mockDoc.registerElement('filter-food-type-container');

            state.setProducts([
                { id: 101, nombre: 'Burger Clásica', descripcion: 'Carne y queso', categoria: 'Hamburguesas', Restaurant: { nombre: 'Burger King' }, disponibilidad: true, precio: 20 },
                { id: 102, nombre: 'Pizza Margherita', descripcion: 'Queso y albahaca', categoria: 'Pizzas', Restaurant: { nombre: 'Pizza Hut' }, disponibilidad: true, precio: 30 }
            ]);

            ui.initCatalogSearch();

            searchInput.value = 'pizza';
            clearBtn.classList.remove('d-none');

            clearBtn.click();

            assert.equal(searchInput.value, '', 'El input debe limpiarse');
            assert.equal(clearBtn.classList.contains('d-none'), true, 'El botón limpiar debe ocultarse (añadir d-none)');
            assert.equal(searchInput.focused, true, 'El input debe recibir el foco');

            const countEl = mockDoc.getElementById('catalogResultsCount');
            assert.equal(countEl.textContent, '2 productos', 'Debe restaurar el catálogo completo de 2 productos');
        });

        it('TC-HOME-SEARCH-05: Búsqueda con caracteres especiales de regex ([ ] + * ?) no causa error y filtra con seguridad', () => {
            mockDoc = new MockDocument();
            globalThis.document = mockDoc;

            const searchInput = mockDoc.registerElement('catalogSearchInput', 'input');
            const clearBtn = mockDoc.registerElement('catalogSearchClear', 'button');
            mockDoc.registerElement('productsGrid');
            mockDoc.registerElement('catalogResultsCount');
            mockDoc.registerElement('filter-food-type-container');

            state.setProducts([
                { id: 201, nombre: 'Combo [Especial] + Papas', descripcion: 'Todo incluido (2x1)', categoria: 'Combos', Restaurant: { nombre: 'FoodJet Bar' }, disponibilidad: true, precio: 22 },
                { id: 202, nombre: 'Burger Simple', descripcion: 'Sola', categoria: 'Hamburguesas', Restaurant: { nombre: 'Burger House' }, disponibilidad: true, precio: 15 }
            ]);

            ui.initCatalogSearch();

            assert.doesNotThrow(() => {
                searchInput.value = '[Especial]';
                searchInput.dispatchEvent({ type: 'input' });
            });

            const countEl = mockDoc.getElementById('catalogResultsCount');
            assert.equal(countEl.textContent, '1 producto');
        });
    });

    // =======================================================================
    // SUITE 5: Textual Cart Button Contract & Reactive Counter
    // =======================================================================
    describe('Suite 5: Textual Cart Button Contract & Reactive Counter', () => {

        it('TC-HOME-CART-01: #cartBtn en index.html contiene "Mi carrito", separador y #cartCount', () => {
            const cartBtnMatch = currentHtml.match(/<button[^>]*id=["']cartBtn["'][^>]*>([\s\S]*?)<\/button>/);
            assert.ok(cartBtnMatch, '#cartBtn debe existir en frontend/index.html');

            const inner = cartBtnMatch[1];
            assert.ok(inner.includes('Mi carrito'), '#cartBtn debe contener la etiqueta textual "Mi carrito"');
            assert.ok(inner.includes('class="foodjet-cart-btn__sep'), '#cartBtn debe contener el separador .foodjet-cart-btn__sep');
            assert.ok(inner.includes('id="cartCount"'), '#cartBtn debe contener el contador #cartCount');
        });

        it('TC-HOME-CART-02: Carrito vacío oculta #cartCount (display: none) y separador (display: none)', () => {
            mockDoc = new MockDocument();
            globalThis.document = mockDoc;

            mockDoc.registerElement('cartItems');
            mockDoc.registerElement('cartTotal');
            mockDoc.registerElement('cartSubtotal');
            mockDoc.registerElement('cartStudentSavingsRow');
            mockDoc.registerElement('cartStudentSavings');
            mockDoc.registerElement('cartCount');
            mockDoc.registerElement('cartItemCount');
            mockDoc.registerElement('emptyCart');
            mockDoc.registerElement('cartFooter');
            mockDoc.registerElement('checkoutBtn', 'button');
            mockDoc.registerElement('cartRestaurantBanner');

            const sepEl = mockDoc.createElement('span');
            sepEl.className = 'foodjet-cart-btn__sep';
            mockDoc.elements.set('cartSep', sepEl);
            mockDoc.body.appendChild(sepEl);

            state.clearCart();
            ui.renderCartOffcanvas();

            const cartCount = mockDoc.getElementById('cartCount');
            assert.equal(cartCount.textContent, '0');
            assert.equal(cartCount.style.display, 'none', '#cartCount debe estar en display: none cuando está vacío');
            assert.equal(sepEl.style.display, 'none', 'El separador debe estar en display: none cuando está vacío');
        });

        it('TC-HOME-CART-03: Agregar producto activa reactivamente #cartCount (inline-flex) y separador (inline)', () => {
            mockDoc = new MockDocument();
            globalThis.document = mockDoc;

            mockDoc.registerElement('cartItems');
            mockDoc.registerElement('cartTotal');
            mockDoc.registerElement('cartSubtotal');
            mockDoc.registerElement('cartStudentSavingsRow');
            mockDoc.registerElement('cartStudentSavings');
            mockDoc.registerElement('cartCount');
            mockDoc.registerElement('cartItemCount');
            mockDoc.registerElement('emptyCart');
            mockDoc.registerElement('cartFooter');
            mockDoc.registerElement('checkoutBtn', 'button');
            mockDoc.registerElement('cartRestaurantBanner');

            const sepEl = mockDoc.createElement('span');
            sepEl.className = 'foodjet-cart-btn__sep';
            mockDoc.elements.set('cartSep', sepEl);
            mockDoc.body.appendChild(sepEl);

            state.setProducts([
                { id: 201, nombre: 'Burger Doble', precio: 25, disponibilidad: true, restaurante_id: 1, Restaurant: { id: 1, nombre: 'Burger House' } }
            ]);

            state.clearCart();
            state.addToCart(201);

            ui.renderCartOffcanvas();

            const cartCount = mockDoc.getElementById('cartCount');
            assert.equal(cartCount.textContent, '1');
            assert.equal(cartCount.style.display, 'inline-flex', '#cartCount debe mostrarse como inline-flex');
            assert.equal(sepEl.style.display, 'inline', 'El separador debe mostrarse como inline');
        });

        it('TC-HOME-CART-04: Acumulación de múltiples ítems y vaciado completo restaura visibilidad oculta', () => {
            mockDoc = new MockDocument();
            globalThis.document = mockDoc;

            mockDoc.registerElement('cartItems');
            mockDoc.registerElement('cartTotal');
            mockDoc.registerElement('cartSubtotal');
            mockDoc.registerElement('cartStudentSavingsRow');
            mockDoc.registerElement('cartStudentSavings');
            mockDoc.registerElement('cartCount');
            mockDoc.registerElement('cartItemCount');
            mockDoc.registerElement('emptyCart');
            mockDoc.registerElement('cartFooter');
            mockDoc.registerElement('checkoutBtn', 'button');
            mockDoc.registerElement('cartRestaurantBanner');

            const sepEl = mockDoc.createElement('span');
            sepEl.className = 'foodjet-cart-btn__sep';
            mockDoc.elements.set('cartSep', sepEl);
            mockDoc.body.appendChild(sepEl);

            state.setProducts([
                { id: 301, nombre: 'Roll Acevichado', precio: 30, disponibilidad: true, restaurante_id: 5, Restaurant: { id: 5, nombre: 'Sushi King' } }
            ]);

            state.clearCart();
            state.addToCart(301);
            state.addToCart(301);
            state.addToCart(301);
            assert.equal(state.getCartItemCount(), 3);

            ui.renderCartOffcanvas();

            const cartCount = mockDoc.getElementById('cartCount');
            assert.equal(cartCount.textContent, '3');
            assert.equal(cartCount.style.display, 'inline-flex');
            assert.equal(sepEl.style.display, 'inline');

            // Drenar completamente el carrito
            state.clearCart();
            ui.renderCartOffcanvas();

            assert.equal(cartCount.textContent, '0');
            assert.equal(cartCount.style.display, 'none');
            assert.equal(sepEl.style.display, 'none');
        });
    });
});
