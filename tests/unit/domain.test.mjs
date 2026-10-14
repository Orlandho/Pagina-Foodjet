import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Backend domain (CommonJS imported in ESM)
import orderStatusBackend from '../../backend/src/domain/orderStatus.js';
import paymentBackend from '../../backend/src/domain/payment.js';
import userValidationBackend from '../../backend/src/domain/userValidation.js';
import mapsConfigBackend from '../../backend/src/domain/mapsConfig.js';

// Frontend domain (ESM)
import {
    cargarGoogleMaps,
    siRechazaLaKey,
    keyFueRechazada,
    _resetCargaParaPruebas
} from '../../frontend/js/googleMaps.js';
import { buildOrderPayload } from '../../frontend/js/domain/checkout.js';
import {
    normalizeEstado as normalizeEstadoFront,
    isTerminal as isTerminalFront,
    getTrackingViewModel,
    deriveSubtotal,
    getEstadoBadge
} from '../../frontend/js/domain/orderStatus.js';

describe('White-Box Unit Tests - Order Status Domain (Backend)', () => {
    it('debe normalizar estados con acentos y mayúsculas correctamente', () => {
        assert.equal(orderStatusBackend.normalizeEstado('En preparación'), 'en_preparacion');
        assert.equal(orderStatusBackend.normalizeEstado('ENTREGADO'), 'entregado');
        assert.equal(orderStatusBackend.normalizeEstado(null), '');
        assert.equal(orderStatusBackend.normalizeEstado(undefined), '');
    });

    it('debe validar transiciones permitidas del flujo', () => {
        assert.equal(orderStatusBackend.isValidTransition('pendiente', 'confirmado'), true);
        assert.equal(orderStatusBackend.isValidTransition('confirmado', 'en_preparacion'), true);
        assert.equal(orderStatusBackend.isValidTransition('en_preparacion', 'en_camino'), true);
        assert.equal(orderStatusBackend.isValidTransition('en_camino', 'entregado'), true);
    });

    it('debe rechazar transiciones inválidas o saltos de estado', () => {
        assert.equal(orderStatusBackend.isValidTransition('pendiente', 'entregado'), false);
        assert.equal(orderStatusBackend.isValidTransition('entregado', 'pendiente'), false);
        assert.equal(orderStatusBackend.isValidTransition('cancelado', 'confirmado'), false);
        assert.equal(orderStatusBackend.isValidTransition('invalid_state', 'confirmado'), false);
    });

    it('debe permitir cancelación solo en estados cancelables', () => {
        assert.equal(orderStatusBackend.isValidTransition('pendiente', 'cancelado'), true);
        assert.equal(orderStatusBackend.isValidTransition('confirmado', 'cancelado'), true);
        assert.equal(orderStatusBackend.isValidTransition('en_preparacion', 'cancelado'), false);
        assert.equal(orderStatusBackend.isValidTransition('entregado', 'cancelado'), false);
    });

    it('debe detectar estados terminales', () => {
        assert.equal(orderStatusBackend.isTerminal('entregado'), true);
        assert.equal(orderStatusBackend.isTerminal('cancelado'), true);
        assert.equal(orderStatusBackend.isTerminal('en_camino'), false);
        assert.equal(orderStatusBackend.nextEstado('entregado'), null);
    });
});

describe('White-Box Unit Tests - Payment Domain (Backend)', () => {
    it('debe validar métodos de pago soportados', () => {
        assert.equal(paymentBackend.isMetodoValido('cash'), true);
        assert.equal(paymentBackend.isMetodoValido('CARD'), true);
        assert.equal(paymentBackend.isMetodoValido('wallet'), true);
        assert.equal(paymentBackend.isMetodoValido('bitcoin'), false);
        assert.equal(paymentBackend.isMetodoValido(null), false);
    });

    it('debe resolver estado inicial del pago y del pedido según método', () => {
        assert.equal(paymentBackend.resolvePaymentStatus('cash'), 'pendiente');
        assert.equal(paymentBackend.resolvePaymentStatus('card'), 'completado');
        assert.equal(paymentBackend.resolveInitialOrderStatus('completado'), 'confirmado');
        assert.equal(paymentBackend.resolveInitialOrderStatus('pendiente'), 'pendiente');
    });
});

describe('White-Box Unit Tests - User Validation (Backend)', () => {
    it('debe rechazar registros con datos incompletos', () => {
        const res = userValidationBackend.validateRegistrationData({});
        assert.equal(res.isValid, false);
        assert.equal(res.status, 400);
    });

    it('debe validar formato exacto de teléfono de 9 dígitos', () => {
        const invalidPhone = userValidationBackend.validateRegistrationData({
            nombre: 'Juan',
            email: 'juan@mail.com',
            telefono: '12345',
            password: 'Pass123!'
        });
        assert.equal(invalidPhone.isValid, false);

        const validData = userValidationBackend.validateRegistrationData({
            nombre: 'Juan',
            email: 'juan@mail.com',
            telefono: '987654321',
            password: 'Pass123!'
        });
        assert.equal(validData.isValid, true);
    });
});

