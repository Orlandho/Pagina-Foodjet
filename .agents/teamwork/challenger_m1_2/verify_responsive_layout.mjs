import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const cssPath = path.join(projectRoot, 'frontend', 'styles.css');

console.log('=================================================================');
console.log('  CHALLENGER M1_2: RESPONSIVE & LAYOUT STRESS TEST HARNESS');
console.log('=================================================================');
console.log(`Inspecting Target File: ${cssPath}`);

const cssContent = fs.readFileSync(cssPath, 'utf-8');
const lines = cssContent.split('\n');
console.log(`Total lines: ${lines.length}, Total characters: ${cssContent.length}`);

const results = {
  passed: [],
  failed: [],
  warnings: [],
  metrics: {}
};

function assert(condition, testName, details = '') {
  if (condition) {
    results.passed.push({ testName, details });
    console.log(`  [PASS] ${testName}${details ? ' - ' + details : ''}`);
  } else {
    results.failed.push({ testName, details });
    console.error(`  [FAIL] ${testName}${details ? ' - ' + details : ''}`);
  }
}

/**
 * Extracts the full content inside a balanced pair of braces starting at {
 */
function extractBlockContent(str, openBraceIndex) {
  let depth = 0;
  let inStr = null;
  let inComm = false;
  for (let i = openBraceIndex; i < str.length; i++) {
    const ch = str[i];
    const next = str[i + 1];
    if (!inStr && !inComm && ch === '/' && next === '*') { inComm = true; i++; continue; }
    if (inComm && ch === '*' && next === '/') { inComm = false; i++; continue; }
    if (inComm) continue;
    if (!inStr && (ch === '"' || ch === "'")) { inStr = ch; continue; }
    if (inStr && ch === inStr && str[i - 1] !== '\\') { inStr = null; continue; }
    if (inStr) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return str.substring(openBraceIndex + 1, i);
      }
    }
  }
  return null;
}

// =========================================================================
// 1. CSS Syntax & Brace / Bracket / Parenthesis Balancing
// =========================================================================
console.log('\n--- 1. CSS SYNTAX & BRACE BALANCING ---');

let openBraces = 0;
let openParens = 0;
let openSquare = 0;
let inString = null;
let inComment = false;
let syntaxErrors = [];

for (let i = 0; i < cssContent.length; i++) {
  const char = cssContent[i];
  const nextChar = cssContent[i + 1];

  // Comment handling
  if (!inString && !inComment && char === '/' && nextChar === '*') {
    inComment = true;
    i++;
    continue;
  }
  if (inComment && char === '*' && nextChar === '/') {
    inComment = false;
    i++;
    continue;
  }
  if (inComment) continue;

  // String handling
  if (!inString && (char === '"' || char === "'")) {
    inString = char;
    continue;
  }
  if (inString && char === inString) {
    if (cssContent[i - 1] !== '\\') {
      inString = null;
    }
    continue;
  }
  if (inString) continue;

  // Balance checking
  if (char === '{') openBraces++;
  else if (char === '}') {
    openBraces--;
    if (openBraces < 0) {
      syntaxErrors.push(`Rogue closing brace '}' at character index ${i}`);
    }
  } else if (char === '(') openParens++;
  else if (char === ')') {
    openParens--;
    if (openParens < 0) {
      syntaxErrors.push(`Rogue closing parenthesis ')' at character index ${i}`);
    }
  } else if (char === '[') openSquare++;
  else if (char === ']') {
    openSquare--;
    if (openSquare < 0) {
      syntaxErrors.push(`Rogue closing square bracket ']' at character index ${i}`);
    }
  }
}

assert(inComment === false, 'CSS Comments properly closed', inComment ? 'Dangling open comment' : 'All comments closed');
assert(inString === null, 'CSS Strings properly closed', inString ? `Unclosed string: ${inString}` : 'All strings closed');
assert(openBraces === 0, 'CSS Curly Braces balanced', `Delta: ${openBraces}`);
assert(openParens === 0, 'CSS Parentheses balanced', `Delta: ${openParens}`);
assert(openSquare === 0, 'CSS Square Brackets balanced', `Delta: ${openSquare}`);
assert(syntaxErrors.length === 0, 'No premature closing delimiters', syntaxErrors.join(', '));

results.metrics.braceBalance = { openBraces, openParens, openSquare, syntaxErrorsCount: syntaxErrors.length };

// =========================================================================
// 2. Viewport Unit & Overflow Containment Stress Test
// =========================================================================
console.log('\n--- 2. VIEWPORT UNITS & OVERFLOW CONTAINMENT ---');

// Search for 100vw occurrences (known bug on Windows when vertical scrollbar is present)
const vwMatches = [];
const vwRegex = /\b(\d+)vw\b/gi;
let match;
while ((match = vwRegex.exec(cssContent)) !== null) {
  const lineNo = cssContent.substring(0, match.index).split('\n').length;
  vwMatches.push({ value: match[0], line: lineNo });
}

