// WCAG 2.1 Contrast Calculation
function luminance(hex) {
  const rgb = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16) / 255);
  const a = rgb.map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrast(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

// 1. Yellow badge (#FCD460) with text (#1C1C1C)
const yellowBg = '#FCD460';
const yellowText = '#1C1C1C';
const ratioYellow = contrast(yellowBg, yellowText);
console.log('Yellow badge contrast ratio:', ratioYellow.toFixed(2) + ':1');
console.log('WCAG AA (4.5:1):', ratioYellow >= 4.5 ? 'PASS' : 'FAIL');
console.log('WCAG AAA (7.0:1):', ratioYellow >= 7.0 ? 'PASS' : 'FAIL');

// 2. Dark mode active pill (#E8E8E8 background, #121212 text)
const pillDarkBg = '#E8E8E8';
const pillDarkText = '#121212';
const ratioPill = contrast(pillDarkBg, pillDarkText);
console.log('Dark mode active pill contrast ratio:', ratioPill.toFixed(2) + ':1');
console.log('WCAG AA (4.5:1):', ratioPill >= 4.5 ? 'PASS' : 'FAIL');
console.log('WCAG AAA (7.0:1):', ratioPill >= 7.0 ? 'PASS' : 'FAIL');

// 3. Hero slide yellow badge (#FCD460 with #1C1C1C) on orange background (#F4511E)
const orangeBg = '#F4511E';
console.log('Yellow badge on orange hero background contrast:', contrast(yellowBg, orangeBg).toFixed(2) + ':1');
