import assert from 'node:assert/strict';
import { validateCoupon, buildOrderPayload } from '../../../frontend/js/domain/checkout.js';
import { faltaMarcarUbicacion } from '../../../frontend/js/domain/ubicacion.js';
import { getTrackingViewModel, isTerminal } from '../../../frontend/js/domain/orderStatus.js';

console.log('====================================================');
console.log('REVIEWER M3-2 ADVERSARIAL STRESS-TESTING');
console.log('====================================================');

// 1. Coupon Adversarial Inputs
console.log('\n[1] Stress-Testing Coupon Validation:');
const couponAttacks = [
    { input: null, expectedValid: false },
    { input: undefined, expectedValid: false },
    { input: '', expectedValid: false },
    { input: '    ', expectedValid: false },
    { input: '\t\n', expectedValid: false },
    { input: "' OR '1'='1", expectedValid: false },
    { input: '<script>alert(1)</script>', expectedValid: false },
    { input: 12345, expectedValid: false },
    { input: {}, expectedValid: false },
    { input: [], expectedValid: false },
    { input: true, expectedValid: false },
    { input: '  pRuEbAcUpOn  ', expectedValid: true, expectedId: 1 },
    { input: 'FOODJET20', expectedValid: true, expectedId: 2 },
    { input: 'foodjet20', expectedValid: true, expectedId: 2 },
    { input: 'FOODJET10', expectedValid: false }
];

couponAttacks.forEach((atk, idx) => {
    const res = validateCoupon(atk.input);
    assert.equal(res.valid, atk.expectedValid, `Attack #${idx} failed validity check: ${atk.input}`);
    if (atk.expectedValid) {
        assert.equal(res.coupon.id, atk.expectedId, `Attack #${idx} resolved wrong coupon ID`);
    }
});
console.log(`Passed ${couponAttacks.length}/${couponAttacks.length} coupon attack scenarios!`);

// 2. buildOrderPayload Boundary Testing
console.log('\n[2] Stress-Testing buildOrderPayload:');
const emptyCart = {};
const mockGetProduct = (id) => id ? ({ id: Number(id), restaurante_id: 10 }) : undefined;

const p1 = buildOrderPayload(emptyCart, mockGetProduct, 'cash');
assert.deepEqual(p1.items, []);
assert.equal(p1.restaurante_id, 1);
assert.equal(p1.metodo_pago, 'cash');
assert.equal(p1.direccion_entrega_id, 1);
assert.equal(p1.cupon_id, undefined);

const normalCart = { '10': 3, '20': 1 };
const p2 = buildOrderPayload(normalCart, mockGetProduct, 'wallet', 99, 2);
assert.equal(p2.items.length, 2);
assert.equal(p2.restaurante_id, 10);
assert.equal(p2.metodo_pago, 'wallet');
assert.equal(p2.direccion_entrega_id, 99);
assert.equal(p2.cupon_id, 2);

// Check string vs number conversion for cupon_id
const p3 = buildOrderPayload(normalCart, mockGetProduct, 'card', 99, '2');
assert.strictEqual(p3.cupon_id, 2);

console.log('Passed all buildOrderPayload boundary scenarios!');

// 3. Google Maps Degradation Logic
console.log('\n[3] Stress-Testing Google Maps Offline/Degradation:');
// When map is NOT available, faltaMarcarUbicacion MUST be false (no blocking checkout)
assert.equal(faltaMarcarUbicacion({ mapaDisponible: false, coords: null }), false);
assert.equal(faltaMarcarUbicacion({ mapaDisponible: false, coords: { lat: -12.0464, lng: -77.0428 } }), false);

// When map IS available, coords are required
assert.equal(faltaMarcarUbicacion({ mapaDisponible: true, coords: null }), true);
assert.equal(faltaMarcarUbicacion({ mapaDisponible: true, coords: { lat: 999, lng: 999 } }), true);
assert.equal(faltaMarcarUbicacion({ mapaDisponible: true, coords: { lat: -12.0464, lng: -77.0428 } }), false);
console.log('Passed all map degradation assertions!');

// 4. Order Status Tracking State Machine
console.log('\n[4] Stress-Testing Tracking State Machine:');
const estados = ['pendiente', 'confirmado', 'en_preparacion', 'en_camino', 'entregado', 'cancelado'];
estados.forEach(est => {
    const vm = getTrackingViewModel(est);
    assert.ok(vm.title, `State ${est} missing title`);
    assert.ok(vm.iconClass, `State ${est} missing iconClass`);
    const term = isTerminal(est);
    assert.equal(vm.terminal, term, `State ${est} terminal flag mismatch`);
    if (est === 'cancelado') {
        assert.equal(vm.cancelled, true);
    }
});
console.log('Passed all tracking status state machine assertions!');

console.log('====================================================');
console.log('ALL ADVERSARIAL ATTACKS MITIGATED & PASSED');
console.log('====================================================');
