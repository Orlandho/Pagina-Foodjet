import fs from 'fs';
import { execSync } from 'child_process';

const baselineHtml = execSync('git show 515e3ad:frontend/index.html', { encoding: 'utf8' });
const currentHtml = fs.readFileSync('frontend/index.html', 'utf8');

const idRegex = /id=["']([^"']+)["']/g;
const baselineIds = new Set();
let match;
while ((match = idRegex.exec(baselineHtml)) !== null) {
  baselineIds.add(match[1]);
}

const currentIdMatches = [...currentHtml.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
const currentIds = new Set(currentIdMatches);

console.log('Baseline unique IDs count:', baselineIds.size);
console.log('Current unique IDs count:', currentIds.size);

// Find IDs specifically in the header and home view
const homeViewMatch = currentHtml.match(/<div id="homeView">([\s\S]*?)<\/div>\s*<section id="orderHistoryView"/);
const homeHtml = homeViewMatch ? homeViewMatch[1] : '';

const headerMatch = currentHtml.match(/<nav class="navbar[\s\S]*?<\/nav>/);
const headerHtml = headerMatch ? headerMatch[0] : '';

const headerIds = [...headerHtml.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
const homeIds = [...homeHtml.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);

console.log('\n--- HEADER IDs ---');
console.log(JSON.stringify(headerIds, null, 2));

console.log('\n--- HOME VIEW IDs ---');
console.log(JSON.stringify(homeIds, null, 2));

// Check which of header and home IDs are in baseline
const headerBaseline = headerIds.filter(id => baselineIds.has(id));
const homeBaseline = homeIds.filter(id => baselineIds.has(id));

console.log('\n--- HEADER IDs in baseline (' + headerBaseline.length + ') ---');
console.log(headerBaseline.join(', '));

console.log('\n--- HOME IDs in baseline (' + homeBaseline.length + ') ---');
console.log(homeBaseline.join(', '));
