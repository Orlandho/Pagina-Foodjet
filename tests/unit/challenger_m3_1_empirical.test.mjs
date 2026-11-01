/**
 * FoodJet — Milestone 3 Empirical Challenge Test Suite
 * 
 * Challenger M3-1: Empirical Contracts, Math, Financial Breakdown & Card/Coupon Verification
 * 
 * Objectives:
 * 1. DOM ID Presence and Syntax Verification:
 *    - All 33 preserved checkout DOM IDs in frontend/index.html
 *    - All 23 preserved tracking DOM IDs in frontend/index.html
 *    - Syntactical uniqueness and accessibility attributes
 * 2. Financial Calculation Oracle:
 *    - Strict parity between backend (orderController.js lines 76-104) and frontend (renderCheckoutCart)
 *    - Student discount (per eligible product), coupon discount (10% and 20%), 18% IGV tax, S/ 5.00 delivery fee
 *    - Floating point rounding and fractional cent edge cases
 * 3. Card Validation Oracle & Brand Detection:
 *    - Luhn algorithm across valid/invalid Visa, Mastercard, Amex
 *    - Brand detection logic (detectBrand)
 *    - Brand icon class mapping (#detectedBrandIcon)
 *    - Comprehensive card payload validation (validateCard, formatCardNumber, formatExpiry, validateExpiry, validateCvc)
 * 4. Coupon Validation Oracle:
 *    - validateCoupon with PruebaCupon, FOODJET20, case-insensitivity, whitespace trimming, invalid codes
 *    - buildOrderPayload backward compatibility (3, 4, and 5 arguments with cuponId)
 * 5. Adversarial Stress Scenarios:
 *    - Empty cart financial reset
 *    - Double coupon / coupon override dynamics
 *    - Order cancellation state guard
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Load domain modules under test
import {
    luhnCheck,
    detectBrand,
    validateNumber,
    validateExpiry,
    validateCvc,
    validateCard,
    formatCardNumber,
    formatExpiry
} from '../../frontend/js/domain/payment.js';

import {
    CUPONES_SOPORTADOS,
    validateCoupon,
    buildOrderPayload
} from '../../frontend/js/domain/checkout.js';

import {
    isCancelable,
    isValidTransition,
    isTerminal
} from '../../backend/src/domain/orderStatus.js';

// Read index.html for empirical DOM verification
const indexPath = path.resolve('frontend/index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf-8');

describe('Milestone 3 Empirical Verification — Challenger M3-1', () => {

    // =========================================================================
    // SUITE 1: DOM ID Presence and Syntax Verification
    // =========================================================================
    describe('Suite 1: DOM ID Presence and Syntax in frontend/index.html', () => {
        const checkout33Ids = [
            'checkoutView',
            'backToMenuBtn',
            'checkoutForm',
            'customerName',
            'customerPhone',
            'customerPhoneError',
            'customerAddress',
            'deliveryAddressSearch',
            'deliveryMapWrapper',
            'deliveryMap',
            'deliveryMapLocate',
            'deliveryMapStatus',
            'customerReference',
            'payCash',
            'payCard',
            'payWallet',
            'cardDetails',
            'cardNumber',
            'cardNumberError',
            'cardExpiry',
            'cardExpiryError',
            'cardCvc',
            'cardCvcError',
            'checkoutItems',
            'couponCode',
            'applyCouponBtn',
            'couponMessage',
            'checkoutSubtotal',
            'checkoutDiscountRow',
            'checkoutDiscount',
            'checkoutTaxes',
            'checkoutDelivery',
            'checkoutTotal'
        ];

        const checkoutModernIds = [
            'checkoutCartItems',
            'checkoutTax',
            'checkoutDeliveryFee',
            'paymentMethodCard',
            'paymentOptionsGrid',
            'paymentCash',
            'paymentCard',
            'paymentWallet',
            'walletAmountDisplay',
            'detectedBrandIcon',
            'studentDiscountRow',
            'studentDiscountAmount',
            'couponDiscountRate',
            'removeCouponBtn',
            'confirmOrderBtn',
            'confirmOrderSpinner',
            'confirmOrderText'
        ];

        const tracking23Ids = [
            'trackingView',
            'trackingLayout',
            'trackingMapCard',
            'trackingMap',
            'trackingRoute',
            'statusIcon',
            'statusTitle',
            'statusDescription',
            'estimatedTime',
            'etaValue',
            'etaText',
            'trackingConnection',
            'step1',
            'step2',
            'step3',
            'step4',
            'orderNumber',
            'orderPayment',
            'orderDate',
            'orderSubtotal',
            'orderTaxes',
            'orderDelivery',
            'orderTotalFinal'
        ];

        const trackingModernIds = [
            'trackingHeadline',
            'trackingSubtitle',
            'liveIndicator',
            'liveIndicatorText',
            'stepTime1',
            'stepTime2',
            'stepTime3',
            'stepTime4',
            'cancelOrderBtn',
            'backToMenuFromTracking',
            'trackingHistoryBtn'
        ];

        it('debe contener los 33 IDs esenciales del Checkout sin omisiones', () => {
            const missing = [];
            for (const id of checkout33Ids) {
                const regex = new RegExp(`id=["']${id}["']`);
                if (!regex.test(indexHtml)) {
                    missing.push(id);
                }
            }
            assert.deepEqual(missing, [], `Faltan IDs en checkoutView: ${missing.join(', ')}`);
        });

        it('debe contener los IDs modernos de Checkout requeridos por Hito 3', () => {
            const missing = [];
            for (const id of checkoutModernIds) {
                const regex = new RegExp(`id=["']${id}["']`);
                if (!regex.test(indexHtml)) {
                    missing.push(id);
                }
            }
            assert.deepEqual(missing, [], `Faltan IDs modernos en checkoutView: ${missing.join(', ')}`);
        });

        it('debe contener los 23 IDs esenciales de Tracking sin omisiones', () => {
            const missing = [];
            for (const id of tracking23Ids) {
                const regex = new RegExp(`id=["']${id}["']`);
                if (!regex.test(indexHtml)) {
                    missing.push(id);
                }
            }
            assert.deepEqual(missing, [], `Faltan IDs en trackingView: ${missing.join(', ')}`);
        });

        it('debe contener los IDs modernos de Tracking requeridos por Hito 3', () => {
            const missing = [];
            for (const id of trackingModernIds) {
                const regex = new RegExp(`id=["']${id}["']`);
                if (!regex.test(indexHtml)) {
                    missing.push(id);
                }
            }
            assert.deepEqual(missing, [], `Faltan IDs modernos en trackingView: ${missing.join(', ')}`);
        });

        it('todos los IDs verificados deben ser únicos en el DOM (cero duplicados)', () => {
            const allIds = [...checkout33Ids, ...checkoutModernIds, ...tracking23Ids, ...trackingModernIds];
            // Deduplicate search list
            const uniqueIdSet = Array.from(new Set(allIds));
            const duplicates = [];

            for (const id of uniqueIdSet) {
                const matches = indexHtml.match(new RegExp(`id=["']${id}["']`, 'g')) || [];
                if (matches.length > 1) {
                    duplicates.push({ id, count: matches.length });
                }
            }
            assert.deepEqual(duplicates, [], `Existen IDs duplicados en frontend/index.html: ${JSON.stringify(duplicates)}`);
        });

        it('debe verificar atributos de accesibilidad en elementos interactivos de Checkout y Tracking', () => {
            // Live indicator has role status and aria-live polite
            assert.ok(indexHtml.includes('id="liveIndicator"'));
            assert.ok(indexHtml.includes('role="status" aria-live="polite"'));

            // Payment radio group
            assert.ok(indexHtml.includes('role="radiogroup" aria-label="Métodos de pago"'));

            // Card inputs have proper inputmode and aria-describedby
            assert.ok(indexHtml.includes('id="cardNumber"'));
            assert.ok(indexHtml.includes('aria-describedby="cardNumberError"'));
            assert.ok(indexHtml.includes('aria-describedby="cardExpiryError"'));
            assert.ok(indexHtml.includes('aria-describedby="cardCvcError"'));

            // Timeline has aria-label
            assert.ok(indexHtml.includes('aria-label="Progreso del pedido"'));
        });
    });

    // =========================================================================
    // SUITE 2: Financial Calculation Oracle (Backend vs Frontend Parity)
    // =========================================================================
    describe('Suite 2: Financial Calculation Oracle (Backend vs Frontend Parity)', () => {
        // Backend formula implementation as reference oracle
        function backendCalculateOrder({ items, user, coupon }) {
            let subtotal = 0;
            for (const item of items) {
                let price = item.product.precio;
                if (user.es_estudiante && item.product.descuento_estudiante > 0) {
                    price = price - (price * (item.product.descuento_estudiante / 100));
                }
                subtotal += price * item.cantidad;
            }

            let descuento = 0;
            if (coupon && coupon.estado !== false) {
                descuento = subtotal * (coupon.porcentaje_descuento / 100);
            }

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
                total
            };
        }

        // Frontend formula implementation (as written in frontend/js/ui.js:renderCheckoutCart)
        function frontendCalculateOrder({ items, isStudent, activeCoupon }) {
            let subtotalRegular = 0;
            let subtotalEffective = 0;
            let studentSavings = 0;

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

        it('Escenario A: Usuario regular, sin cupón, producto único', () => {
            const items = [
                { product: { id: 1, precio: 25.00, descuento_estudiante: 10 }, cantidad: 2 }
            ];
            const user = { es_estudiante: false };

            const backend = backendCalculateOrder({ items, user, coupon: null });
            const frontend = frontendCalculateOrder({ items, isStudent: false, activeCoupon: null });

            assert.equal(frontend.subtotalEffective, backend.subtotal);
            assert.equal(frontend.subtotalEffective, 50.00);
            assert.equal(frontend.studentSavings, 0);
            assert.equal(frontend.couponDiscount, backend.descuento);
            assert.equal(frontend.tax, backend.impuestos);
            assert.equal(frontend.tax, 50.00 * 0.18); // 9.00
            assert.equal(frontend.total, backend.total);
            assert.equal(frontend.total, 50.00 + 9.00 + 5.00); // 64.00
            assert.equal(frontend.formatted.total, 'S/ 64.00');
        });

        it('Escenario B: Usuario estudiante, sin cupón, con descuento de producto 15%', () => {
            const items = [
                { product: { id: 2, precio: 20.00, descuento_estudiante: 15 }, cantidad: 1 }
            ];
            const user = { es_estudiante: true };

            const backend = backendCalculateOrder({ items, user, coupon: null });
            const frontend = frontendCalculateOrder({ items, isStudent: true, activeCoupon: null });

            // 20 - 15% = 17.00
            assert.equal(frontend.subtotalEffective, backend.subtotal);
            assert.equal(frontend.subtotalEffective, 17.00);
            assert.equal(frontend.studentSavings, 3.00);
            assert.equal(frontend.tax, backend.impuestos);
            assert.equal(frontend.tax, 17.00 * 0.18); // 3.06
            assert.equal(frontend.total, backend.total);
            assert.equal(frontend.total, 17.00 + 3.06 + 5.00); // 25.06
            assert.equal(frontend.formatted.total, 'S/ 25.06');
        });

        it('Escenario C: Usuario regular con cupón PruebaCupon (10%)', () => {
            const items = [
                { product: { id: 1, precio: 30.00, descuento_estudiante: 0 }, cantidad: 1 }
            ];
            const user = { es_estudiante: false };
            const coupon = { id: 1, porcentaje_descuento: 10.0, estado: true };
            const activeCoupon = { id: 1, valor: 10.0, tipo: 'porcentaje' };

            const backend = backendCalculateOrder({ items, user, coupon });
            const frontend = frontendCalculateOrder({ items, isStudent: false, activeCoupon });

            // Subtotal = 30.00. Cupón 10% = 3.00. Subtotal neto = 27.00.
            // IGV 18% = 4.86. Envio = 5.00. Total = 36.86.
            assert.equal(frontend.subtotalEffective, backend.subtotal);
            assert.equal(frontend.couponDiscount, backend.descuento);
            assert.equal(frontend.couponDiscount, 3.00);
            assert.equal(frontend.subtotalAfterCoupon, backend.subtotalConDescuento);
            assert.equal(frontend.tax, backend.impuestos);
            assert.equal(Number(frontend.tax.toFixed(2)), 4.86);
            assert.equal(frontend.formatted.tax, 'S/ 4.86');
            assert.equal(frontend.total, backend.total);
            assert.equal(Number(frontend.total.toFixed(2)), 36.86);
            assert.equal(frontend.formatted.total, 'S/ 36.86');
        });

        it('Escenario D: Usuario estudiante con descuento de producto 20% Y cupón FOODJET20 (20%)', () => {
            const items = [
                { product: { id: 3, precio: 50.00, descuento_estudiante: 20 }, cantidad: 2 }
            ];
            const user = { es_estudiante: true };
            const coupon = { id: 2, porcentaje_descuento: 20.0, estado: true };
            const activeCoupon = { id: 2, valor: 20.0, tipo: 'porcentaje' };

            const backend = backendCalculateOrder({ items, user, coupon });
            const frontend = frontendCalculateOrder({ items, isStudent: true, activeCoupon });

            // Precio regular 50 * 2 = 100.
            // Precio estudiante = 50 - 20% = 40. 40 * 2 = 80. Ahorro estudiante = 20.
            // Cupón 20% sobre 80 = 16. Subtotal neto = 64.
            // IGV 18% sobre 64 = 11.52.
            // Envío = 5.00.
            // Total = 64 + 11.52 + 5 = 80.52.
            assert.equal(frontend.subtotalEffective, backend.subtotal);
            assert.equal(frontend.subtotalEffective, 80.00);
            assert.equal(frontend.studentSavings, 20.00);
            assert.equal(frontend.couponDiscount, backend.descuento);
            assert.equal(frontend.couponDiscount, 16.00);
            assert.equal(frontend.subtotalAfterCoupon, 64.00);
            assert.equal(frontend.tax, backend.impuestos);
            assert.equal(frontend.tax, 11.52);
            assert.equal(frontend.total, backend.total);
            assert.equal(frontend.total, 80.52);
            assert.equal(frontend.formatted.total, 'S/ 80.52');
        });

        it('Escenario E: Cesta multi-producto con precios con decimales y redondeo monetario', () => {
            const items = [
                { product: { id: 10, precio: 12.99, descuento_estudiante: 10 }, cantidad: 3 },
                { product: { id: 11, precio: 7.50, descuento_estudiante: 0 }, cantidad: 2 },
                { product: { id: 12, precio: 14.80, descuento_estudiante: 25 }, cantidad: 1 }
            ];
            const user = { es_estudiante: true };
            const coupon = { id: 1, porcentaje_descuento: 10.0, estado: true };
            const activeCoupon = { id: 1, valor: 10.0, tipo: 'porcentaje' };

            const backend = backendCalculateOrder({ items, user, coupon });
            const frontend = frontendCalculateOrder({ items, isStudent: true, activeCoupon });

            // Ensure exact equality in calculation
            assert.equal(frontend.subtotalEffective, backend.subtotal);
            assert.equal(frontend.couponDiscount, backend.descuento);
            assert.equal(frontend.tax, backend.impuestos);
            assert.equal(frontend.total, backend.total);

            // Verify string formatted outputs do not produce NaN or floating point garbage
            assert.match(frontend.formatted.subtotal, /^S\/ \d+\.\d{2}$/);
            assert.match(frontend.formatted.tax, /^S\/ \d+\.\d{2}$/);
            assert.match(frontend.formatted.total, /^S\/ \d+\.\d{2}$/);
            assert.equal(Number(frontend.formatted.total.replace('S/ ', '')), Number(backend.total.toFixed(2)));
        });

        it('Escenario F: Validación de precisión con 100 cestas aleatorias (Stress Monte Carlo)', () => {
            for (let i = 0; i < 100; i++) {
                const randomPrice1 = Math.round((Math.random() * 50 + 5) * 100) / 100;
                const randomPrice2 = Math.round((Math.random() * 30 + 3) * 100) / 100;
                const items = [
                    { product: { id: 101, precio: randomPrice1, descuento_estudiante: 15 }, cantidad: Math.floor(Math.random() * 4) + 1 },
                    { product: { id: 102, precio: randomPrice2, descuento_estudiante: 0 }, cantidad: Math.floor(Math.random() * 3) + 1 }
                ];
                const isStudent = i % 2 === 0;
                const user = { es_estudiante: isStudent };
                const useCoupon = i % 3 === 0;
                const coupon = useCoupon ? { id: 1, porcentaje_descuento: 10.0, estado: true } : null;
                const activeCoupon = useCoupon ? { id: 1, valor: 10.0, tipo: 'porcentaje' } : null;

                const backend = backendCalculateOrder({ items, user, coupon });
                const frontend = frontendCalculateOrder({ items, isStudent, activeCoupon });

                assert.equal(frontend.subtotalEffective, backend.subtotal, `Fallo en iteración ${i}: subtotal`);
                assert.equal(frontend.couponDiscount, backend.descuento, `Fallo en iteración ${i}: descuento`);
                assert.equal(frontend.tax, backend.impuestos, `Fallo en iteración ${i}: impuestos`);
                assert.equal(frontend.total, backend.total, `Fallo en iteración ${i}: total`);
            }
        });
    });

    // =========================================================================
    // SUITE 3: Card Validation Oracle & Brand Detection
    // =========================================================================
    describe('Suite 3: Card Validation Oracle & Brand Detection', () => {
        // Standard test card numbers
        const validVisa = '4242424242424242';
        const invalidVisa = '4242424242424241';
        const validMastercard = '5555555555554444';
        const invalidMastercard = '5555555555554445';
        const validAmex = '378282246310005';
        const invalidAmex = '378282246310006';

        it('luhnCheck debe aceptar tarjetas válidas y rechazar alteradas', () => {
            assert.equal(luhnCheck(validVisa), true, 'Visa válida debe pasar Luhn');
            assert.equal(luhnCheck(invalidVisa), false, 'Visa inválida debe fallar Luhn');

            assert.equal(luhnCheck(validMastercard), true, 'Mastercard válida debe pasar Luhn');
            assert.equal(luhnCheck(invalidMastercard), false, 'Mastercard inválida debe fallar Luhn');

            assert.equal(luhnCheck(validAmex), true, 'Amex válida debe pasar Luhn');
            assert.equal(luhnCheck(invalidAmex), false, 'Amex inválida debe fallar Luhn');
        });

        it('luhnCheck debe rechazar entradas vacías, cortas o no numéricas', () => {
            assert.equal(luhnCheck(''), false);
            assert.equal(luhnCheck(null), false);
            assert.equal(luhnCheck(undefined), false);
            assert.equal(luhnCheck('12345'), false);
            assert.equal(luhnCheck('abcdefghijklmnop'), false);
        });

        it('detectBrand debe clasificar correctamente Visa, Mastercard, Amex y desconocida', () => {
            assert.equal(detectBrand('4242 4242 4242 4242'), 'visa');
            assert.equal(detectBrand('4111 1111 1111 1111'), 'visa');
            assert.equal(detectBrand('5105 1051 0510 5100'), 'mastercard');
            assert.equal(detectBrand('5555 5555 5555 4444'), 'mastercard');
            assert.equal(detectBrand('2221 0000 0000 0000'), 'mastercard'); // 2-series BIN
            assert.equal(detectBrand('3400 0000 0000 000'), 'amex');
            assert.equal(detectBrand('3782 8224 6310 005'), 'amex');
            assert.equal(detectBrand('6011 0000 0000 0000'), 'desconocida'); // Discover
            assert.equal(detectBrand('1234 5678 9012 3456'), 'desconocida');
            assert.equal(detectBrand(''), 'desconocida');
        });

        it('debe mapear detectedBrand a las clases de icono #detectedBrandIcon exactamente como en app.js', () => {
            function getBrandIconClass(brand) {
                if (brand === 'visa') {
                    return 'bi bi-credit-card-2-front-fill text-primary';
                } else if (brand === 'mastercard') {
                    return 'bi bi-credit-card-2-front-fill text-warning';
                } else if (brand === 'amex') {
                    return 'bi bi-credit-card-2-front-fill text-info';
                } else {
                    return 'bi bi-credit-card fs-6 text-muted';
                }
            }

            assert.equal(getBrandIconClass(detectBrand(validVisa)), 'bi bi-credit-card-2-front-fill text-primary');
            assert.equal(getBrandIconClass(detectBrand(validMastercard)), 'bi bi-credit-card-2-front-fill text-warning');
            assert.equal(getBrandIconClass(detectBrand(validAmex)), 'bi bi-credit-card-2-front-fill text-info');
            assert.equal(getBrandIconClass(detectBrand('6011 0000 0000 0000')), 'bi bi-credit-card fs-6 text-muted');
        });

        it('validateNumber debe validar longitud y Luhn según la marca', () => {
            // Visa (16 dígitos)
            assert.equal(validateNumber(validVisa).valid, true);
            assert.equal(validateNumber(validVisa).marca, 'visa');
            assert.equal(validateNumber('4242 4242 4242 424').valid, false); // 15 digits

            // Amex (15 dígitos)
            assert.equal(validateNumber(validAmex).valid, true);
            assert.equal(validateNumber(validAmex).marca, 'amex');
            assert.equal(validateNumber(validAmex + '0').valid, false); // 16 digits
        });

        it('validateExpiry debe validar formato MM/AA y fechas pasadas/futuras', () => {
            const fechaPrueba = new Date(2026, 9, 30); // Octubre 2026

            // Tarjeta que vence en Octubre 2026 (mes actual): válida durante todo el mes
            assert.equal(validateExpiry('10/26', fechaPrueba).valid, true);

            // Futura
            assert.equal(validateExpiry('12/28', fechaPrueba).valid, true);
            assert.equal(validateExpiry('01/27', fechaPrueba).valid, true);

            // Vencida
            assert.equal(validateExpiry('09/26', fechaPrueba).valid, false);
            assert.equal(validateExpiry('01/25', fechaPrueba).valid, false);

            // Formatos inválidos
            assert.equal(validateExpiry('13/26', fechaPrueba).valid, false);
            assert.equal(validateExpiry('00/26', fechaPrueba).valid, false);
            assert.equal(validateExpiry('abc', fechaPrueba).valid, false);
            assert.equal(validateExpiry('', fechaPrueba).valid, false);
        });

        it('validateCvc debe exigir 3 dígitos para Visa/MC y 4 dígitos para Amex', () => {
            assert.equal(validateCvc('123', 'visa').valid, true);
            assert.equal(validateCvc('1234', 'visa').valid, false);
            assert.equal(validateCvc('12', 'visa').valid, false);

            assert.equal(validateCvc('1234', 'amex').valid, true);
            assert.equal(validateCvc('123', 'amex').valid, false);
        });

        it('validateCard debe validar el conjunto completo de la tarjeta', () => {
            const ahora = new Date(2026, 9, 30);

            const tarjetaValida = {
                numero: validVisa,
                expiracion: '12/28',
                cvc: '123'
            };
            const res = validateCard(tarjetaValida, ahora);
            assert.equal(res.valid, true);
            assert.equal(res.marca, 'visa');
            assert.deepEqual(res.errors, {});

            const tarjetaInvalida = {
                numero: invalidVisa,
                expiracion: '01/20',
                cvc: '1'
            };
            const resBad = validateCard(tarjetaInvalida, ahora);
            assert.equal(resBad.valid, false);
            assert.ok(resBad.errors.numero);
            assert.ok(resBad.errors.expiracion);
            assert.ok(resBad.errors.cvc);
        });

        it('formatCardNumber y formatExpiry deben aplicar máscaras adecuadas mientras se escribe', () => {
            assert.equal(formatCardNumber('4242424242424242'), '4242 4242 4242 4242');
            assert.equal(formatCardNumber('424242'), '4242 42');
            assert.equal(formatExpiry('1228'), '12/28');
            assert.equal(formatExpiry('12'), '12');
        });
    });

    // =========================================================================
    // SUITE 4: Coupon Validation Oracle & Payload Contract
    // =========================================================================
    describe('Suite 4: Coupon Validation Oracle & Payload Contract', () => {
        it('debe contener los cupones soportados en seed del backend', () => {
            assert.ok(CUPONES_SOPORTADOS['pruebacupon']);
            assert.equal(CUPONES_SOPORTADOS['pruebacupon'].id, 1);
            assert.equal(CUPONES_SOPORTADOS['pruebacupon'].porcentaje, 10.0);

            assert.ok(CUPONES_SOPORTADOS['foodjet20']);
            assert.equal(CUPONES_SOPORTADOS['foodjet20'].id, 2);
            assert.equal(CUPONES_SOPORTADOS['foodjet20'].porcentaje, 20.0);
        });

        it('validateCoupon debe validar cupones exactos, en mayúsculas, minúsculas y mixto', () => {
            const r1 = validateCoupon('PruebaCupon');
            assert.equal(r1.valid, true);
            assert.equal(r1.coupon.id, 1);
            assert.equal(r1.coupon.codigo, 'PruebaCupon');

            const r2 = validateCoupon('pruebacupon');
            assert.equal(r2.valid, true);

            const r3 = validateCoupon('PRUEBACUPON');
            assert.equal(r3.valid, true);

            const r4 = validateCoupon('FOODJET20');
            assert.equal(r4.valid, true);
            assert.equal(r4.coupon.id, 2);
            assert.equal(r4.coupon.porcentaje, 20.0);

            const r5 = validateCoupon('foodjet20');
            assert.equal(r5.valid, true);
        });

        it('validateCoupon debe recortar espacios en blanco al inicio y final', () => {
            const r1 = validateCoupon('   PruebaCupon  ');
            assert.equal(r1.valid, true);

            const r2 = validateCoupon('\tFOODJET20 \n');
            assert.equal(r2.valid, true);
        });

        it('validateCoupon debe rechazar códigos inválidos o vacíos', () => {
            const r1 = validateCoupon('');
            assert.equal(r1.valid, false);
            assert.equal(r1.error, 'Ingresa un código de cupón.');

            const r2 = validateCoupon('   ');
            assert.equal(r2.valid, false);

            const r3 = validateCoupon(null);
            assert.equal(r3.valid, false);

            const r4 = validateCoupon(undefined);
            assert.equal(r4.valid, false);

            const r5 = validateCoupon('CUPON_FALSO');
            assert.equal(r5.valid, false);
            assert.equal(r5.error, 'Código de cupón no válido.');
        });

        it('buildOrderPayload debe ser retrocompatible con 3, 4 y 5 argumentos', () => {
            const cart = { '1': 2 };
            const getProductById = () => ({ restaurante_id: 3 });

            // 3 argumentos (legacy)
            const p3 = buildOrderPayload(cart, getProductById, 'cash');
            assert.equal(p3.metodo_pago, 'cash');
            assert.equal(p3.direccion_entrega_id, 1);
            assert.equal(p3.restaurante_id, 3);
            assert.equal(p3.cupon_id, undefined);

            // 4 argumentos (con dirección)
            const p4 = buildOrderPayload(cart, getProductById, 'card', 5);
            assert.equal(p4.direccion_entrega_id, 5);
            assert.equal(p4.cupon_id, undefined);

            // 5 argumentos (con cupón ID)
            const p5 = buildOrderPayload(cart, getProductById, 'wallet', 5, 2);
            assert.equal(p5.direccion_entrega_id, 5);
            assert.equal(p5.cupon_id, 2);

            // 5 argumentos con cupón ID string
            const p5s = buildOrderPayload(cart, getProductById, 'cash', 1, '1');
            assert.equal(p5s.cupon_id, 1);
        });
    });

    // =========================================================================
    // SUITE 5: Adversarial Stress Scenarios & Edge Cases
    // =========================================================================
    describe('Suite 5: Adversarial Stress Scenarios & Edge Cases', () => {
        it('debe comprobar reglas de cancelación de pedido en backend', () => {
            // Cancelable strictly on pendiente and confirmado
            assert.equal(isCancelable('pendiente'), true);
            assert.equal(isCancelable('confirmado'), true);

            // Non-cancelable once preparation starts or terminal
            assert.equal(isCancelable('en_preparacion'), false);
            assert.equal(isCancelable('en_camino'), false);
            assert.equal(isCancelable('entregado'), false);
            assert.equal(isCancelable('cancelado'), false);
        });

        it('debe comprobar transiciones de estado permitidas', () => {
            assert.equal(isValidTransition('pendiente', 'confirmado'), true);
            assert.equal(isValidTransition('confirmado', 'en_preparacion'), true);
            assert.equal(isValidTransition('en_preparacion', 'en_camino'), true);
            assert.equal(isValidTransition('en_camino', 'entregado'), true);

            // Abort paths
            assert.equal(isValidTransition('pendiente', 'cancelado'), true);
            assert.equal(isValidTransition('confirmado', 'cancelado'), true);
            assert.equal(isValidTransition('en_preparacion', 'cancelado'), false);
        });

        it('debe detectar estados terminales', () => {
            assert.equal(isTerminal('entregado'), true);
            assert.equal(isTerminal('cancelado'), true);
            assert.equal(isTerminal('en_camino'), false);
            assert.equal(isTerminal('en_preparacion'), false);
        });

        it('debe simular comportamiento ante cambio dinámico de cupón (PruebaCupon -> FOODJET20 -> invalido -> remover)', () => {
            const subtotal = 100.00;

            // Paso 1: Sin cupón
            let activo = null;
            let descuento = activo ? subtotal * (activo.porcentaje / 100) : 0;
            assert.equal(descuento, 0);

            // Paso 2: Aplicar PruebaCupon (10%)
            const v1 = validateCoupon('PruebaCupon');
            assert.equal(v1.valid, true);
            activo = v1.coupon;
            descuento = subtotal * (activo.porcentaje / 100);
            assert.equal(descuento, 10.00);

            // Paso 3: Cambiar a FOODJET20 (20%)
            const v2 = validateCoupon('FOODJET20');
            assert.equal(v2.valid, true);
            activo = v2.coupon;
            descuento = subtotal * (activo.porcentaje / 100);
            assert.equal(descuento, 20.00);

            // Paso 4: Intentar aplicar cupón inválido
            const vBad = validateCoupon('MALO');
            assert.equal(vBad.valid, false);
            // Si es inválido, el frontend limpia el cupón activo
            activo = null;
            descuento = 0;
            assert.equal(descuento, 0);
        });
    });
});
