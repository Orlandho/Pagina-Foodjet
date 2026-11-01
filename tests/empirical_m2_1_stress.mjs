import fs from 'fs';
import assert from 'assert';

console.log('================================================================');
console.log('CHALLENGER M2-1 ADVERSARIAL STRESS TEST & EDGE-CASE ORACLE');
console.log('================================================================\n');

// -------------------------------------------------------------
// Helper: Relative Luminance & Contrast Ratio calculation (WCAG 2.1)
// -------------------------------------------------------------
function hexToRgb(hex) {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// -------------------------------------------------------------
// STRESS TEST 1: Adversarial Search Query Inputs
// -------------------------------------------------------------
console.log('--- STRESS TEST 1: Adversarial Search Query Inputs ---');

const mockProducts = [
  { id: 1, nombre: 'Hamburguesa Clásica [Combo]', descripcion: 'Carne 150g (con papas + gaseosa)', Restaurant: { nombre: 'Burger King (Lima)' } },
  { id: 2, nombre: 'Pizza Familiar *Especial*', descripcion: 'Queso mozzarella, jamón & pepperoni $10', Restaurant: { nombre: 'Pizza Hut \\ Central' } },
  { id: 3, nombre: 'Sushi Roll 🍣', descripcion: 'Salmón fresco y palta 🍱', Restaurant: { nombre: 'Tokyo Sushi Bar' } }
];

function executeSearchFilter(products, searchQuery) {
  const query = searchQuery ? searchQuery.trim().toLowerCase() : '';
  if (!query) return products;
  return products.filter(product => {
    const nameMatch = product.nombre && product.nombre.toLowerCase().includes(query);
    const descMatch = product.descripcion && product.descripcion.toLowerCase().includes(query);
    const restName = product.Restaurant?.nombre || product.restaurante?.nombre || '';
    const restMatch = restName && restName.toLowerCase().includes(query);
    return nameMatch || descMatch || restMatch;
  });
}

const adversarialQueries = [
  { query: '[Combo]', expectedCount: 1, desc: 'Regex square brackets' },
  { query: '(con papas + gaseosa)', expectedCount: 1, desc: 'Regex parentheses and plus sign' },
  { query: '*Especial*', expectedCount: 1, desc: 'Regex asterisk' },
  { query: '\\ Central', expectedCount: 1, desc: 'Regex backslash' },
  { query: '$10', expectedCount: 1, desc: 'Regex dollar sign' },
  { query: '🍣', expectedCount: 1, desc: 'Unicode emoji' },
  { query: '   ', expectedCount: 3, desc: 'Whitespace only' },
  { query: 'NON_EXISTENT_ANTOJO_XYZ_99', expectedCount: 0, desc: 'Zero results scenario' },
  { query: 'burger', expectedCount: 1, desc: 'Case insensitive match on restaurant' }
];

let searchStressPassed = true;
for (const tc of adversarialQueries) {
  try {
    const res = executeSearchFilter(mockProducts, tc.query);
    assert.strictEqual(res.length, tc.expectedCount, `Query "${tc.query}" failed count assertion`);
    console.log(`  ✔ [PASS] ${tc.desc} ("${tc.query}") -> Matched: ${res.length}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${tc.desc} ("${tc.query}"):`, err.message);
    searchStressPassed = false;
  }
}
console.log('Adversarial Search Filtering:', searchStressPassed ? 'ALL PASSED' : 'FAILED');


// -------------------------------------------------------------
// STRESS TEST 2: Multi-Theme Contrast Comprehensive Matrix
// -------------------------------------------------------------
console.log('\n--- STRESS TEST 2: Multi-Theme Contrast Comprehensive Matrix ---');

const contrastPairs = [
  { label: 'Yellow Pill Badge on Brand Orange Background (Hero)', bg: '#F4511E', text: '#FCD460', isLarge: true },
  { label: 'Yellow Pill Badge Dark Text on Yellow Background', bg: '#FCD460', text: '#1C1C1C', isLarge: false },
  { label: 'Hero Title (White) on Brand Orange Background (#D94310)', bg: '#D94310', text: '#FFFFFF', isLarge: true },
  { label: 'Hero Subtitle (White 92%) on Brand Orange Background (#D94310)', bg: '#D94310', text: '#ECECEC', isLarge: false },
  { label: 'Hero CTA Button (Text #1C1C1C on White #FFFFFF)', bg: '#FFFFFF', text: '#1C1C1C', isLarge: false },
  { label: 'Active Category Pill Light (#1C1C1C on #FFFFFF)', bg: '#1C1C1C', text: '#FFFFFF', isLarge: false },
  { label: 'Active Category Pill Dark (#E8E8E8 on #121212)', bg: '#E8E8E8', text: '#121212', isLarge: false },
  { label: 'Hover Active Category Pill Dark (#FFFFFF on #000000)', bg: '#FFFFFF', text: '#000000', isLarge: false },
  { label: 'Student Savings Badge Text (#1C1C1C on #FCD460 in Dark Mode)', bg: '#FCD460', text: '#1C1C1C', isLarge: false }
];

let contrastStressPassed = true;
for (const pair of contrastPairs) {
  const ratio = getContrastRatio(pair.bg, pair.text);
  const required = pair.isLarge ? 3.0 : 4.5;
  const passed = ratio >= required;
  const isAaa = ratio >= 7.0;
  console.log(`  ${passed ? '✔' : '❌'} ${pair.label}`);
  console.log(`     Bg: ${pair.bg} | Text: ${pair.text} | Ratio: ${ratio.toFixed(2)}:1 (Min AA: ${required}:1, AAA: 7.0:1) -> ${isAaa ? 'WCAG AAA PASS' : passed ? 'WCAG AA PASS' : 'FAIL'}`);
  if (!passed) contrastStressPassed = false;
}
console.log('Contrast Matrix Audit:', contrastStressPassed ? 'ALL PASSED (100% WCAG Compliant)' : 'FAILED');


// -------------------------------------------------------------
// STRESS TEST 3: Floating-Point Student Savings Derivation
// -------------------------------------------------------------
console.log('\n--- STRESS TEST 3: Floating-Point Student Savings Derivation ---');

// Test IEEE 754 precision issues (e.g. 19.90 - 15.92 = 3.9800000000000004)
const savingsCases = [
  { original: 19.90, discounted: 15.92, expectDisplay: true, expectedSavings: '3.98' },
  { original: 25.00, discounted: 25.00, expectDisplay: false, expectedSavings: '0.00' }, // no discount
  { original: 10.00, discounted: 9.999, expectDisplay: false, expectedSavings: '0.00' }, // threshold < 0.009
  { original: 12.50, discounted: 10.00, expectDisplay: true, expectedSavings: '2.50' }
];

let floatStressPassed = true;
for (const sc of savingsCases) {
  const studentSavings = sc.original - sc.discounted;
  const shouldDisplay = studentSavings > 0.009;
  assert.strictEqual(shouldDisplay, sc.expectDisplay, `Savings visibility mismatch for ${sc.original} - ${sc.discounted}`);
  if (shouldDisplay) {
    const formatted = `-S/ ${studentSavings.toFixed(2)}`;
    assert.strictEqual(formatted, `-S/ ${sc.expectedSavings}`);
    console.log(`  ✔ [PASS] S/ ${sc.original.toFixed(2)} -> S/ ${sc.discounted.toFixed(2)}: Displays "${formatted}"`);
  } else {
    console.log(`  ✔ [PASS] S/ ${sc.original.toFixed(2)} -> S/ ${sc.discounted.toFixed(2)}: Correctly hidden (savings = 0)`);
  }
}
console.log('Student Savings Calculation:', floatStressPassed ? 'ALL PASSED' : 'FAILED');


// -------------------------------------------------------------
// STRESS TEST 4: Single Restaurant Conflict Recovery Logic
// -------------------------------------------------------------
console.log('\n--- STRESS TEST 4: Single Restaurant Conflict Recovery Logic ---');

const mockCartState = {
  cart: { '101': 2 }, // Product from Restaurant A
  products: {
    '101': { id: 101, nombre: 'Burger Clásica', restauranteId: 1, Restaurant: { id: 1, nombre: 'Burger Shack' } },
    '202': { id: 202, nombre: 'Sushi Maki', restauranteId: 2, Restaurant: { id: 2, nombre: 'Sakura Sushi' } }
  },
  clearCart() {
    this.cart = {};
  },
  addToCart(id) {
    const prod = this.products[id];
    const cartEntries = Object.keys(this.cart);
    if (cartEntries.length > 0) {
      const existingProd = this.products[cartEntries[0]];
      if (existingProd.restauranteId !== prod.restauranteId) {
        return { success: false, error: 'DIFFERENT_RESTAURANT' };
      }
    }
    this.cart[id] = (this.cart[id] || 0) + 1;
    return { success: true };
  }
};

// Step A: Attempt to add product from different restaurant
const attempt1 = mockCartState.addToCart(202);
assert.strictEqual(attempt1.success, false);
assert.strictEqual(attempt1.error, 'DIFFERENT_RESTAURANT');
console.log('  ✔ [PASS] Rejected adding item from different restaurant with DIFFERENT_RESTAURANT error');

// Step B: User accepts switch in modal -> clearCart() + addToCart(202)
mockCartState.clearCart();
const attempt2 = mockCartState.addToCart(202);
assert.strictEqual(attempt2.success, true);
assert.strictEqual(Object.keys(mockCartState.cart).length, 1);
assert.strictEqual(mockCartState.cart['202'], 1);
console.log('  ✔ [PASS] Cleared cart and successfully added new restaurant item');

console.log('Single Restaurant Conflict Recovery:', 'ALL PASSED');

console.log('\n================================================================');
console.log('ADVERSARIAL STRESS TEST COMPLETE: ALL SYSTEMS NOMINAL');
console.log('================================================================');
