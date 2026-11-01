import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const cssPath = path.join(projectRoot, 'frontend', 'styles.css');

const cssContent = fs.readFileSync(cssPath, 'utf-8');

console.log('--- ADVERSARIAL STRESS TEST: FIXED WIDTHS & MOBILE CONFINEMENT ---');

// Search for any width: NNNpx where NNN > 320px
const fixedWidthRegex = /([^{}]+)\{([^}]+)\}/g;
let match;
const suspiciousWidthRules = [];

while ((match = fixedWidthRegex.exec(cssContent)) !== null) {
  const selector = match[1].trim();
  const declarations = match[2];

  // Ignore @keyframes or media query containers
  if (selector.startsWith('@')) continue;

  const widthMatch = declarations.match(/(?:^|;)\s*width\s*:\s*(\d+)px/i);
  if (widthMatch) {
    const px = parseInt(widthMatch[1], 10);
    if (px > 320) {
      // Check if max-width is also set
      const hasMaxWidth = /(?:^|;)\s*max-width\s*:\s*(100%|[^;]+)/i.test(declarations);
      suspiciousWidthRules.push({ selector, px, hasMaxWidth });
    }
  }
}

console.log(`Found ${suspiciousWidthRules.length} rules with fixed width > 320px:`);
suspiciousWidthRules.forEach(r => {
  console.log(`  Selector: ${r.selector} -> width: ${r.px}px (has max-width: ${r.hasMaxWidth})`);
});

// Check if any suspicious rule lacks max-width
const breakingRules = suspiciousWidthRules.filter(r => !r.hasMaxWidth && !r.selector.includes('@'));
console.log(`Potentially breaking rules without max-width on 320px viewport: ${breakingRules.length}`);

// Check minimum touch target sizes on buttons
console.log('\n--- TOUCH TARGET SIZES (WCAG 2.5.5 / 2.5.8) ---');
const btnRegex = /\.foodjet-btn-([a-z]+)[\s\S]*?\{([^}]+)\}/g;
while ((match = btnRegex.exec(cssContent)) !== null) {
  const decls = match[2];
  const minHeight = decls.match(/min-height\s*:\s*([^;]+)/i);
  const padding = decls.match(/padding\s*:\s*([^;]+)/i);
  console.log(`  Button rule matched: min-height=${minHeight ? minHeight[1] : 'none'}, padding=${padding ? padding[1] : 'none'}`);
}
