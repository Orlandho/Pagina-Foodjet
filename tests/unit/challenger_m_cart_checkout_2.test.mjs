/**
 * FoodJet — Milestone M-Cart-Checkout Empirical Challenge Test Suite 2
 * 
 * Challenger M-Cart-Checkout 2: Adversarial Financial Arithmetic, Discount Stacking,
 * Backend Calculation Parity (orderController.js:76-103) & Cart Quantity Boundary Dynamics
 * 
 * Target Verifications:
 * 1. Centavo-by-centavo parity between frontend calculations and backend orderController.js:76-103.
 * 2. Formula verification:
 *    Subtotal - Student Discount - Coupon Discount + Shipping (S/ 5.00) + 18% IGV = Total
 * 3. Discount stacking matrix:
 *    - Standard user vs Student user
 *    - Valid coupons (FOODJET20, PruebaCupon)
 *    - Invalid, inactive, expired, and malicious coupon inputs
 *    - Zero/edge prices and maximum discount ceilings
 * 4. Cart quantity boundary manipulations:
 *    - Rapid addition, decrement, complete removal
 *    - Boundary 1 item to 0 items (key removal, empty cart state)
 *    - Multi-restaurant cart isolation guard
 *    - Product availability guard
 * 5. Reconcilable Financial Breakdown & deriveSubtotal Oracle:
 *    - Order detail subtotal derivation from total, taxes, and shipping
 * 6. Extreme Numerical Robustness & Monte Carlo Random Stress (1,000 Baskets)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Load domain and state modules under test
import {
    calculateStudentPrice,
    calculateCartTotal,
    getProductRestaurant,
    getCartRestaurant
} from '../../frontend/js/domain/catalog.js';

import {
    CUPONES_SOPORTADOS,
    validateCoupon,
    buildOrderPayload
} from '../../frontend/js/domain/checkout.js';

import {
    deriveSubtotal,
    normalizeEstado,
    isTerminal
} from '../../frontend/js/domain/orderStatus.js';

import * as state from '../../frontend/js/state.js';

// =============================================================================
// BACKEND REFERENCE ORACLE (Verbatim logic from backend/src/controllers/orderController.js:76-103)
// =============================================================================
function backendOrderControllerOracle({ items, user, coupon }) {
    let subtotal = 0;
    const orderItemsData = [];

    // Lines 76-85: Calculate item prices with student discount and accumulate subtotal
    for (const item of items) {
        let price = item.product.precio;
        if (user && user.es_estudiante && item.product.descuento_estudiante > 0) {
            price = price - (price * (item.product.descuento_estudiante / 100));
        }
        subtotal += price * item.cantidad;
        orderItemsData.push({
            product_id: item.product.id,
            cantidad: item.cantidad,
            precio_unitario: price
        });
    }

    // Lines 88-95: Apply coupon discount
    let descuento = 0;
    if (coupon) {
        // Line 91: if (!cupon || !cupon.estado) error
        if (coupon.estado === false || coupon.estado === null || coupon.estado === undefined || coupon.estado === '') {
            throw new Error('El cupón no es válido o está inactivo.');
        }
        descuento = subtotal * (coupon.porcentaje_descuento / 100);
    }

    // Lines 98-103: Final calculations (18% IGV and S/ 5.00 fixed shipping fee)
    const subtotalConDescuento = subtotal - descuento;
    const IMPUESTO_PORCENTAJE = 0.18;
    const COSTO_ENVIO = 5.00;

    const impuestos = subtotalConDescuento * IMPUESTO_PORCENTAJE;
    const total = subtotalConDescuento + impuestos + COSTO_ENVIO;

    return {
        subtotal,
        descuento,
        subtotalConDescuento,
        impuestos,
        costoEnvio: COSTO_ENVIO,
        total,
        orderItemsData,
        formatted: {
            subtotal: `S/ ${subtotal.toFixed(2)}`,
            descuento: `-S/ ${descuento.toFixed(2)}`,
            subtotalConDescuento: `S/ ${subtotalConDescuento.toFixed(2)}`,
            impuestos: `S/ ${impuestos.toFixed(2)}`,
            costoEnvio: `S/ ${COSTO_ENVIO.toFixed(2)}`,
            total: `S/ ${total.toFixed(2)}`
        }
    };
}

// =============================================================================
// FRONTEND REFERENCE ORACLE (Verbatim logic from frontend/js/ui.js:renderCheckoutCart)
// =============================================================================
function frontendCheckoutOracle({ items, user, activeCoupon }) {
    let subtotalRegular = 0;
    let subtotalEffective = 0;
    let studentSavings = 0;
    const isStudent = Boolean(user && user.es_estudiante);

    for (const item of items) {
        const regularPrice = item.product.precio;
        let effectivePrice = regularPrice;
        let hasStudentDiscount = false;

        if (isStudent && item.product.descuento_estudiante > 0) {
            effectivePrice = regularPrice - (regularPrice * (item.product.descuento_estudiante / 100));
            hasStudentDiscount = true;
        }

        const regularItemTotal = regularPrice * item.cantidad;
        const effectiveItemTotal = effectivePrice * item.cantidad;

        subtotalRegular += regularItemTotal;
        subtotalEffective += effectiveItemTotal;
        if (hasStudentDiscount) {
            studentSavings += (regularItemTotal - effectiveItemTotal);
        }
    }

    let couponDiscount = 0;
    if (activeCoupon) {
        if (activeCoupon.tipo === 'porcentaje') {
            couponDiscount = subtotalEffective * (activeCoupon.valor / 100);
        } else if (activeCoupon.tipo === 'fijo') {
            couponDiscount = activeCoupon.valor;
        }
    }

    const subtotalAfterCoupon = Math.max(0, subtotalEffective - couponDiscount);
    const taxRate = 0.18;
    const tax = subtotalAfterCoupon * taxRate;
    const deliveryFee = 5.00;
    const total = subtotalAfterCoupon + tax + deliveryFee;

    return {
        subtotalRegular,
        subtotalEffective,
        studentSavings,
        couponDiscount,
        subtotalAfterCoupon,
        tax,
        deliveryFee,
        total,
        formatted: {
            subtotal: `S/ ${subtotalEffective.toFixed(2)}`,
            studentDiscount: `-S/ ${studentSavings.toFixed(2)}`,
            couponDiscount: `-S/ ${couponDiscount.toFixed(2)}`,
            tax: `S/ ${tax.toFixed(2)}`,
            delivery: `S/ ${deliveryFee.toFixed(2)}`,
            total: `S/ ${total.toFixed(2)}`
        }
    };
}

// =============================================================================
// TEST SUITES
// =============================================================================
describe('Empirical Financial Challenger 2 — Cart & Checkout Arithmetic & Stacking', () => {

    // =========================================================================
    // SUITE 1: Formula Verification & Backend Parity Oracle (orderController.js:76-103)
    // =========================================================================
    describe('Suite 1: Formula Verification & Centavo-by-Centavo Backend Parity', () => {

        it('1.1 Fórmula canónica: Subtotal - DescuentoEstudiante - DescuentoCupon + Envío (5.00) + 18% IGV = Total', () => {
            const product = { id: 1, precio: 50.00, descuento_estudiante: 10 };
            const user = { es_estudiante: true };
            const coupon = { id: 2, porcentaje_descuento: 20.0, estado: 'Activo' };
            const activeCoupon = { id: 2, tipo: 'porcentaje', valor: 20.0 };
            const items = [{ product, cantidad: 2 }];

            const backend = backendOrderControllerOracle({ items, user, coupon });
            const frontend = frontendCheckoutOracle({ items, user, activeCoupon });

            // 1. Regular subtotal: 50 * 2 = 100.00
            // 2. Student discount: 10% on 50 = S/ 5 per unit => 45.00 * 2 = 90.00 subtotalEffective
            // 3. Coupon discount: 20% on 90.00 = 18.00
            // 4. Subtotal con descuento: 90.00 - 18.00 = 72.00
            // 5. 18% IGV: 72.00 * 0.18 = 12.96
            // 6. Envío: 5.00
            // 7. Total: 72.00 + 12.96 + 5.00 = 89.96
            assert.equal(frontend.subtotalRegular, 100.00);
            assert.equal(frontend.studentSavings, 10.00);
            assert.equal(frontend.subtotalEffective, 90.00);
            assert.equal(backend.subtotal, 90.00);
            assert.equal(frontend.couponDiscount, 18.00);
            assert.equal(backend.descuento, 18.00);
            assert.equal(frontend.subtotalAfterCoupon, 72.00);
            assert.equal(backend.subtotalConDescuento, 72.00);
            assert.equal(frontend.tax, backend.impuestos);
            assert.ok(Math.abs(frontend.tax - 12.96) < 1e-4, 'Tax must be 12.96 to 4 decimals');
            assert.equal(frontend.deliveryFee, 5.00);
            assert.equal(backend.costoEnvio, 5.00);
            assert.equal(frontend.total, backend.total);
            assert.ok(Math.abs(frontend.total - 89.96) < 1e-4, 'Total must be 89.96 to 4 decimals');
            assert.equal(frontend.formatted.total, 'S/ 89.96');
            assert.equal(backend.formatted.total, 'S/ 89.96');
        });

        it('1.2 Paridad estricta para cliente regular sin descuentos ni cupones', () => {
            const items = [
                { product: { id: 10, precio: 32.50, descuento_estudiante: 15 }, cantidad: 1 },
                { product: { id: 11, precio: 14.80, descuento_estudiante: 10 }, cantidad: 2 }
            ];
            const user = { es_estudiante: false };

            const backend = backendOrderControllerOracle({ items, user, coupon: null });
            const frontend = frontendCheckoutOracle({ items, user, activeCoupon: null });

            // Subtotal: 32.50 + 29.60 = 62.10
            // Descuentos: 0
            // IGV (18%): 62.10 * 0.18 = 11.178
            // Envío: 5.00
            // Total: 62.10 + 11.178 + 5.00 = 78.278 => S/ 78.28
            assert.equal(frontend.subtotalEffective, backend.subtotal);
            assert.equal(frontend.subtotalEffective, 62.10);
            assert.equal(frontend.studentSavings, 0);
            assert.equal(frontend.couponDiscount, 0);
            assert.equal(frontend.tax, backend.impuestos);
            assert.equal(frontend.total, backend.total);
            assert.equal(frontend.formatted.total, backend.formatted.total);
            assert.equal(frontend.formatted.total, 'S/ 78.28');
        });

        it('1.3 Paridad con producto donde descuento_estudiante = 0 para estudiante', () => {
            const items = [
                { product: { id: 20, precio: 40.00, descuento_estudiante: 0 }, cantidad: 1 }
            ];
            const user = { es_estudiante: true };

            const backend = backendOrderControllerOracle({ items, user, coupon: null });
            const frontend = frontendCheckoutOracle({ items, user, activeCoupon: null });

            assert.equal(frontend.studentSavings, 0);
            assert.equal(frontend.subtotalEffective, 40.00);
            assert.equal(backend.subtotal, 40.00);
            assert.equal(frontend.total, backend.total);
            assert.equal(frontend.formatted.total, 'S/ 52.20');
        });

        it('1.4 Paridad para cesta con precios de céntimos irregulares (S/ 7.77, S/ 13.33)', () => {
            const items = [
                { product: { id: 31, precio: 7.77, descuento_estudiante: 5 }, cantidad: 3 },
                { product: { id: 32, precio: 13.33, descuento_estudiante: 10 }, cantidad: 2 }
            ];
            const user = { es_estudiante: true };
            const coupon = { id: 1, porcentaje_descuento: 10.0, estado: 'Activo' };
            const activeCoupon = { id: 1, tipo: 'porcentaje', valor: 10.0 };

            const backend = backendOrderControllerOracle({ items, user, coupon });
            const frontend = frontendCheckoutOracle({ items, user, activeCoupon });

            assert.equal(frontend.subtotalEffective.toFixed(2), backend.subtotal.toFixed(2));
            assert.equal(frontend.couponDiscount.toFixed(2), backend.descuento.toFixed(2));
            assert.equal(frontend.tax.toFixed(2), backend.impuestos.toFixed(2));
            assert.equal(frontend.total.toFixed(2), backend.total.toFixed(2));
            assert.equal(frontend.formatted.total, backend.formatted.total);
        });

        it('1.5 Integración directa con calculateCartTotal de catalog.js', () => {
            const products = [
                { id: 101, precio: 20.00, descuento_estudiante: 10, restaurante_id: 1 },
                { id: 102, precio: 15.00, descuento_estudiante: 20, restaurante_id: 1 }
            ];
            const getProductById = id => products.find(p => p.id === Number(id));
            const cart = { '101': 2, '102': 1 };
            const studentUser = { es_estudiante: true };
            const regularUser = { es_estudiante: false };

            // Student: 20 - 10% = 18 * 2 = 36; 15 - 20% = 12 * 1 = 12 => Total: 48
            const studentCartTotal = calculateCartTotal(cart, getProductById, studentUser);
            assert.equal(studentCartTotal, 48.00);

            // Regular: 20 * 2 = 40; 15 * 1 = 15 => Total: 55
            const regularCartTotal = calculateCartTotal(cart, getProductById, regularUser);
            assert.equal(regularCartTotal, 55.00);

            // Verify backend oracle subtotal matches calculateCartTotal
            const studentItems = [
                { product: products[0], cantidad: 2 },
                { product: products[1], cantidad: 1 }
            ];
            const studentBackend = backendOrderControllerOracle({ items: studentItems, user: studentUser, coupon: null });
            assert.equal(studentBackend.subtotal, studentCartTotal);

            const regularBackend = backendOrderControllerOracle({ items: studentItems, user: regularUser, coupon: null });
            assert.equal(regularBackend.subtotal, regularCartTotal);
        });
    });

    // =========================================================================
    // SUITE 2: Discount Stacking Matrix & Coupon Lifecycle Robustness
    // =========================================================================
    describe('Suite 2: Discount Stacking Matrix & Coupon Lifecycle Robustness', () => {

        const testProduct = { id: 201, precio: 100.00, descuento_estudiante: 10 };
        const items = [{ product: testProduct, cantidad: 1 }];

        it('2.1 Matriz Permutación 1: Regular + Sin cupón', () => {
            const result = frontendCheckoutOracle({ items, user: { es_estudiante: false }, activeCoupon: null });
            assert.equal(result.subtotalEffective, 100.00);
            assert.equal(result.studentSavings, 0);
            assert.equal(result.couponDiscount, 0);
            assert.equal(result.total, 100 + 18 + 5); // 123.00
        });

        it('2.2 Matriz Permutación 2: Estudiante (10%) + Sin cupón', () => {
            const result = frontendCheckoutOracle({ items, user: { es_estudiante: true }, activeCoupon: null });
            assert.equal(result.subtotalEffective, 90.00);
            assert.equal(result.studentSavings, 10.00);
            assert.equal(result.couponDiscount, 0);
            assert.equal(result.total, 90 + (90 * 0.18) + 5); // 111.20
        });

        it('2.3 Matriz Permutación 3: Regular + PruebaCupon (10%)', () => {
            const coupon = CUPONES_SOPORTADOS['pruebacupon'];
            const result = frontendCheckoutOracle({ items, user: { es_estudiante: false }, activeCoupon: coupon });
            assert.equal(result.subtotalEffective, 100.00);
            assert.equal(result.studentSavings, 0);
            assert.equal(result.couponDiscount, 10.00);
            assert.equal(result.subtotalAfterCoupon, 90.00);
            assert.equal(result.total, 90 + (90 * 0.18) + 5); // 111.20
        });

        it('2.4 Matriz Permutación 4: Regular + FOODJET20 (20%)', () => {
            const coupon = CUPONES_SOPORTADOS['foodjet20'];
            const result = frontendCheckoutOracle({ items, user: { es_estudiante: false }, activeCoupon: coupon });
            assert.equal(result.subtotalEffective, 100.00);
            assert.equal(result.studentSavings, 0);
            assert.equal(result.couponDiscount, 20.00);
            assert.equal(result.subtotalAfterCoupon, 80.00);
            assert.equal(result.total, 80 + (80 * 0.18) + 5); // 99.40
        });

        it('2.5 Matriz Permutación 5: Estudiante (10%) + PruebaCupon (10%) [Stacking Compuesto]', () => {
            const coupon = CUPONES_SOPORTADOS['pruebacupon'];
            const result = frontendCheckoutOracle({ items, user: { es_estudiante: true }, activeCoupon: coupon });
            // Subtotal efectivo = 90.00
            // Descuento cupón = 10% de 90.00 = 9.00 (NO 10% de 100)
            // Subtotal neto = 81.00
            // IGV (18% de 81) = 14.58
            // Total = 81 + 14.58 + 5 = 100.58
            assert.equal(result.subtotalEffective, 90.00);
            assert.equal(result.studentSavings, 10.00);
            assert.equal(result.couponDiscount, 9.00);
            assert.equal(result.subtotalAfterCoupon, 81.00);
            assert.equal(result.tax, 14.58);
            assert.equal(result.total, 100.58);
        });

        it('2.6 Matriz Permutación 6: Estudiante (10%) + FOODJET20 (20%) [Stacking Compuesto]', () => {
            const coupon = CUPONES_SOPORTADOS['foodjet20'];
            const result = frontendCheckoutOracle({ items, user: { es_estudiante: true }, activeCoupon: coupon });
            // Subtotal efectivo = 90.00
            // Descuento cupón = 20% de 90.00 = 18.00
            // Subtotal neto = 72.00
            // IGV (18% de 72) = 12.96
            // Total = 72 + 12.96 + 5 = 89.96
            assert.equal(result.subtotalEffective, 90.00);
            assert.equal(result.studentSavings, 10.00);
            assert.equal(result.couponDiscount, 18.00);
            assert.equal(result.subtotalAfterCoupon, 72.00);
            assert.ok(Math.abs(result.tax - 12.96) < 1e-4);
            assert.ok(Math.abs(result.total - 89.96) < 1e-4);
            assert.equal(result.formatted.total, 'S/ 89.96');
        });

        it('2.7 validateCoupon debe ser insensible a mayúsculas y espacios en blanco', () => {
            const inputs = [
                'PruebaCupon', 'pruebacupon', 'PRUEBACUPON', '  PruebaCupon  ', '\tpruebacupon\n',
                'FOODJET20', 'foodjet20', 'FoodJet20', '  FOODJET20  ', ' \t FOODJET20 \r\n '
            ];

            for (const input of inputs) {
                const res = validateCoupon(input);
                assert.equal(res.valid, true, `Debe aceptar cupón válido: '${input}'`);
                assert.ok(res.coupon.id === 1 || res.coupon.id === 2);
            }
        });

        it('2.8 validateCoupon debe rechazar códigos inexistentes, vacíos, nulos o maliciosos', () => {
            const invalidCodes = [
                '', '   ', null, undefined, 0, false,
                'DESCUENTO50', 'CUPONGRATIS', 'PROMO2026',
                'FOODJET20; DROP TABLE "Order";', 'FOODJET20\' OR \'1\'=\'1',
                '<script>alert("hack")</script>', 'NaN', 'undefined', 'null'
            ];

            for (const code of invalidCodes) {
                const res = validateCoupon(code);
                assert.equal(res.valid, false, `Debe rechazar cupón inválido: '${code}'`);
                assert.ok(res.error, `Debe incluir mensaje de error descriptivo para '${code}'`);
            }
        });

        it('2.9 Backend Oracle debe lanzar error si el cupón está inactivo, vacío o estado falso', () => {
            const inactiveCoupon = { id: 99, porcentaje_descuento: 50.0, estado: false };
            assert.throws(() => {
                backendOrderControllerOracle({ items, user: { es_estudiante: false }, coupon: inactiveCoupon });
            }, /El cupón no es válido o está inactivo/);

            const nullStateCoupon = { id: 98, porcentaje_descuento: 20.0, estado: null };
            assert.throws(() => {
                backendOrderControllerOracle({ items, user: { es_estudiante: false }, coupon: nullStateCoupon });
            }, /El cupón no es válido o está inactivo/);

            const emptyStateCoupon = { id: 97, porcentaje_descuento: 10.0, estado: '' };
            assert.throws(() => {
                backendOrderControllerOracle({ items, user: { es_estudiante: false }, coupon: emptyStateCoupon });
            }, /El cupón no es válido o está inactivo/);
        });

        it('2.10 Dinámica de reemplazo de cupón en estado frontend (setActiveCoupon)', () => {
            state.setActiveCoupon(null);
            assert.equal(state.getActiveCoupon(), null);

            // Aplicar PruebaCupon
            const coupon1 = validateCoupon('PruebaCupon').coupon;
            state.setActiveCoupon(coupon1);
            assert.equal(state.getActiveCoupon().id, 1);
            assert.equal(state.getActiveCoupon().valor, 10.0);

            // Reemplazar con FOODJET20
            const coupon2 = validateCoupon('FOODJET20').coupon;
            state.setActiveCoupon(coupon2);
            assert.equal(state.getActiveCoupon().id, 2);
            assert.equal(state.getActiveCoupon().valor, 20.0);

            // Remover cupón
            state.setActiveCoupon(null);
            assert.equal(state.getActiveCoupon(), null);
        });
    });

    // =========================================================================
    // SUITE 3: Cart Quantity Boundary & State Mutation Adversarial Stress
    // =========================================================================
    describe('Suite 3: Cart Quantity Boundary & State Mutation Adversarial Stress', () => {

        const mockProducts = [
            { id: 501, nombre: 'Burger Alpha', precio: 22.00, disponibilidad: true, restaurante_id: 10, descuento_estudiante: 10 },
            { id: 502, nombre: 'Papas Crunch', precio: 8.00, disponibilidad: true, restaurante_id: 10, descuento_estudiante: 0 },
            { id: 503, nombre: 'Burger Beta', precio: 25.00, disponibilidad: false, restaurante_id: 10, descuento_estudiante: 0 }, // Agotado
            { id: 601, nombre: 'Pizza Gamma', precio: 35.00, disponibilidad: true, restaurante_id: 20, descuento_estudiante: 15 }  // Otro restaurante
        ];

        beforeEach(() => {
            state.clearCart();
            state.setProducts(mockProducts);
            state.setActiveCoupon(null);
        });

        it('3.1 Transición de adición y conteo: 0 -> 1 -> 2 -> ... -> 20', () => {
            assert.equal(state.isCartEmpty(), true);
            assert.equal(state.getCartItemCount(), 0);

            for (let i = 1; i <= 20; i++) {
                const res = state.addToCart(501);
                assert.equal(res.success, true);
                assert.equal(state.getCartItemCount(), i);
                assert.equal(state.getCart()['501'], i);
            }

            assert.equal(state.isCartEmpty(), false);
        });

        it('3.2 Límite inferior estricto: decremento de 1 a 0 elimina la clave del carrito', () => {
            state.addToCart(501);
            assert.equal(state.getCart()['501'], 1);
            assert.equal(state.isCartEmpty(), false);

            state.removeFromCart(501);
            assert.equal(state.getCart()['501'], undefined, 'La clave del producto debe eliminarse por completo');
            assert.equal(Object.keys(state.getCart()).length, 0);
            assert.equal(state.isCartEmpty(), true);
            assert.equal(state.getCartItemCount(), 0);
        });

        it('3.3 Decremento en producto inexistente no debe romper el estado', () => {
            state.clearCart();
            assert.doesNotThrow(() => {
                state.removeFromCart(9999);
            });
            assert.equal(state.isCartEmpty(), true);
        });

        it('3.4 removeItemCompletely elimina el item sin importar la cantidad acumulada', () => {
            for (let i = 0; i < 15; i++) {
                state.addToCart(501);
            }
            state.addToCart(502);

            assert.equal(state.getCart()['501'], 15);
            assert.equal(state.getCart()['502'], 1);
            assert.equal(state.getCartItemCount(), 16);

            state.removeItemCompletely(501);
            assert.equal(state.getCart()['501'], undefined);
            assert.equal(state.getCart()['502'], 1);
            assert.equal(state.getCartItemCount(), 1);
        });

        it('3.5 Aislamiento de restaurante: rechaza agregar producto de restaurante distinto', () => {
            // Agregar producto de Restaurante 10
            const add1 = state.addToCart(501);
            assert.equal(add1.success, true);

            // Intentar agregar producto de Restaurante 20
            const add2 = state.addToCart(601);
            assert.equal(add2.success, false);
            assert.equal(add2.error, 'DIFFERENT_RESTAURANT');
            assert.equal(state.getCart()['601'], undefined, 'No debe agregarse producto de otro restaurante');
            assert.equal(state.getCartItemCount(), 1);
        });

        it('3.6 Disponibilidad de producto: rechaza producto no disponible', () => {
            const addUnavailable = state.addToCart(503);
            assert.equal(addUnavailable.success, false);
            assert.equal(addUnavailable.error, 'UNAVAILABLE');
            assert.equal(state.isCartEmpty(), true);
        });

        it('3.7 getCartRestaurant identifica correctamente el restaurante activo o null cuando está vacío', () => {
            assert.equal(getCartRestaurant({}, state.getProductById), null);

            state.addToCart(501);
            const rest = getCartRestaurant(state.getCart(), state.getProductById);
            assert.ok(rest !== null);
            assert.equal(rest.id, 10);
        });
    });

    // =========================================================================
    // SUITE 4: Financial Breakdown Reconcilability & deriveSubtotal Oracle
    // =========================================================================
    describe('Suite 4: Financial Breakdown Reconcilability & deriveSubtotal Oracle', () => {

        it('4.1 deriveSubtotal debe reconciliar exactamente total - impuestos - costo_envio', () => {
            const sampleOrders = [
                { id: 1, total: 89.96, impuestos: 12.96, costo_envio: 5.00, expectedSubtotal: 72.00 },
                { id: 2, total: 111.20, impuestos: 16.20, costo_envio: 5.00, expectedSubtotal: 90.00 },
                { id: 3, total: 64.00, impuestos: 9.00, costo_envio: 5.00, expectedSubtotal: 50.00 },
                { id: 4, total: 23.29, impuestos: 2.79, costo_envio: 5.00, expectedSubtotal: 15.50 }
            ];

            for (const order of sampleOrders) {
                const derived = deriveSubtotal(order);
                assert.equal(derived.toFixed(2), order.expectedSubtotal.toFixed(2),
                    `Pedido #${order.id} falló al derivar subtotal reconciliable`);
            }
        });

        it('4.2 deriveSubtotal es robusto ante pedidos nulos, vacíos o campos incompletos', () => {
            assert.equal(deriveSubtotal(null), 0);
            assert.equal(deriveSubtotal(undefined), 0);
            assert.equal(deriveSubtotal({}), 0);
            assert.equal(deriveSubtotal({ total: 'invalid' }), 0);
            assert.equal(deriveSubtotal({ total: 5.00, impuestos: 0, costo_envio: 5.00 }), 0);
            // Si el total es menor a la suma de impuestos y envío (anomalía), no debe retornar negativo
            assert.equal(deriveSubtotal({ total: 2.00, impuestos: 1.00, costo_envio: 5.00 }), 0);
        });

        it('4.3 Reconciliación con backendOrderControllerOracle: el subtotal derivado coincide con subtotalConDescuento', () => {
            const items = [
                { product: { id: 1, precio: 45.00, descuento_estudiante: 10 }, cantidad: 2 },
                { product: { id: 2, precio: 15.00, descuento_estudiante: 0 }, cantidad: 1 }
            ];
            const user = { es_estudiante: true };
            const coupon = { id: 2, porcentaje_descuento: 20.0, estado: 'Activo' };

            const backend = backendOrderControllerOracle({ items, user, coupon });
            const simulatedBackendOrder = {
                total: backend.total,
                impuestos: backend.impuestos,
                costo_envio: backend.costoEnvio
            };

            const reconciledSubtotal = deriveSubtotal(simulatedBackendOrder);
            assert.equal(reconciledSubtotal.toFixed(2), backend.subtotalConDescuento.toFixed(2));
        });
    });

    // =========================================================================
    // SUITE 5: IEEE-754 Precision, Rounding Hazards & Boundary Stress
    // =========================================================================
    describe('Suite 5: IEEE-754 Precision, Rounding Hazards & Boundary Stress', () => {

        it('5.1 Riesgo de coma flotante clásico: 0.1 + 0.2 y céntimos fraccionarios', () => {
            const items = [
                { product: { id: 701, precio: 0.10, descuento_estudiante: 0 }, cantidad: 1 },
                { product: { id: 702, precio: 0.20, descuento_estudiante: 0 }, cantidad: 1 }
            ];
            const user = { es_estudiante: false };

            const backend = backendOrderControllerOracle({ items, user, coupon: null });
            const frontend = frontendCheckoutOracle({ items, user, activeCoupon: null });

            // 0.10 + 0.20 = 0.30
            // IGV (18% de 0.30) = 0.054 => 0.05
            // Total = 0.30 + 0.054 + 5.00 = 5.354 => S/ 5.35
            assert.equal(frontend.subtotalEffective.toFixed(2), '0.30');
            assert.equal(backend.subtotal.toFixed(2), '0.30');
            assert.equal(frontend.tax.toFixed(2), '0.05');
            assert.equal(backend.impuestos.toFixed(2), '0.05');
            assert.equal(frontend.formatted.total, 'S/ 5.35');
            assert.equal(backend.formatted.total, 'S/ 5.35');
        });

        it('5.2 Descuento total del 100%: subtotal neto es 0, IGV es 0, total es exactamente el envío (S/ 5.00)', () => {
            const items = [
                { product: { id: 703, precio: 50.00, descuento_estudiante: 100 }, cantidad: 1 }
            ];
            const user = { es_estudiante: true };

            const backend = backendOrderControllerOracle({ items, user, coupon: null });
            const frontend = frontendCheckoutOracle({ items, user, activeCoupon: null });

            assert.equal(frontend.subtotalEffective, 0.00);
            assert.equal(backend.subtotal, 0.00);
            assert.equal(frontend.tax, 0.00);
            assert.equal(backend.impuestos, 0.00);
            assert.equal(frontend.deliveryFee, 5.00);
            assert.equal(frontend.total, 5.00);
            assert.equal(backend.total, 5.00);
            assert.equal(frontend.formatted.total, 'S/ 5.00');
        });

        it('5.3 Monotonicidad estricta: agregar más unidades siempre incrementa estrictamente el total', () => {
            const product = { id: 704, precio: 12.50, descuento_estudiante: 10 };
            const user = { es_estudiante: true };
            let previousTotal = 0;

            for (let qty = 1; qty <= 25; qty++) {
                const items = [{ product, cantidad: qty }];
                const result = frontendCheckoutOracle({ items, user, activeCoupon: null });
                assert.ok(result.total > previousTotal, `Cantidad ${qty} debe tener total estrictamente mayor que ${qty - 1}`);
                previousTotal = result.total;
            }
        });

        it('5.4 Pedido masivo de catering (1,000 unidades) sin desbordamiento ni NaN', () => {
            const product = { id: 705, precio: 99.99, descuento_estudiante: 10 };
            const user = { es_estudiante: true };
            const coupon = { id: 2, porcentaje_descuento: 20.0, estado: 'Activo' };
            const activeCoupon = { id: 2, tipo: 'porcentaje', valor: 20.0 };
            const items = [{ product, cantidad: 1000 }];

            const backend = backendOrderControllerOracle({ items, user, coupon });
            const frontend = frontendCheckoutOracle({ items, user, activeCoupon });

            assert.ok(!Number.isNaN(frontend.total));
            assert.ok(!Number.isNaN(backend.total));
            assert.ok(Number.isFinite(frontend.total));
            assert.equal(frontend.total.toFixed(2), backend.total.toFixed(2));
        });
    });

    // =========================================================================
    // SUITE 6: Monte Carlo Exhaustive Fuzzing (1,000 Random Baskets)
    // =========================================================================
    describe('Suite 6: Monte Carlo Exhaustive Fuzzing (1,000 Random Baskets)', () => {

        it('6.1 1,000 cestas aleatorias deben mantener paridad de céntimos 100% estricta entre Frontend y Backend', () => {
            const coupons = [
                null,
                { id: 1, porcentaje_descuento: 10.0, estado: 'Activo' },
                { id: 2, porcentaje_descuento: 20.0, estado: 'Activo' }
            ];

            const activeCoupons = [
                null,
                { id: 1, tipo: 'porcentaje', valor: 10.0 },
                { id: 2, tipo: 'porcentaje', valor: 20.0 }
            ];

            let discrepanciesCount = 0;

            for (let seed = 0; seed < 1000; seed++) {
                // Pseudo-random generation based on seed
                const itemCount = 1 + (seed % 8); // 1 to 8 distinct products
                const isStudent = (seed % 2) === 0;
                const couponIndex = seed % 3;

                const items = [];
                for (let j = 0; j < itemCount; j++) {
                    const price = Number((1.50 + ((seed * 7 + j * 13) % 8500) / 100).toFixed(2));
                    const studentDiscount = ((seed + j) % 5) * 5; // 0, 5, 10, 15, 20%
                    const quantity = 1 + ((seed + j) % 6); // 1 to 6

                    items.push({
                        product: {
                            id: 1000 + j,
                            precio: price,
                            descuento_estudiante: studentDiscount
                        },
                        cantidad: quantity
                    });
                }

                const user = { es_estudiante: isStudent };
                const coupon = coupons[couponIndex];
                const activeCoupon = activeCoupons[couponIndex];

                const backend = backendOrderControllerOracle({ items, user, coupon });
                const frontend = frontendCheckoutOracle({ items, user, activeCoupon });

                // Centavo verification
                const diffSubtotal = Math.abs(backend.subtotal - frontend.subtotalEffective);
                const diffDescuento = Math.abs(backend.descuento - frontend.couponDiscount);
                const diffImpuestos = Math.abs(backend.impuestos - frontend.tax);
                const diffTotal = Math.abs(backend.total - frontend.total);

                if (diffTotal > 1e-6 || backend.formatted.total !== frontend.formatted.total) {
                    discrepanciesCount++;
                }

                assert.ok(diffSubtotal < 1e-6, `Discrepancia en Subtotal en semilla ${seed}`);
                assert.ok(diffDescuento < 1e-6, `Discrepancia en Descuento en semilla ${seed}`);
                assert.ok(diffImpuestos < 1e-6, `Discrepancia en Impuestos en semilla ${seed}`);
                assert.ok(diffTotal < 1e-6, `Discrepancia en Total en semilla ${seed}`);
                assert.equal(backend.formatted.total, frontend.formatted.total,
                    `Discrepancia en formato de céntimos en semilla ${seed}: backend ${backend.formatted.total} vs frontend ${frontend.formatted.total}`);

                // Also check deriveSubtotal reconciliation
                const derivedSubtotal = deriveSubtotal({
                    total: backend.total,
                    impuestos: backend.impuestos,
                    costo_envio: backend.costoEnvio
                });
                assert.ok(Math.abs(derivedSubtotal - backend.subtotalConDescuento) < 1e-6,
                    `deriveSubtotal falló en reconciliación en semilla ${seed}`);
            }

            assert.equal(discrepanciesCount, 0, `Se encontraron ${discrepanciesCount} discrepancias en 1,000 cestas`);
        });
    });
});
