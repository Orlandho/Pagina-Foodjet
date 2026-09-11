import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Backend domain (CommonJS imported in ESM)
import orderStatusBackend from '../../backend/src/domain/orderStatus.js';
import paymentBackend from '../../backend/src/domain/payment.js';
import userValidationBackend from '../../backend/src/domain/userValidation.js';

// Frontend domain (ESM)
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
