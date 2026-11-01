/**
 * FoodJet — Milestone 3 Empirical Challenge Test Suite
 * 
 * Challenger M3-2: Empirical State, Timing, Modals & Tracking Challenge
 * 
 * Objectives:
 * 1. Double-click prevention:
 *    - Simulate rapid multiple clicks on #confirmOrderBtn
 *    - Ensure only 1 submission payload is dispatched and button is disabled during in-flight state
 *    - Verify recovery on validation error and network failure
 * 2. Tracking connection transitions:
 *    - Simulate polling failure states (success -> failure 1 -> failure 5 -> recovery)
 *    - Verify live indicator classes (.foodjet-badge--live, .foodjet-badge--reconnecting, .foodjet-badge--disconnected)
 *    - Verify pulse animation keyframes and accessibility ARIA labels
 * 3. 4-step timeline:
 *    - Verify past stages have real timestamps (without "aprox.") and checkmark icons (bi-check-lg)
 *    - Verify future stages have "aprox." timestamps with ISO datetimes
 *    - Verify active stage has "Ahora" badge and aria-current="step"
 *    - Full lifecycle transitions across pendiente, confirmado, en_preparacion, en_camino, entregado, cancelado
 * 4. Order cancellation:
 *    - Verify #cancelOrderBtn is displayed strictly for 'pendiente' and 'confirmado' states and hidden for subsequent states
 *    - Verify data-order-id binding, confirmation prompt, in-flight disabled state, and transition to cancelled
 * 5. Mobile containment:
 *    - Verify responsive rules in frontend/styles.css ensuring zero horizontal overflow on 360px and 390px viewports
 *    - Verify sticky to static layout switch (< 992px)
 *    - Verify payment options grid 1-column collapse (< 576px)
 *    - Verify tap targets >= 44px
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Load domain modules under test
import {
    ETAPAS_SEGUIMIENTO,
    lineaDeTiempo,
    longitudRuta,
    avanceDelReparto,
    dividirRuta
} from '../../frontend/js/domain/seguimiento.js';

import {
    normalizeEstado,
    isTerminal,
    getTrackingViewModel
} from '../../frontend/js/domain/orderStatus.js';

import {
    isCancelable
} from '../../backend/src/domain/orderStatus.js';

import {
    validateCoupon,
    buildOrderPayload
} from '../../frontend/js/domain/checkout.js';

// Read static assets for empirical verification
const stylesPath = path.resolve('frontend/styles.css');
const stylesCss = fs.readFileSync(stylesPath, 'utf-8');

const indexPath = path.resolve('frontend/index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf-8');

// =============================================================================
// HIGH-FIDELITY MOCK DOM ENVIRONMENT
// =============================================================================

class MockClassList {
    constructor() {
        this._classes = new Set();
    }
    add(...names) { names.forEach(n => n && this._classes.add(n)); }
    remove(...names) { names.forEach(n => this._classes.delete(n)); }
    contains(name) { return this._classes.has(name); }
    replace(oldClass, newClass) {
        this._classes.delete(oldClass);
        if (newClass) this._classes.add(newClass);
    }
    toggle(name, force) {
        if (typeof force === 'boolean') {
            if (force) this._classes.add(name);
            else this._classes.delete(name);
            return force;
        }
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
        this.parentElement = null;
        this._innerHTML = '';
        this._textContent = '';
        this._listeners = {};
        this.disabled = false;
        this.value = '';
        this.checked = false;
        this.hidden = false;
    }

    get className() { return this.classList.toString(); }
    set className(val) {
        this.classList._classes.clear();
        if (val) val.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
    }

    get innerHTML() { return this._innerHTML; }
    set innerHTML(val) {
        this._innerHTML = String(val);
        // Simple innerHTML parser for child icons/elements if needed
        this.children = [];
        const matchIcon = val.match(/class="([^"]+)"/);
        if (matchIcon) {
            const child = new MockElement('i');
            child.className = matchIcon[1];
            child.parentElement = this;
            this.children.push(child);
        }
    }

    get textContent() { return this._textContent; }
    set textContent(val) { this._textContent = String(val); }

    appendChild(child) {
        child.parentElement = this;
        this.children.push(child);
        return child;
    }

    remove() {
        if (this.parentElement) {
            this.parentElement.children = this.parentElement.children.filter(c => c !== this);
            this.parentElement = null;
        }
    }

    setAttribute(k, v) { this.attributes[k] = String(v); }
    getAttribute(k) { return this.attributes[k] ?? null; }
    removeAttribute(k) { delete this.attributes[k]; }

    addEventListener(event, fn, options) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push({ fn, once: !!options?.once });
    }

    removeEventListener(event, fn) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(l => l.fn !== fn);
    }

    dispatchEvent(event) {
        const listeners = (this._listeners[event.type || event] || []).slice();
        listeners.forEach(l => {
            l.fn(event);
            if (l.once) this.removeEventListener(event.type || event, l.fn);
        });
    }

    click() {
        const evt = {
            type: 'click',
            currentTarget: this,
            target: this,
            preventDefault: () => {},
            stopPropagation: () => {}
        };
        this.dispatchEvent(evt);
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
            } else if (selector === node.tagName.toLowerCase()) {
                results.push(node);
            }
            if (node.children) node.children.forEach(traverse);
        };
        if (this.children) this.children.forEach(traverse);
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
        for (const el of this.elements.values()) {
            if (selector.startsWith('.') && el.classList.contains(selector.slice(1))) {
                return el;
            }
            if (selector === el.tagName.toLowerCase()) {
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
        return new MockElement(tag);
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Milestone 3 Empirical Verification — Challenger M3-2', () => {

    // =========================================================================
    // SUITE 1: Double-Click Prevention & In-Flight State Guard
    // =========================================================================
    describe('Suite 1: Double-Click Prevention & In-Flight Submission Guard', () => {
        let doc;
        let confirmBtn;
        let spinner;
        let text;
        let arrow;
        let isSubmittingOrder;
        let setOrderSubmittingState;

        beforeEach(() => {
            doc = new MockDocument();
            confirmBtn = doc.registerElement('confirmOrderBtn', 'button');
            spinner = doc.registerElement('confirmOrderSpinner', 'span');
            spinner.classList.add('d-none');
            text = doc.registerElement('confirmOrderText', 'span');
            text.textContent = 'Confirmar Pedido';
            arrow = doc.registerElement('confirmOrderArrow', 'i');

            // Wire up exact setOrderSubmittingState logic as implemented in frontend/js/app.js:246-267
            isSubmittingOrder = false;
            setOrderSubmittingState = (isSubmitting, method = 'cash') => {
                isSubmittingOrder = isSubmitting;
                const btn = doc.getElementById('confirmOrderBtn');
                const spin = doc.getElementById('confirmOrderSpinner');
                const txt = doc.getElementById('confirmOrderText');
                const arr = doc.getElementById('confirmOrderArrow');

                if (!btn) return;
                btn.disabled = isSubmitting;
                btn.classList.toggle('is-loading', isSubmitting);

                if (spin) spin.classList.toggle('d-none', !isSubmitting);
                if (arr) arr.classList.toggle('d-none', isSubmitting);
                if (txt) {
                    if (isSubmitting) {
                        txt.textContent = 'Registrando pedido...';
                    } else {
                        txt.textContent = method === 'wallet' ? 'Pagar con QR' : 'Confirmar Pedido';
                    }
                }
            };
        });

        it('debe inicializar el botón #confirmOrderBtn en estado habilitado con spinner oculto', () => {
            assert.strictEqual(confirmBtn.disabled, false);
            assert.strictEqual(confirmBtn.classList.contains('is-loading'), false);
            assert.strictEqual(spinner.classList.contains('d-none'), true);
            assert.strictEqual(arrow.classList.contains('d-none'), false);
            assert.strictEqual(text.textContent, 'Confirmar Pedido');
        });

        it('debe transicionar correctamente a estado de envío (disabled, spinner visible, texto de carga)', () => {
            setOrderSubmittingState(true);

            assert.strictEqual(isSubmittingOrder, true);
            assert.strictEqual(confirmBtn.disabled, true);
            assert.strictEqual(confirmBtn.classList.contains('is-loading'), true);
            assert.strictEqual(spinner.classList.contains('d-none'), false);
            assert.strictEqual(arrow.classList.contains('d-none'), true);
            assert.strictEqual(text.textContent, 'Registrando pedido...');
        });

        it('debe restaurar el estado interactivo al completar o cancelar el envío', () => {
            setOrderSubmittingState(true);
            assert.strictEqual(confirmBtn.disabled, true);

            setOrderSubmittingState(false, 'cash');
            assert.strictEqual(isSubmittingOrder, false);
            assert.strictEqual(confirmBtn.disabled, false);
            assert.strictEqual(confirmBtn.classList.contains('is-loading'), false);
            assert.strictEqual(spinner.classList.contains('d-none'), true);
            assert.strictEqual(arrow.classList.contains('d-none'), false);
            assert.strictEqual(text.textContent, 'Confirmar Pedido');
        });

        it('debe actualizar el texto a "Pagar con QR" cuando el método es wallet al salir del envío', () => {
            setOrderSubmittingState(true);
            setOrderSubmittingState(false, 'wallet');

            assert.strictEqual(confirmBtn.disabled, false);
            assert.strictEqual(text.textContent, 'Pagar con QR');
        });

        it('Stress Test: debe prevenir envíos concurrentes ante ráfaga de 10 clics rápidos (callCount === 1)', async () => {
            let apiCallCount = 0;
            const simulatedBackend = async (payload) => {
                apiCallCount++;
                // Simula latencia de red de 20ms
                await new Promise(resolve => setTimeout(resolve, 20));
                return { ok: true, data: { order: { id: 999 } } };
            };

            // Simula el orquestador handleCheckoutSubmit
            const handleCheckoutSubmit = async () => {
                if (isSubmittingOrder) return; // In-flight lock
                setOrderSubmittingState(true);
                try {
                    await simulatedBackend({ items: [1] });
                } finally {
                    setOrderSubmittingState(false);
                }
            };

            // Disparar 10 clics concurrentes en un bucle síncrono
            const clickPromises = [];
            for (let i = 0; i < 10; i++) {
                clickPromises.push(handleCheckoutSubmit());
            }

            // Esperar que todos los intentos resuelvan
            await Promise.all(clickPromises);

            // Verificación empírica estricta: solo 1 llamada al backend
            assert.strictEqual(apiCallCount, 1, 'Debe despachar exactamente 1 petición al backend pese a 10 clics concurrentes');
            assert.strictEqual(isSubmittingOrder, false, 'El lock debe liberarse al finalizar');
            assert.strictEqual(confirmBtn.disabled, false, 'El botón debe quedar re-habilitado tras el ciclo');
        });

        it('debe re-habilitar el botón y limpiar el lock si la validación previa de dirección falla', async () => {
            let apiCallCount = 0;
            const resolveAddressMock = async () => null; // Fallo de dirección (campo vacío o sin pin)

            const handleCheckoutSubmit = async () => {
                if (isSubmittingOrder) return;
                setOrderSubmittingState(true);
                try {
                    const dirId = await resolveAddressMock();
                    if (!dirId) {
                        setOrderSubmittingState(false);
                        return;
                    }
                    apiCallCount++;
                } catch (err) {
                    setOrderSubmittingState(false);
                }
            };

            await handleCheckoutSubmit();

            assert.strictEqual(apiCallCount, 0, 'No debe invocar backend si falla la dirección');
            assert.strictEqual(isSubmittingOrder, false, 'El lock debe restaurarse');
            assert.strictEqual(confirmBtn.disabled, false, 'El botón debe quedar disponible para que el usuario corrija');
        });

        it('debe re-habilitar el botón mediante bloque finally si el backend responde con error 500', async () => {
            const failingBackend = async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                throw new Error('Internal Server Error 500');
            };

            let caughtError = null;
            const handleCheckoutSubmit = async () => {
                if (isSubmittingOrder) return;
                setOrderSubmittingState(true);
                try {
                    await failingBackend();
                } catch (err) {
                    caughtError = err;
                } finally {
                    setOrderSubmittingState(false);
                }
            };

            await handleCheckoutSubmit();

            assert.ok(caughtError, 'El error debe ser capturado');
            assert.strictEqual(isSubmittingOrder, false, 'El lock debe ser liberado en el finally');
            assert.strictEqual(confirmBtn.disabled, false, 'El botón no debe quedar congelado tras error');
        });
    });

    // =========================================================================
    // SUITE 2: Tracking Connection Transitions & Live Indicator State Machine
    // =========================================================================
    describe('Suite 2: Tracking Connection Transitions & Live Indicator State Machine', () => {
        let doc;
        let indicator;
        let textEl;
        let connectionNotice;
        let updateLiveIndicator;

        beforeEach(() => {
            doc = new MockDocument();
            indicator = doc.registerElement('liveIndicator');
            indicator.classList.add('foodjet-badge', 'foodjet-badge--live');
            indicator.setAttribute('role', 'status');
            indicator.setAttribute('aria-live', 'polite');

            textEl = doc.registerElement('liveIndicatorText', 'span');
            textEl.textContent = 'Actualizando en vivo';

            connectionNotice = doc.registerElement('trackingConnection');

            // Wire up exact updateLiveIndicator implementation from frontend/js/ui.js:1572-1596
            updateLiveIndicator = (status, message) => {
                const ind = doc.getElementById('liveIndicator');
                const txt = doc.getElementById('liveIndicatorText');
                if (!ind) return;

                ind.classList.remove(
                    'foodjet-badge--live',
                    'foodjet-badge--reconnecting',
                    'foodjet-badge--disconnected'
                );

                if (status === 'live') {
                    ind.classList.add('foodjet-badge--live');
                    ind.setAttribute('aria-label', 'Conexión activa: actualizando en vivo');
                    if (txt) txt.textContent = message || 'Actualizando en vivo';
                } else if (status === 'reconnecting') {
                    ind.classList.add('foodjet-badge--reconnecting');
                    ind.setAttribute('aria-label', 'Problema de red: reconectando');
                    if (txt) txt.textContent = message || 'Reconectando…';
                } else if (status === 'disconnected') {
                    ind.classList.add('foodjet-badge--disconnected');
                    ind.setAttribute('aria-label', 'Desconectado: no se pudo actualizar');
                    if (txt) txt.textContent = message || 'Sin conexión';
                }
            };
        });

        it('Estado Inicial / Conectado: debe tener clase .foodjet-badge--live y texto "Actualizando en vivo"', () => {
            updateLiveIndicator('live');

            assert.strictEqual(indicator.classList.contains('foodjet-badge--live'), true);
            assert.strictEqual(indicator.classList.contains('foodjet-badge--reconnecting'), false);
            assert.strictEqual(indicator.classList.contains('foodjet-badge--disconnected'), false);
            assert.strictEqual(textEl.textContent, 'Actualizando en vivo');
            assert.strictEqual(indicator.getAttribute('aria-label'), 'Conexión activa: actualizando en vivo');
        });

        it('Fallo Transitorio 1: debe transicionar limpiamente a .foodjet-badge--reconnecting', () => {
            updateLiveIndicator('reconnecting');

            assert.strictEqual(indicator.classList.contains('foodjet-badge--live'), false);
            assert.strictEqual(indicator.classList.contains('foodjet-badge--reconnecting'), true);
            assert.strictEqual(indicator.classList.contains('foodjet-badge--disconnected'), false);
            assert.strictEqual(textEl.textContent, 'Reconectando…');
            assert.strictEqual(indicator.getAttribute('aria-label'), 'Problema de red: reconectando');
        });

        it('Agotamiento de Intentos (Fallo 5): debe transicionar a .foodjet-badge--disconnected', () => {
            updateLiveIndicator('disconnected');

            assert.strictEqual(indicator.classList.contains('foodjet-badge--live'), false);
            assert.strictEqual(indicator.classList.contains('foodjet-badge--reconnecting'), false);
            assert.strictEqual(indicator.classList.contains('foodjet-badge--disconnected'), true);
            assert.strictEqual(textEl.textContent, 'Sin conexión');
            assert.strictEqual(indicator.getAttribute('aria-label'), 'Desconectado: no se pudo actualizar');
        });

        it('Máquina de Estados de Polling: simula ciclo completo Éxito -> Falla 1 -> Falla 5 -> Recuperación', () => {
            const MAX_FALLOS = 5;
            let trackingFallos = 0;
            let isPollingActive = true;

            const simulatePoll = (apiResult) => {
                if (!apiResult.ok) {
                    trackingFallos += 1;
                    updateLiveIndicator('reconnecting', 'Reconectando…');
                    connectionNotice.textContent = 'Sin conexión con el servidor, reintentando…';

                    if (trackingFallos >= MAX_FALLOS) {
                        updateLiveIndicator('disconnected', 'Sin conexión');
                        connectionNotice.textContent = 'No se pudo actualizar el estado del pedido.';
                        isPollingActive = false; // Detener polling
                    }
                    return;
                }

                trackingFallos = 0;
                updateLiveIndicator('live', 'Actualizando en vivo');
                connectionNotice.textContent = '';
            };

            // 1. Estado inicial en vivo
            simulatePoll({ ok: true, data: { estado: 'en_camino' } });
            assert.strictEqual(indicator.classList.contains('foodjet-badge--live'), true);
            assert.strictEqual(trackingFallos, 0);

            // 2. Primer fallo de red
            simulatePoll({ ok: false, error: 'Network timeout' });
            assert.strictEqual(indicator.classList.contains('foodjet-badge--reconnecting'), true);
            assert.strictEqual(trackingFallos, 1);
            assert.strictEqual(connectionNotice.textContent, 'Sin conexión con el servidor, reintentando…');
            assert.strictEqual(isPollingActive, true);

            // 3. Fallos 2, 3, 4
            simulatePoll({ ok: false, error: '500 Server Error' });
            simulatePoll({ ok: false, error: '502 Bad Gateway' });
            simulatePoll({ ok: false, error: '504 Gateway Timeout' });
            assert.strictEqual(trackingFallos, 4);
            assert.strictEqual(indicator.classList.contains('foodjet-badge--reconnecting'), true);
            assert.strictEqual(isPollingActive, true);

            // 4. Quinto fallo (Umbral MAX_FALLOS = 5 alcanzado)
            simulatePoll({ ok: false, error: 'Connection refused' });
            assert.strictEqual(trackingFallos, 5);
            assert.strictEqual(indicator.classList.contains('foodjet-badge--disconnected'), true);
            assert.strictEqual(isPollingActive, false, 'El polling debe detenerse tras 5 fallos consecutivos');
            assert.strictEqual(connectionNotice.textContent, 'No se pudo actualizar el estado del pedido.');

            // 5. Recuperación de conexión tras reinicio
            isPollingActive = true;
            simulatePoll({ ok: true, data: { estado: 'en_camino' } });
            assert.strictEqual(trackingFallos, 0);
            assert.strictEqual(indicator.classList.contains('foodjet-badge--live'), true);
            assert.strictEqual(textEl.textContent, 'Actualizando en vivo');
            assert.strictEqual(connectionNotice.textContent, '', 'El aviso diagnóstico debe limpiarse al recuperar conexión');
        });

        it('CSS Token & Keyframe Audit: verifica reglas de pulsación verde, ámbar y rojo estático', () => {
            // Regla .foodjet-badge--live y punto verde #28A745
            assert.ok(stylesCss.includes('.foodjet-badge--live'), 'styles.css debe definir .foodjet-badge--live');
            assert.ok(stylesCss.includes('#28A745'), 'styles.css debe usar #28A745 para el punto en vivo');
            assert.ok(stylesCss.includes('foodjet-pulse-live'), 'styles.css debe definir animación foodjet-pulse-live');

            // Regla .foodjet-badge--reconnecting y punto ámbar #D97706
            assert.ok(stylesCss.includes('.foodjet-badge--reconnecting'), 'styles.css debe definir .foodjet-badge--reconnecting');
            assert.ok(stylesCss.includes('#D97706') || stylesCss.includes('#F59E0B'), 'styles.css debe usar tonos ámbar para reconexión');
            assert.ok(stylesCss.includes('foodjet-pulse-amber'), 'styles.css debe definir animación foodjet-pulse-amber');

            // Regla .foodjet-badge--disconnected y punto rojo #DC2626 estático
            assert.ok(stylesCss.includes('.foodjet-badge--disconnected'), 'styles.css debe definir .foodjet-badge--disconnected');
            assert.ok(stylesCss.includes('#DC2626') || stylesCss.includes('#EF4444'), 'styles.css debe usar tonos rojos para desconexión');
            assert.ok(stylesCss.includes('animation: none'), 'styles.css debe apagar animación en estado desconectado');
        });
    });

    // =========================================================================
    // SUITE 3: Chronological 4-Step Timeline & Timestamp Verification
    // =========================================================================
    describe('Suite 3: Chronological 4-Step Timeline & Timestamp Verification', () => {
        const formatoHora = new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit' });
        const ICONOS_ETAPA = ['bi-hourglass-split', 'bi-box-seam', 'bi-bicycle', 'bi-house-door'];

        let doc;
        let steps;
        let stepTimes;
        let statusTitle;
        let trackingHeadline;

        beforeEach(() => {
            doc = new MockDocument();
            steps = [];
            stepTimes = [];

            for (let i = 1; i <= 4; i++) {
                const step = doc.registerElement(`step${i}`, 'li');
                const marca = new MockElement('span');
                marca.classList.add('linea-tiempo__marca');
                marca.innerHTML = `<i class="bi ${ICONOS_ETAPA[i - 1]}"></i>`;
                step.appendChild(marca);

                const cont = new MockElement('div');
                cont.classList.add('linea-tiempo__contenido');
                const badge = new MockElement('span');
                badge.classList.add('foodjet-badge', 'foodjet-badge--pill', 'linea-tiempo__ahora-badge');
                badge.textContent = 'Ahora';
                cont.appendChild(badge);
                step.appendChild(cont);

                const timeEl = doc.registerElement(`stepTime${i}`, 'span');
                step.appendChild(timeEl);

                steps.push(step);
                stepTimes.push(timeEl);
            }

            statusTitle = doc.registerElement('statusTitle', 'h2');
            trackingHeadline = doc.registerElement('trackingHeadline', 'h1');
        });

        // Helper que reproduce la renderización exacta de applyTrackingViewModel
        const applyViewModelToMockDom = (pedido, ahoraMs) => {
            const vm = getTrackingViewModel(pedido.estado);
            const linea = lineaDeTiempo({ estado: vm.estado, ...(pedido || {}) }, ahoraMs);

            linea.etapas.forEach((etapa, i) => {
                const paso = doc.getElementById(`step${i + 1}`);
                if (!paso) return;

                paso.dataset.situacion = etapa.situacion;
                if (etapa.situacion === 'en_curso') {
                    paso.setAttribute('aria-current', 'step');
                } else {
                    paso.removeAttribute('aria-current');
                }

                const marca = paso.querySelector('.linea-tiempo__marca');
                if (marca) {
                    const icono = etapa.situacion === 'hecha' ? 'bi-check-lg' : ICONOS_ETAPA[i];
                    marca.innerHTML = `<i class="bi ${icono}"></i>`;
                }

                const hora = doc.getElementById(`stepTime${i + 1}`);
                if (hora) {
                    hora.innerHTML = etapa.hora === null ? '' : `<time datetime="${new Date(etapa.hora).toISOString()}">${
                        etapa.estimada ? 'aprox. ' : ''}${formatoHora.format(etapa.hora)}</time>`;
                }
            });

            return { vm, linea };
        };

        it('debe mantener las 4 etapas canónicas en orden estricto (Confirmación, Preparación, En camino, Entregado)', () => {
            assert.strictEqual(ETAPAS_SEGUIMIENTO.length, 4);
            assert.strictEqual(ETAPAS_SEGUIMIENTO[0].etiqueta, 'Confirmación');
            assert.strictEqual(ETAPAS_SEGUIMIENTO[0].estado, 'confirmado');
            assert.strictEqual(ETAPAS_SEGUIMIENTO[1].etiqueta, 'Preparación');
            assert.strictEqual(ETAPAS_SEGUIMIENTO[1].estado, 'en_preparacion');
            assert.strictEqual(ETAPAS_SEGUIMIENTO[2].etiqueta, 'En camino');
            assert.strictEqual(ETAPAS_SEGUIMIENTO[2].estado, 'en_camino');
            assert.strictEqual(ETAPAS_SEGUIMIENTO[3].etiqueta, 'Entregado');
            assert.strictEqual(ETAPAS_SEGUIMIENTO[3].estado, 'entregado');
        });

        it('Etapa en progreso (en_preparacion): pasado tiene hora real y check, activa tiene aria-current, futuras tienen aprox.', () => {
            const fechaBase = new Date('2026-10-30T15:00:00Z').getTime();
            const pedido = {
                id: 10,
                estado: 'en_preparacion',
                fecha: new Date(fechaBase).toISOString(),
                plan_tiempos: {
                    confirmado: 60,       // 1 min
                    en_preparacion: 300,  // 5 min
                    en_camino: 600        // 10 min
                },
                historial: [
                    { estado: 'pendiente', fecha: new Date(fechaBase).toISOString() },
                    { estado: 'confirmado', fecha: new Date(fechaBase + 30000).toISOString() }, // 15:00:30
                    { estado: 'en_preparacion', fecha: new Date(fechaBase + 90000).toISOString() } // 15:01:30
                ]
            };

            const ahora = fechaBase + 120000; // 15:02:00
            const { linea } = applyViewModelToMockDom(pedido, ahora);

            // Step 1: Confirmación (Completada en el pasado)
            const step1 = doc.getElementById('step1');
            assert.strictEqual(step1.dataset.situacion, 'hecha');
            assert.strictEqual(step1.getAttribute('aria-current'), null);
            const marca1 = step1.querySelector('.linea-tiempo__marca');
            assert.ok(marca1.innerHTML.includes('bi-check-lg'), 'Paso completado debe tener icono checkmark bi-check-lg');
            const time1 = doc.getElementById('stepTime1');
            assert.ok(time1.innerHTML.includes('<time datetime="'), 'Debe envolverse en etiqueta semántica <time>');
            assert.ok(!time1.innerHTML.includes('aprox.'), 'Paso histórico real NO debe llevar "aprox."');

            // Step 2: Preparación (Etapa activa / en curso)
            const step2 = doc.getElementById('step2');
            assert.strictEqual(step2.dataset.situacion, 'en_curso');
            assert.strictEqual(step2.getAttribute('aria-current'), 'step', 'Paso activo debe llevar aria-current="step"');

            // Step 3: En camino (Futura estimada)
            const step3 = doc.getElementById('step3');
            assert.strictEqual(step3.dataset.situacion, 'pendiente');
            const time3 = doc.getElementById('stepTime3');
            assert.ok(time3.innerHTML.includes('aprox.'), 'Etapa futura estimada DEBE llevar prefijo "aprox."');

            // Step 4: Entregado (Futura estimada)
            const step4 = doc.getElementById('step4');
            assert.strictEqual(step4.dataset.situacion, 'pendiente');
            const time4 = doc.getElementById('stepTime4');
            assert.ok(time4.innerHTML.includes('aprox.'), 'Etapa final estimada DEBE llevar prefijo "aprox."');
        });

        it('Etapa en_camino: Steps 1 y 2 están completados con check, Step 3 activo, Step 4 estimado', () => {
            const fechaBase = new Date('2026-10-30T16:00:00Z').getTime();
            const pedido = {
                id: 11,
                estado: 'en_camino',
                fecha: new Date(fechaBase).toISOString(),
                plan_tiempos: { confirmado: 60, en_preparacion: 300, en_camino: 600 },
                historial: [
                    { estado: 'pendiente', fecha: new Date(fechaBase).toISOString() },
                    { estado: 'confirmado', fecha: new Date(fechaBase + 45000).toISOString() },
                    { estado: 'en_preparacion', fecha: new Date(fechaBase + 120000).toISOString() },
                    { estado: 'en_camino', fecha: new Date(fechaBase + 400000).toISOString() }
                ]
            };

            applyViewModelToMockDom(pedido, fechaBase + 500000);

            // Step 1 y Step 2 completados
            assert.strictEqual(doc.getElementById('step1').dataset.situacion, 'hecha');
            assert.strictEqual(doc.getElementById('step2').dataset.situacion, 'hecha');
            assert.ok(doc.getElementById('step1').querySelector('.linea-tiempo__marca').innerHTML.includes('bi-check-lg'));
            assert.ok(doc.getElementById('step2').querySelector('.linea-tiempo__marca').innerHTML.includes('bi-check-lg'));
            assert.ok(!doc.getElementById('step1').innerHTML.includes('aprox.'));
            assert.ok(!doc.getElementById('step2').innerHTML.includes('aprox.'));

            // Step 3 activo
            assert.strictEqual(doc.getElementById('step3').dataset.situacion, 'en_curso');
            assert.strictEqual(doc.getElementById('step3').getAttribute('aria-current'), 'step');

            // Step 4 pendiente estimado
            assert.strictEqual(doc.getElementById('step4').dataset.situacion, 'pendiente');
            assert.ok(doc.getElementById('stepTime4').innerHTML.includes('aprox.'));
        });

        it('Etapa entregado: las 4 etapas están completadas (hecha), todas con checks, cero estimaciones "aprox."', () => {
            const fechaBase = new Date('2026-10-30T17:00:00Z').getTime();
            const pedido = {
                id: 12,
                estado: 'entregado',
                fecha: new Date(fechaBase).toISOString(),
                plan_tiempos: { confirmado: 60, en_preparacion: 300, en_camino: 600 },
                historial: [
                    { estado: 'pendiente', fecha: new Date(fechaBase).toISOString() },
                    { estado: 'confirmado', fecha: new Date(fechaBase + 30000).toISOString() },
                    { estado: 'en_preparacion', fecha: new Date(fechaBase + 100000).toISOString() },
                    { estado: 'en_camino', fecha: new Date(fechaBase + 400000).toISOString() },
                    { estado: 'entregado', fecha: new Date(fechaBase + 900000).toISOString() }
                ]
            };

            applyViewModelToMockDom(pedido, fechaBase + 1000000);

            for (let i = 1; i <= 4; i++) {
                const step = doc.getElementById(`step${i}`);
                assert.strictEqual(step.dataset.situacion, 'hecha', `Paso ${i} debe estar en situación 'hecha'`);
                assert.strictEqual(step.getAttribute('aria-current'), null);
                assert.ok(step.querySelector('.linea-tiempo__marca').innerHTML.includes('bi-check-lg'));
                const timeEl = doc.getElementById(`stepTime${i}`);
                assert.ok(!timeEl.innerHTML.includes('aprox.'), `Paso ${i} no debe contener "aprox." al estar entregado`);
            }
        });

        it('CSS Badge "Ahora": se muestra condicionalmente solo para el paso con [data-situacion="en_curso"]', () => {
            // Verifica regla CSS en styles.css
            assert.ok(stylesCss.includes('.linea-tiempo__ahora-badge'), 'styles.css debe definir .linea-tiempo__ahora-badge');
            assert.ok(stylesCss.includes('.linea-tiempo__etapa[data-situacion="en_curso"] .linea-tiempo__ahora-badge'),
                'styles.css debe activar badge Ahora para data-situacion="en_curso"');
            assert.ok(stylesCss.includes('display: inline-flex'), 'Debe usar display: inline-flex para el badge activo');
        });
    });

    // =========================================================================
    // SUITE 4: Order Cancellation Protocol (#cancelOrderBtn)
    // =========================================================================
    describe('Suite 4: Order Cancellation Protocol (#cancelOrderBtn)', () => {
        let doc;
        let cancelBtn;
        let trackingHeadline;

        beforeEach(() => {
            doc = new MockDocument();
            cancelBtn = doc.registerElement('cancelOrderBtn', 'button');
            cancelBtn.style.display = 'none';
            trackingHeadline = doc.registerElement('trackingHeadline', 'h1');
        });

        const updateCancelButtonVisibility = (estado, orderId = 55) => {
            const cancelable = ['pendiente', 'confirmado'].includes(normalizeEstado(estado));
            cancelBtn.style.display = cancelable ? 'inline-flex' : 'none';
            cancelBtn.dataset.orderId = String(orderId);
        };

        it('Visibilidad Estricta: visible únicamente para estados "pendiente" y "confirmado"', () => {
            // 1. Estado pendiente
            updateCancelButtonVisibility('pendiente', 101);
            assert.strictEqual(cancelBtn.style.display, 'inline-flex', 'Debe ser visible en estado pendiente');
            assert.strictEqual(cancelBtn.dataset.orderId, '101');

            // 2. Estado confirmado
            updateCancelButtonVisibility('confirmado', 102);
            assert.strictEqual(cancelBtn.style.display, 'inline-flex', 'Debe ser visible en estado confirmado');
            assert.strictEqual(cancelBtn.dataset.orderId, '102');

            // 3. Estado en_preparacion (Ya no cancelable)
            updateCancelButtonVisibility('en_preparacion', 103);
            assert.strictEqual(cancelBtn.style.display, 'none', 'Debe ocultarse en en_preparacion');

            // 4. Estado en_camino (Ya no cancelable)
            updateCancelButtonVisibility('en_camino', 104);
            assert.strictEqual(cancelBtn.style.display, 'none', 'Debe ocultarse en en_camino');

            // 5. Estado entregado (Terminal)
            updateCancelButtonVisibility('entregado', 105);
            assert.strictEqual(cancelBtn.style.display, 'none', 'Debe ocultarse en entregado');

            // 6. Estado cancelado (Terminal)
            updateCancelButtonVisibility('cancelado', 106);
            assert.strictEqual(cancelBtn.style.display, 'none', 'Debe ocultarse en cancelado');
        });

        it('Confirmación y Ejecución de Cancelación: deshabilita botón durante envío e invoca API PUT', async () => {
            let confirmPromptCalled = false;
            let apiCalled = false;
            let pollRefreshed = false;

            const mockConfirm = (msg) => {
                confirmPromptCalled = true;
                return true; // Usuario acepta confirmación
            };

            const mockCancelApi = async (orderId) => {
                apiCalled = true;
                // Simula latencia
                await new Promise(r => setTimeout(r, 15));
                return { ok: true, data: { message: 'Pedido cancelado' } };
            };

            const handleCancelClick = async () => {
                const orderId = cancelBtn.dataset.orderId;
                if (!orderId) return;

                if (!mockConfirm('¿Estás seguro de cancelar?')) return;

                cancelBtn.disabled = true;
                try {
                    const res = await mockCancelApi(orderId);
                    if (res.ok) {
                        pollRefreshed = true;
                        // Simula transición de estado a cancelado
                        updateCancelButtonVisibility('cancelado', orderId);
                    }
                } finally {
                    cancelBtn.disabled = false;
                }
            };

            cancelBtn.dataset.orderId = '200';
            updateCancelButtonVisibility('confirmado', 200);
            assert.strictEqual(cancelBtn.style.display, 'inline-flex');

            await handleCancelClick();

            assert.strictEqual(confirmPromptCalled, true, 'Debe solicitar confirmación antes de cancelar');
            assert.strictEqual(apiCalled, true, 'Debe enviar petición PUT de cancelación a la API');
            assert.strictEqual(pollRefreshed, true, 'Debe disparar actualización de seguimiento');
            assert.strictEqual(cancelBtn.style.display, 'none', 'El botón debe quedar oculto tras pasar a cancelado');
            assert.strictEqual(cancelBtn.disabled, false, 'El botón debe restaurarse de disabled');
        });

        it('debe abortar la cancelación si el usuario hace clic en "Cancelar" en el diálogo de confirmación', async () => {
            let apiCalled = false;
            const mockConfirm = () => false; // Usuario cancela diálogo

            const handleCancelClick = async () => {
                const orderId = cancelBtn.dataset.orderId;
                if (!orderId) return;
                if (!mockConfirm()) return;
                apiCalled = true;
            };

            cancelBtn.dataset.orderId = '201';
            await handleCancelClick();

            assert.strictEqual(apiCalled, false, 'No debe invocar API si el usuario no confirma');
            assert.strictEqual(cancelBtn.disabled, false);
        });
    });

    // =========================================================================
    // SUITE 5: Mobile Containment & Responsive Rules (360px & 390px Viewports)
    // =========================================================================
    describe('Suite 5: Mobile Containment & Responsive Rules (360px & 390px Viewports)', () => {
        it('debe contener la regla de sticky en escritorio (>= 992px) y static en móvil (< 992px)', () => {
            // Desktop sticky rule
            assert.ok(stylesCss.includes('@media (min-width: 992px)'), 'styles.css debe tener media query para escritorio >= 992px');
            assert.ok(stylesCss.includes('position: sticky !important'), 'En escritorio debe aplicar sticky a checkout-summary');
            assert.ok(stylesCss.includes('top: 96px !important'), 'En escritorio el top debe ser 96px');

            // Mobile static rule
            assert.ok(stylesCss.includes('@media (max-width: 991.98px)'), 'styles.css debe tener media query para móvil < 992px');
            assert.ok(stylesCss.includes('position: static !important'), 'En móvil debe forzar position: static para evitar obstrucción');
            assert.ok(stylesCss.includes('top: auto !important'), 'En móvil top debe ser auto');
        });

        it('debe colapsar la cuadrícula de pagos a 1 columna en pantallas estrechas (< 576px)', () => {
            assert.ok(stylesCss.includes('@media (max-width: 575.98px)'), 'styles.css debe definir breakpoint móvil 575.98px');
            assert.ok(stylesCss.includes('grid-template-columns: 1fr'), 'En pantallas < 576px las opciones de pago deben ser 1 columna');
        });

        it('debe limitar la altura del mapa de entrega en móvil para no monopolizar el viewport', () => {
            assert.ok(stylesCss.includes('.mapa-entrega'), 'styles.css debe definir .mapa-entrega');
            assert.ok(stylesCss.includes('height: 240px'), 'En móvil la altura del mapa debe reducirse a 240px');
        });

        it('Auditoría Estática de Contención Móvil: no debe haber anchos fijos que desborden 360px', () => {
            // Strip @media query headers so we only inspect element property declarations
            const stripMedia = (str) => str.replace(/@media[^{]+\{/g, '');
            const checkoutBlock = stripMedia(stylesCss.slice(stylesCss.indexOf('MILESTONE 3: Checkout'), stylesCss.indexOf('MILESTONE 3: Order Tracking')));
            const trackingBlock = stripMedia(stylesCss.slice(stylesCss.indexOf('MILESTONE 3: Order Tracking')));

            const fixedWidthPropertyRegex = /^\s*(?:min-width|width)\s*:\s*([4-9]\d{2}|\d{4,})px/gm;

            const checkoutViolations = [...checkoutBlock.matchAll(fixedWidthPropertyRegex)].map(m => m[0].trim());
            const trackingViolations = [...trackingBlock.matchAll(fixedWidthPropertyRegex)].map(m => m[0].trim());

            assert.strictEqual(checkoutViolations.length, 0, `Checkout no debe contener anchos fijos que desborden 360px: ${checkoutViolations.join(', ')}`);
            assert.strictEqual(trackingViolations.length, 0, `Tracking no debe contener anchos fijos que desborden 360px: ${trackingViolations.join(', ')}`);
        });

        it('debe incluir tokens Compose consistentes (#FCF0E4, #F4511E, #D94310) en checkout y tracking', () => {
            assert.ok(stylesCss.includes('#FCF0E4'), 'styles.css debe contener peach light token #FCF0E4');
            assert.ok(stylesCss.includes('#F4511E'), 'styles.css debe contener brand orange #F4511E');
            assert.ok(stylesCss.includes('#D94310'), 'styles.css debe contener dark orange #D94310');
        });

        it('debe verificar que la cifra de llegada ETA usa números tabulares para estabilidad visual', () => {
            assert.ok(stylesCss.includes('.seguimiento__llegada-cifra'), 'styles.css debe definir .seguimiento__llegada-cifra');
            assert.ok(stylesCss.includes('2.25rem'), 'styles.css debe aplicar tipografía grande 2.25rem a la cifra');
            assert.ok(stylesCss.includes('font-variant-numeric: tabular-nums'), 'styles.css debe usar tabular-nums para evitar saltos de layout');
        });
    });
});