assert(vwMatches.length === 0, 'Zero usage of vw units causing Windows scrollbar horizontal overflow', 
  vwMatches.length === 0 ? 'No vw units found' : `Found: ${JSON.stringify(vwMatches)}`);

// Search for root overflow-x containment
const htmlBodyRegex = /(?:^|\n)\s*html\s*,\s*body\s*\{/i;
const htmlBodyIdx = cssContent.search(htmlBodyRegex);

assert(htmlBodyIdx !== -1, 'html, body root block defined');
if (htmlBodyIdx !== -1) {
  const braceIdx = cssContent.indexOf('{', htmlBodyIdx);
  const bodyBlock = extractBlockContent(cssContent, braceIdx);
  assert(/overflow-x\s*:\s*hidden/i.test(bodyBlock), 'Root overflow-x is strictly hidden');
  assert(/width\s*:\s*100%/i.test(bodyBlock), 'Root width is 100%');
  assert(/max-width\s*:\s*100%/i.test(bodyBlock), 'Root max-width is 100%');
  assert(/box-sizing/i.test(cssContent), 'Universal box-sizing: border-box applied');
}

// Check min-width: 0 and word-break on flex/grid item cards
const minW0Regex = /\.min-w-0[\s\S]*?\{/i;
const minW0Idx = cssContent.search(minW0Regex);
assert(minW0Idx !== -1, '.min-w-0 and card flex child containment rule defined');
if (minW0Idx !== -1) {
  const braceIdx = cssContent.indexOf('{', minW0Idx);
  const minW0Block = extractBlockContent(cssContent, braceIdx);
  assert(/min-width\s*:\s*0/i.test(minW0Block), 'Contains min-width: 0 for flex/grid overflow prevention');
  assert(/overflow-wrap\s*:\s*break-word/i.test(minW0Block), 'Contains overflow-wrap: break-word for long text strings');
  assert(/word-break\s*:\s*break-word/i.test(minW0Block), 'Contains word-break: break-word for long text strings');
}

// =========================================================================
// 3. Media Queries & Responsive Breakpoints
// =========================================================================
console.log('\n--- 3. MEDIA QUERIES & BREAKPOINTS INVENTORY ---');

const mediaRegex = /@media\s*([^{]+)\{/gi;
const mediaQueries = [];
while ((match = mediaRegex.exec(cssContent)) !== null) {
  const lineNo = cssContent.substring(0, match.index).split('\n').length;
  const braceIdx = match.index + match[0].length - 1;
  const blockContent = extractBlockContent(cssContent, braceIdx);
  mediaQueries.push({ query: match[1].trim(), line: lineNo, content: blockContent });
}

console.log(`  Total @media query blocks found: ${mediaQueries.length}`);
results.metrics.totalMediaQueries = mediaQueries.length;
results.metrics.mediaQueries = mediaQueries.map(m => ({ query: m.query, line: m.line }));

// Check for mobile breakpoints (max-width <= 991px, max-width <= 768px, max-width <= 576px)
const hasMobileQuery = mediaQueries.some(m => /max-width:\s*(575\.98|576|767|768|991|992)px/i.test(m.query));
assert(hasMobileQuery, 'Responsive media queries defined for mobile viewports (<= 991px, <= 768px, <= 576px)');

// Check for desktop/large breakpoints (min-width >= 992px, min-width >= 1200px, min-width >= 1280px)
const hasDesktopQuery = mediaQueries.some(m => /min-width:\s*(768|992|1200|1280|1440)px/i.test(m.query));
assert(hasDesktopQuery, 'Responsive media queries defined for desktop viewports (>= 768px, >= 992px, >= 1200px)');

mediaQueries.forEach(m => console.log(`    Line ${m.line}: @media ${m.query}`));

// =========================================================================
// 4. Motion Reduction Killswitch (prefers-reduced-motion)
// =========================================================================
console.log('\n--- 4. REDUCED MOTION KILLSWITCH VERIFICATION ---');

const reducedMotionQueries = mediaQueries.filter(m => /prefers-reduced-motion\s*:\s*reduce/i.test(m.query));
assert(reducedMotionQueries.length >= 1, '@media (prefers-reduced-motion: reduce) killswitch block exists', 
  `Found ${reducedMotionQueries.length} blocks`);

let foundUniversalKillswitch = false;
let foundPulsingKillswitch = false;
let foundCarouselKillswitch = false;
let foundHoverKillswitch = false;

for (const rBlock of reducedMotionQueries) {
  const content = rBlock.content;
  if (/animation-duration\s*:\s*0\.01ms\s*!important/i.test(content) &&
      /transition-duration\s*:\s*0\.01ms\s*!important/i.test(content)) {
    foundUniversalKillswitch = true;
  }
  if (/\.foodjet-badge--live[\s\S]*?animation\s*:\s*none\s*!important/i.test(content) ||
      /\.marcador-seguimiento--repartidor[\s\S]*?animation\s*:\s*none/i.test(content)) {
    foundPulsingKillswitch = true;
  }
  if (/\.carousel-item[\s\S]*?transition\s*:\s*none\s*!important/i.test(content) ||
      /--bs-carousel-transition\s*:\s*none\s*!important/i.test(content)) {
    foundCarouselKillswitch = true;
  }
  if (/\.foodjet-btn-primary[\s\S]*?transform\s*:\s*none\s*!important/i.test(content)) {
    foundHoverKillswitch = true;
  }
}

assert(foundUniversalKillswitch, 'Universal killswitch clamps animation-duration and transition-duration to 0.01ms !important');
assert(foundPulsingKillswitch, 'Pulsing indicators (foodjet-badge--live, repartidor marker) explicitly silenced (animation: none !important)');
assert(foundCarouselKillswitch, 'Bootstrap carousel animations disabled under reduced motion');
assert(foundHoverKillswitch, 'Interactive hover transforms disabled under reduced motion');

// Verify active animations are wrapped in prefers-reduced-motion: no-preference
const noPrefQueries = mediaQueries.filter(m => /prefers-reduced-motion\s*:\s*no-preference/i.test(m.query));
assert(noPrefQueries.length >= 2, '@media (prefers-reduced-motion: no-preference) shields active animations',
  `Found ${noPrefQueries.length} guarded blocks`);

// =========================================================================
// 5. Canonical Component Selectors & Focus Accessibility
// =========================================================================
console.log('\n--- 5. BASE COMPONENT SELECTORS & FOCUS ACCESSIBILITY ---');

const requiredSelectors = [
  '.foodjet-pill',
  '.foodjet-pill--active',
  '.foodjet-pill--sm',
  '.foodjet-badge',
  '.foodjet-badge--student',
  '.foodjet-badge--yellow',
  '.foodjet-badge--soldout',
  '.foodjet-badge--success',
  '.foodjet-badge--danger',
  '.foodjet-badge--live',
  '.foodjet-card',
  '.foodjet-card--interactive',
  '.foodjet-card--selected',
  '.foodjet-btn-primary',
  '.foodjet-btn-secondary',
  '.foodjet-btn-cta',
  '.foodjet-btn-circle',
  '.foodjet-btn-add',
  '.foodjet-section-header',
  '.foodjet-section-header__icon',
  '.foodjet-section-header__title',
  '.foodjet-input',
  '.foodjet-input-group',
  '.foodjet-input-group__label',
  '.foodjet-input-group__hint',
  '.foodjet-input-group__error',
  '.sr-only',
  '.visually-hidden'
];

for (const sel of requiredSelectors) {
  const escaped = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const selRegex = new RegExp(`(?:^|[\\s,}])` + escaped + `(?:[\\s,{:]|$)`, 'm');
  assert(selRegex.test(cssContent), `Selector ${sel} declared in stylesheet`);
}

// Standalone focus ring verification (not preceded by tag/class, e.g. input:focus-visible)
const focusVisibleRegex = /(?:^|\n)\s*:focus-visible\s*\{/i;
const focusVisibleIdx = cssContent.search(focusVisibleRegex);
assert(focusVisibleIdx !== -1, 'Universal :focus-visible rule defined');
if (focusVisibleIdx !== -1) {
  const braceIdx = cssContent.indexOf('{', focusVisibleIdx);
  const block = extractBlockContent(cssContent, braceIdx);
  assert(/outline\s*:\s*2px\s+solid/i.test(block), 'Focus visible has 2px solid outline');
  assert(/outline-offset\s*:\s*2px/i.test(block), 'Focus visible has 2px outline-offset');
}

// Reverse focus contrast verification
const reverseFocusRegex = /\.btn-primary:focus-visible[\s\S]*?\{/i;
const reverseFocusIdx = cssContent.search(reverseFocusRegex);
assert(reverseFocusIdx !== -1, 'Reverse contrast focus ring defined for dark/primary buttons');
if (reverseFocusIdx !== -1) {
  const braceIdx = cssContent.indexOf('{', reverseFocusIdx);
  const block = extractBlockContent(cssContent, braceIdx);
  assert(/outline\s*:\s*2px\s+solid\s+#ffffff/i.test(block), 'Reverse focus ring uses 2px solid #FFFFFF');
}

// =========================================================================
// SUMMARY & VERDICT
// =========================================================================
console.log('\n=================================================================');
console.log(`TEST SUMMARY: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
console.log('=================================================================');

const verdict = results.failed.length === 0 ? 'APPROVE' : 'REJECT';
console.log(`\n>>> EMPIRICAL VERDICT: ${verdict} <<<\n`);

fs.writeFileSync(
  path.join(__dirname, 'test_results.json'),
  JSON.stringify({ verdict, ...results }, null, 2),
  'utf-8'
);
console.log(`Wrote detailed test results to ${path.join(__dirname, 'test_results.json')}`);

process.exit(results.failed.length === 0 ? 0 : 1);
