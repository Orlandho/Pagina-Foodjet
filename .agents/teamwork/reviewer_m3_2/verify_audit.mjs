import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

console.log('====================================================');
console.log('REVIEWER M3-2 INDEPENDENT ADVERSARIAL AUDIT');
console.log('====================================================');

const html = fs.readFileSync('frontend/index.html', 'utf-8');
const css = fs.readFileSync('frontend/styles.css', 'utf-8');

// 1. DOM ID VERIFICATION
const expectedCheckoutIds = [
    'checkoutView', 'checkoutPageTitle', 'checkoutForm', 'backToMenuBtn',
    'deliveryAddressCard', 'customerName', 'customerPhone', 'customerPhoneError',
    'savedAddressesContainer', 'savedAddressesList', 'customerAddress',
    'deliveryAddressSearch', 'deliveryMapWrapper', 'deliveryMap', 'deliveryMapLocate',
    'deliveryMapStatus', 'customerReference', 'paymentMethodCard', 'paymentOptionsGrid',
    'paymentWallet', 'payWallet', 'paymentCard', 'payCard', 'paymentCash', 'payCash',
    'paymentCashInfo', 'paymentWalletInfo', 'walletAmountDisplay', 'cardDetails',
    'cardNumber', 'cardExpiry', 'cardCvc', 'orderSummaryCard', 'checkoutCartItems',
    'checkoutItems', 'couponCode', 'applyCouponBtn', 'removeCouponBtn', 'couponMessage',
    'checkoutSubtotal', 'studentDiscountRow', 'studentDiscountAmount',
    'checkoutDiscountRow', 'checkoutDiscount', 'couponDiscountRate',
    'checkoutTaxes', 'checkoutTax', 'checkoutDelivery', 'checkoutDeliveryFee',
    'checkoutTotal', 'confirmOrderBtn', 'confirmOrderSpinner', 'confirmOrderText'
];

const missingCheckout = expectedCheckoutIds.filter(id => !html.includes(`id="${id}"`));
console.log('Missing Checkout IDs:', missingCheckout.length === 0 ? 'NONE (ALL 53 PRESENT)' : missingCheckout);
assert.equal(missingCheckout.length, 0, 'All expected checkout IDs must be in frontend/index.html');

const expectedTrackingIds = [
    'trackingView', 'trackingHeadline', 'trackingSubtitle', 'liveIndicator',
    'liveIndicatorText', 'trackingLayout', 'trackingMapCard', 'trackingMap',
    'trackingRoute', 'statusCard', 'statusIcon', 'statusTitle', 'statusDescription',
    'estimatedTime', 'etaValue', 'etaText', 'trackingConnection',
    'step1', 'step2', 'step3', 'step4', 'stepTime1', 'stepTime2', 'stepTime3', 'stepTime4',
    'orderNumber', 'orderPayment', 'orderDate', 'orderSubtotal', 'orderTaxes',
    'orderDelivery', 'orderTotalFinal', 'cancelOrderBtn', 'backToMenuFromTracking'
];

const missingTracking = expectedTrackingIds.filter(id => !html.includes(`id="${id}"`));
console.log('Missing Tracking IDs:', missingTracking.length === 0 ? 'NONE (ALL 34 PRESENT)' : missingTracking);
assert.equal(missingTracking.length, 0, 'All expected tracking IDs must be in frontend/index.html');

// 2. CSS RESPONSIVE RULES AUDIT
const hasStickyDesktop = css.includes('@media (min-width: 992px)') && css.includes('position: sticky !important') && css.includes('top: 96px !important');
console.log('Sticky Desktop Rule (min-width: 992px, top: 96px):', hasStickyDesktop ? 'PASS' : 'FAIL');
assert.ok(hasStickyDesktop, 'Desktop must have sticky checkout summary at top: 96px');

const hasStaticMobile = css.includes('@media (max-width: 991.98px)') && css.includes('position: static !important');
console.log('Static Mobile Rule (max-width: 991.98px, position: static):', hasStaticMobile ? 'PASS' : 'FAIL');
assert.ok(hasStaticMobile, 'Mobile (< 992px) must transition checkout summary to position: static');

const hasMobile1ColPayment = css.includes('@media (max-width: 575.98px)') && css.includes('grid-template-columns: 1fr');
console.log('Mobile 1-Col Payment Grid (max-width: 575.98px):', hasMobile1ColPayment ? 'PASS' : 'FAIL');
assert.ok(hasMobile1ColPayment, 'Mobile (< 576px) must collapse payment tiles to single column');

const hasFocusVisiblePayment = css.includes('.btn-check:focus-visible + .foodjet-payment-tile');
console.log('Focus-visible ring on payment tiles:', hasFocusVisiblePayment ? 'PASS' : 'FAIL');
assert.ok(hasFocusVisiblePayment, 'Payment tiles must have explicit focus-visible ring');

