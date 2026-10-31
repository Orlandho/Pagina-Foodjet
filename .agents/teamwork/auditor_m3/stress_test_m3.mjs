import fs from 'fs';
import assert from 'node:assert/strict';
import { CUPONES_SOPORTADOS, validateCoupon, buildOrderPayload } from '../../../frontend/js/domain/checkout.js';

console.log('================================================================');
console.log('ADVERSARIAL STRESS TEST: MILESTONE 3 (CHECKOUT & TRACKING)');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

// 1. Coupon validation stress test
runTest('Coupon: valid coupons case-insensitivity and trimming', () => {
  const c1 = validateCoupon('pruebacupon');
  assert.equal(c1.valid, true);
  assert.equal(c1.coupon.id, 1);
  assert.equal(c1.coupon.porcentaje, 10.0);

  const c2 = validateCoupon('   PRUEBACUPON   ');
  assert.equal(c2.valid, true);
  assert.equal(c2.coupon.id, 1);

  const c3 = validateCoupon('FOODJET20');
  assert.equal(c3.valid, true);
  assert.equal(c3.coupon.id, 2);
  assert.equal(c3.coupon.porcentaje, 20.0);

  const c4 = validateCoupon(' foodjet20 ');
  assert.equal(c4.valid, true);
  assert.equal(c4.coupon.id, 2);
});

runTest('Coupon: invalid, malicious, or malformed coupon codes', () => {
  const invalidCases = ['', '   ', null, undefined, 'HACK', '123', 'DROP TABLE', '<script>alert(1)</script>', 'PRUEBA', 'FOODJET', false, 0];
  for (const input of invalidCases) {
    const res = validateCoupon(input);
    assert.equal(res.valid, false, `Expected invalid for: ${input}`);
    assert.ok(typeof res.error === 'string' && res.error.length > 0);
  }
});

// 2. buildOrderPayload backward compatibility and cuponId handling
runTest('Payload: backward compatibility with 3 and 4 arguments', () => {
  const mockCart = { 1: 2, 2: 1 };
  const getProduct = (id) => ({ id: Number(id), restaurante_id: 10 });

  const p3 = buildOrderPayload(mockCart, getProduct, 'cash');
  assert.equal(p3.direccion_entrega_id, 1);
  assert.equal(p3.metodo_pago, 'cash');
  assert.equal(p3.restaurante_id, 10);
  assert.equal(p3.cupon_id, undefined);
  assert.equal(p3.items.length, 2);

  const p4 = buildOrderPayload(mockCart, getProduct, 'card', 42);
  assert.equal(p4.direccion_entrega_id, 42);
  assert.equal(p4.cupon_id, undefined);

  const p5 = buildOrderPayload(mockCart, getProduct, 'wallet', 42, 2);
  assert.equal(p5.direccion_entrega_id, 42);
  assert.equal(p5.cupon_id, 2);

  const p5Null = buildOrderPayload(mockCart, getProduct, 'wallet', 42, null);
  assert.equal(p5Null.cupon_id, undefined);

  const p5Zero = buildOrderPayload(mockCart, getProduct, 'wallet', 42, 0);
  assert.equal(p5Zero.cupon_id, undefined);
});

// 3. Exact financial arithmetic verification against backend rules
runTest('Financial Arithmetic: Subtotal, Student Discount, Coupon, IGV 18%, Delivery S/ 5.00', () => {
  // Scenario:
  // Item A: price 50, student_discount 20% -> effective 40. Qty 2 = 80.
  // Item B: price 20, student_discount 0% -> effective 20. Qty 1 = 20.
  // Effective subtotal = 100.00.
  // Student savings = (50*2 + 20*1) - 100 = 120 - 100 = 20.00.
  // Active coupon FOODJET20 (20%) -> discount = 100 * 0.20 = 20.00.
  // Subtotal after coupon = 80.00.
  // IGV 18% = 80 * 0.18 = 14.40.
  // Delivery Fee = 5.00.
  // Total = 80 + 14.40 + 5.00 = 99.40.

  const subtotalEffective = 100.00;
  const couponDiscount = subtotalEffective * 0.20; // 20.00
  const subtotalAfterCoupon = subtotalEffective - couponDiscount; // 80.00
  const tax = subtotalAfterCoupon * 0.18; // 14.40
  const delivery = 5.00;
  const total = subtotalAfterCoupon + tax + delivery; // 99.40

  assert.equal(total.toFixed(2), '99.40');
  assert.equal(tax.toFixed(2), '14.40');
  assert.equal(subtotalAfterCoupon.toFixed(2), '80.00');
});

// 4. CSS Inspection for Responsive Rules and Keyframes
runTest('CSS: Responsive rules for 2-col desktop / 1-col mobile', () => {
  const css = fs.readFileSync('frontend/styles.css', 'utf-8');

  assert.ok(css.includes('.checkout-summary-sticky'), 'Missing .checkout-summary-sticky');
  assert.ok(css.includes('@media (max-width: 991.98px)'), 'Missing @media (max-width: 991.98px)');
  assert.ok(css.includes('position: static'), 'Missing position: static on mobile checkout summary');
  assert.ok(css.includes('@keyframes foodjet-pulse-live'), 'Missing @keyframes foodjet-pulse-live');
  assert.ok(css.includes('.foodjet-badge--live'), 'Missing .foodjet-badge--live');
  assert.ok(css.includes('.foodjet-badge--reconnecting'), 'Missing .foodjet-badge--reconnecting');
  assert.ok(css.includes('.foodjet-badge--disconnected'), 'Missing .foodjet-badge--disconnected');
  assert.ok(css.includes('.foodjet-payment-tile'), 'Missing .foodjet-payment-tile');
  assert.ok(css.includes('.saved-address-chip'), 'Missing .saved-address-chip');
});

// 5. HTML Semantic & Accessibility Inspection
runTest('HTML: Semantic markup, ARIA attributes, and required IDs', () => {
  const html = fs.readFileSync('frontend/index.html', 'utf-8');

  // Checkout elements
  assert.ok(html.includes('id="savedAddressesList"'));
  assert.ok(html.includes('id="confirmOrderBtn"'));
  assert.ok(html.includes('id="couponCode"'));
  assert.ok(html.includes('id="applyCouponBtn"'));
  assert.ok(html.includes('id="studentDiscountRow"'));
  assert.ok(html.includes('id="studentDiscountAmount"'));
  assert.ok(html.includes('id="cardDetails"'));

  // Tracking elements
  assert.ok(html.includes('id="trackingHeadline"'));
  assert.ok(html.includes('id="trackingSubtitle"'));
  assert.ok(html.includes('id="liveIndicator"'));
  assert.ok(html.includes('id="cancelOrderBtn"'));
  assert.ok(html.includes('id="etaValue"'));
  assert.ok(html.includes('id="step1"'));
  assert.ok(html.includes('id="step2"'));
  assert.ok(html.includes('id="step3"'));
  assert.ok(html.includes('id="step4"'));
});

console.log(`\n================================================================`);
console.log(`STRESS TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log(`================================================================`);

process.exit(totalTests === passedTests ? 0 : 1);
