import { execSync } from 'child_process';
import fs from 'fs';

const baselineHtml = execSync('git show 515e3ad:frontend/index.html', { encoding: 'utf8' });
const currentHtml = fs.readFileSync('frontend/index.html', 'utf8');

function extractIds(html) {
    const idRegex = /id=["']([^"']+)["']/g;
    const ids = [];
    let match;
    while ((match = idRegex.exec(html)) !== null) {
        ids.push(match[1]);
    }
    return ids;
}

const baselineIds = extractIds(baselineHtml);
const uniqueBaselineIds = [...new Set(baselineIds)];
console.log('Baseline total IDs found:', baselineIds.length);
console.log('Baseline unique IDs count:', uniqueBaselineIds.length);

const currentIds = extractIds(currentHtml);
const currentIdCounts = {};
currentIds.forEach(id => {
    currentIdCounts[id] = (currentIdCounts[id] || 0) + 1;
});
const duplicates = Object.entries(currentIdCounts).filter(([id, count]) => count > 1);

console.log('Current total IDs found:', currentIds.length);
console.log('Current unique IDs count:', Object.keys(currentIdCounts).length);
console.log('Current duplicates count:', duplicates.length);

const currentIdSet = new Set(currentIds);
const missingBaseline = uniqueBaselineIds.filter(id => !currentIdSet.has(id));
console.log('Missing baseline IDs in current:', missingBaseline.length);

const baselineIdSet = new Set(uniqueBaselineIds);
const addedIds = Object.keys(currentIdCounts).filter(id => !baselineIdSet.has(id));
console.log('New/Extended IDs count:', addedIds.length);
console.log('List of newly added IDs:', addedIds);