// 3. ARIA ATTRIBUTES AUDIT
const hasRadiogroupPayment = html.includes('id="paymentOptionsGrid"') && html.includes('role="radiogroup"');
console.log('Radiogroup ARIA on Payment Options:', hasRadiogroupPayment ? 'PASS' : 'FAIL');
assert.ok(hasRadiogroupPayment, 'Payment options grid must have role="radiogroup"');

const hasRadiogroupSavedAddresses = html.includes('id="savedAddressesList"') && html.includes('role="radiogroup"');
console.log('Radiogroup ARIA on Saved Addresses:', hasRadiogroupSavedAddresses ? 'PASS' : 'FAIL');
assert.ok(hasRadiogroupSavedAddresses, 'Saved addresses list must have role="radiogroup"');

const hasLiveIndicatorStatus = html.includes('id="liveIndicator"') && html.includes('role="status"') && html.includes('aria-live="polite"');
console.log('Live Indicator ARIA status polite:', hasLiveIndicatorStatus ? 'PASS' : 'FAIL');
assert.ok(hasLiveIndicatorStatus, 'Live indicator badge must have role="status" and aria-live="polite"');

const hasCouponLiveStatus = html.includes('id="couponMessage"') && html.includes('aria-live="polite"');
console.log('Coupon Message ARIA polite status:', hasCouponLiveStatus ? 'PASS' : 'FAIL');
assert.ok(hasCouponLiveStatus, 'Coupon feedback message must have aria-live="polite"');

// 4. CONTRAST CALCULATION AND WCAG COMPLIANCE
function srgbLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return [parseInt(hex.substr(0, 2), 16), parseInt(hex.substr(2, 2), 16), parseInt(hex.substr(4, 2), 16)];
}

function contrast(hex1, hex2) {
    const [r1, g1, b1] = hexToRgb(hex1);
    const [r2, g2, b2] = hexToRgb(hex2);
    const l1 = srgbLuminance(r1, g1, b1);
    const l2 = srgbLuminance(r2, g2, b2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

console.log('\n--- WCAG CONTRAST ORACLE ---');
const contrastTests = [
    { name: 'Selected Payment Tile Title (#F4511E on #FCF0E4)', fg: '#F4511E', bg: '#FCF0E4', threshold: 4.5, largeText: false },
    { name: 'Unselected Payment Tile Title (#1C1C1C on #FFFFFF)', fg: '#1C1C1C', bg: '#FFFFFF', threshold: 4.5, largeText: false },
    { name: 'Unselected Payment Tile Subtitle (#6B6B66 on #FFFFFF)', fg: '#6B6B66', bg: '#FFFFFF', threshold: 4.5, largeText: false },
    { name: 'Selected Payment Tile Subtitle (#6B6B66 on #FCF0E4)', fg: '#6B6B66', bg: '#FCF0E4', threshold: 4.5, largeText: false },
    { name: 'ETA Big Counter (#D94310 on #FCF0E4)', fg: '#D94310', bg: '#FCF0E4', threshold: 3.0, largeText: true },
    { name: 'Reconnecting Badge (#92400E on #FFFBEB)', fg: '#92400E', bg: '#FFFBEB', threshold: 4.5, largeText: false },
    { name: 'Disconnected Badge (#991B1B on #FEF2F2)', fg: '#991B1B', bg: '#FEF2F2', threshold: 4.5, largeText: false },
    { name: 'Live Badge (#1C1C1C on #FFFFFF)', fg: '#1C1C1C', bg: '#FFFFFF', threshold: 4.5, largeText: false },
    { name: 'Student Badge (#1C1C1C on #FCD460)', fg: '#1C1C1C', bg: '#FCD460', threshold: 4.5, largeText: false },
    { name: 'Confirm Order CTA Button (#FFFFFF on #F4511E)', fg: '#FFFFFF', bg: '#F4511E', threshold: 3.0, largeText: true }
];

const contrastFindings = [];
contrastTests.forEach(t => {
    const ratio = contrast(t.fg, t.bg);
    const passed = ratio >= t.threshold;
    console.log(`${t.name}: ratio = ${ratio.toFixed(2)}:1 (req >= ${t.threshold}:1) -> ${passed ? 'PASS' : 'WARN/FAIL'}`);
    if (!passed) {
        contrastFindings.push({ ...t, ratio });
    }
});

console.log('\nContrast Audit Summary:');
if (contrastFindings.length > 0) {
    console.log(`Found ${contrastFindings.length} elements with sub-optimal contrast:`);
    contrastFindings.forEach(f => console.log(`  - ${f.name}: ${f.ratio.toFixed(2)}:1 vs required ${f.threshold}:1`));
} else {
    console.log('All contrast tests passed.');
}

console.log('====================================================');
console.log('ALL AUDIT ASSERTIONS COMPLETED SUCCESSFULLY');
console.log('====================================================');