describe('White-Box Unit Tests - Frontend Domain', () => {
    it('debe normalizar y calcular viewModel de tracking', () => {
        assert.equal(normalizeEstadoFront('En preparación'), 'en_preparacion');
        assert.equal(isTerminalFront('entregado'), true);

        const vm = getTrackingViewModel('en_camino');
        assert.equal(vm.estado, 'en_camino');
        assert.equal(vm.activeIndex, 2);
        assert.equal(vm.terminal, false);
        assert.equal(vm.cancelled, false);
    });

    it('debe derivar subtotal descontando impuestos y envío', () => {
        const subtotal = deriveSubtotal({ total: 100, impuestos: 18, costo_envio: 10 });
        assert.equal(subtotal, 72);

        const fallback = deriveSubtotal({});
        assert.equal(fallback, 0);
    });

    it('debe obtener badge correcto según estado', () => {
        const badge = getEstadoBadge('confirmado');
        assert.equal(badge.label, 'Confirmado');
        assert.ok(badge.color.includes('bg-info'));
    });

    it('debe construir el payload de pedido correctamente en frontend', () => {
        const cart = { '10': 2, '25': 1 };
        const getProduct = (id) => ({ id: Number(id), restaurante_id: 5 });
        const payload = buildOrderPayload(cart, getProduct, 'wallet', 2);

        assert.equal(payload.metodo_pago, 'wallet');
        assert.equal(payload.restaurante_id, 5);
        assert.equal(payload.direccion_entrega_id, 2);
        assert.equal(payload.items.length, 2);
        assert.deepEqual(payload.items[0], { productId: 10, cantidad: 2 });
    });
});

describe('White-Box Unit Tests - Google Maps Config Domain (Backend)', () => {
    it('debe resolver ambas claves cuando ambas están configuradas', () => {
        const res = mapsConfigBackend.resolveGoogleMapsKeys({
            GOOGLE_MAPS_API_KEY: 'clave-primaria',
            GOOGLE_MAPS_API_KEY_SECUNDARIA: 'clave-secundaria'
        });
        assert.equal(res.googleMapsApiKey, 'clave-primaria');
        assert.deepEqual(res.googleMapsApiKeys, ['clave-primaria', 'clave-secundaria']);
    });

    it('debe usar clave primaria si la secundaria no está configurada', () => {
        const res = mapsConfigBackend.resolveGoogleMapsKeys({
            GOOGLE_MAPS_API_KEY: 'clave-primaria',
            GOOGLE_MAPS_API_KEY_SECUNDARIA: ''
        });
        assert.equal(res.googleMapsApiKey, 'clave-primaria');
        assert.deepEqual(res.googleMapsApiKeys, ['clave-primaria']);
    });

    it('debe usar clave secundaria como fallback si la primaria no existe', () => {
        const res = mapsConfigBackend.resolveGoogleMapsKeys({
            GOOGLE_MAPS_API_KEY: '',
            GOOGLE_MAPS_API_KEY_SECUNDARIA: 'clave-secundaria'
        });
        assert.equal(res.googleMapsApiKey, 'clave-secundaria');
        assert.deepEqual(res.googleMapsApiKeys, ['clave-secundaria']);
    });

    it('debe retornar null y arreglo vacío si ninguna clave está configurada', () => {
        const res = mapsConfigBackend.resolveGoogleMapsKeys({});
        assert.equal(res.googleMapsApiKey, null);
        assert.deepEqual(res.googleMapsApiKeys, []);
    });

    it('debe deduplicar y limpiar espacios en blanco de las claves', () => {
        const res = mapsConfigBackend.resolveGoogleMapsKeys({
            GOOGLE_MAPS_API_KEY: '  misma-clave  ',
            GOOGLE_MAPS_API_KEY_SECUNDARIA: 'misma-clave'
        });
        assert.equal(res.googleMapsApiKey, 'misma-clave');
        assert.deepEqual(res.googleMapsApiKeys, ['misma-clave']);
    });

    it('debe manejar valores no string o undefined de forma segura', () => {
        const res = mapsConfigBackend.resolveGoogleMapsKeys({
            GOOGLE_MAPS_API_KEY: null,
            GOOGLE_MAPS_API_KEY_SECUNDARIA: undefined
        });
        assert.equal(res.googleMapsApiKey, null);
        assert.deepEqual(res.googleMapsApiKeys, []);
    });
});

