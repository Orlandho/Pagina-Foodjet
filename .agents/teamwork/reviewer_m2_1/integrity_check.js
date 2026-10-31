const fs = require('fs');

const ui = fs.readFileSync('frontend/js/ui.js', 'utf8');
const html = fs.readFileSync('frontend/index.html', 'utf8');
const css = fs.readFileSync('frontend/styles.css', 'utf8');

const suspicious = [
  'TC-T',
  'cucumber',
  'UT-CART',
  'UT-REST',
  'UT-USER',
  'UT-CARD',
  'fixture',
  'mock',
  'hardcoded',
  'fake'
];

console.log('--- UI.JS INTEGRITY SCAN ---');
suspicious.forEach(pattern => {
  const matches = ui.match(new RegExp(pattern, 'gi')) || [];
  console.log(`Pattern "${pattern}": ${matches.length} matches`);
});

console.log('--- INDEX.HTML INTEGRITY SCAN ---');
suspicious.forEach(pattern => {
  const matches = html.match(new RegExp(pattern, 'gi')) || [];
  console.log(`Pattern "${pattern}": ${matches.length} matches`);
});

console.log('--- STYLES.CSS INTEGRITY SCAN ---');
suspicious.forEach(pattern => {
  const matches = css.match(new RegExp(pattern, 'gi')) || [];
  console.log(`Pattern "${pattern}": ${matches.length} matches`);
});