describe('White-Box Unit Tests - Google Maps Cascading Loader (Frontend)', () => {
    let originalWindow;
    let originalDocument;

    function setupMockDom(scriptBehavior) {
        _resetCargaParaPruebas();
        const scripts = [];

        const mockDocument = {
            createElement: (tag) => {
                const el = {
                    tagName: tag.toUpperCase(),
                    attributes: {},
                    setAttribute: (k, v) => { el.attributes[k] = v; },
                    remove: () => {
                        const idx = scripts.indexOf(el);
                        if (idx !== -1) scripts.splice(idx, 1);
                    }
                };
                return el;
            },
            querySelectorAll: () => [...scripts],
            head: {
                appendChild: (el) => {
                    scripts.push(el);
                    queueMicrotask(() => {
                        if (typeof scriptBehavior === 'function') {
                            scriptBehavior(el, mockWindow);
                        }
                    });
                }
            }
        };

        const mockWindow = {
            google: null,
            document: mockDocument
        };

        globalThis.window = mockWindow;
        globalThis.document = mockDocument;
        return { mockWindow, scripts };
    }

    function teardownMockDom() {
        _resetCargaParaPruebas();
        if (originalWindow !== undefined) {
            globalThis.window = originalWindow;
        } else {
            delete globalThis.window;
        }
        if (originalDocument !== undefined) {
            globalThis.document = originalDocument;
        } else {
            delete globalThis.document;
        }
    }

    it('debe cargar exitosamente con la clave primaria sin intentar la secundaria', async () => {
        originalWindow = globalThis.window;
        originalDocument = globalThis.document;
        try {
            const { scripts } = setupMockDom((scriptEl, win) => {
                win.google = { maps: { importLibrary: async () => ({}) } };
                win.__foodjetMapsListo?.();
            });

            await cargarGoogleMaps(['key-1', 'key-2']);
            assert.equal(scripts.length, 1);
            assert.ok(scripts[0].src.includes('key=key-1'));
            assert.equal(keyFueRechazada(), false);
        } finally {
            teardownMockDom();
        }
    });

    it('debe reintentar transparentemente con la clave secundaria si la primaria dispara gm_authFailure', async () => {
        originalWindow = globalThis.window;
        originalDocument = globalThis.document;
        try {
            let intento = 0;
            setupMockDom((scriptEl, win) => {
                intento++;
                if (intento === 1) {
                    win.gm_authFailure?.();
                } else if (intento === 2) {
                    win.google = { maps: { importLibrary: async () => ({}) } };
                    win.__foodjetMapsListo?.();
                }
            });

            await cargarGoogleMaps(['key-invalida', 'key-valida']);
            assert.equal(intento, 2);
            assert.equal(keyFueRechazada(), false);
        } finally {
            teardownMockDom();
        }
    });

    it('debe reintentar con la secundaria si la primaria sufre un error de red (onerror)', async () => {
        originalWindow = globalThis.window;
        originalDocument = globalThis.document;
        try {
            let intento = 0;
            setupMockDom((scriptEl, win) => {
                intento++;
                if (intento === 1) {
                    scriptEl.onerror?.(new Error('Network error'));
                } else if (intento === 2) {
                    win.google = { maps: { importLibrary: async () => ({}) } };
                    win.__foodjetMapsListo?.();
                }
            });

            await cargarGoogleMaps(['key-red-caida', 'key-segunda']);
            assert.equal(intento, 2);
            assert.equal(keyFueRechazada(), false);
        } finally {
            teardownMockDom();
        }
    });

    it('debe notificar rechazo y disparar callbacks si ambas claves fallan', async () => {
        originalWindow = globalThis.window;
        originalDocument = globalThis.document;
        try {
            let rechazoNotificado = false;
            let intentos = 0;
            setupMockDom((scriptEl, win) => {
                intentos++;
                win.gm_authFailure?.();
            });

            siRechazaLaKey(() => {
                rechazoNotificado = true;
            });

            await assert.rejects(
                async () => {
                    await cargarGoogleMaps(['key-mala-1', 'key-mala-2']);
                },
                /Google Maps/
            );

            assert.equal(intentos, 2);
            assert.equal(keyFueRechazada(), true);
            assert.equal(rechazoNotificado, true);
        } finally {
            teardownMockDom();
        }
    });

    it('debe rechazar de inmediato si la lista de claves está vacía', async () => {
        originalWindow = globalThis.window;
        originalDocument = globalThis.document;
        try {
            setupMockDom();
            await assert.rejects(
                async () => {
                    await cargarGoogleMaps([]);
                },
                /No hay API key/
            );
        } finally {
            teardownMockDom();
        }
    });

    it('debe aceptar opciones en formato de objeto con apiKey y apiKeys', async () => {
        originalWindow = globalThis.window;
        originalDocument = globalThis.document;
        try {
            let intento = 0;
            setupMockDom((scriptEl, win) => {
                intento++;
                if (intento === 1) {
                    win.gm_authFailure?.();
                } else if (intento === 2) {
                    win.google = { maps: { importLibrary: async () => ({}) } };
                    win.__foodjetMapsListo?.();
                }
            });

            await cargarGoogleMaps({ apiKey: 'key-backup', apiKeys: ['key-primary'] });
            assert.equal(intento, 2);
            assert.equal(keyFueRechazada(), false);
        } finally {
            teardownMockDom();
        }
    });
});

