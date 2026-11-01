import fs from 'fs';

const currentHtml = fs.readFileSync('frontend/index.html', 'utf-8');

// Extract all ids from HEAD:frontend/index.html
import { execSync } from 'child_process';
const headHtml = execSync('git show HEAD:frontend/index.html').toString('utf-8');

const idRegex = /id=["']([^"']+)["']/g;
const headIds = new Set();
let match;
while ((match = idRegex.exec(headHtml)) !== null) {
  headIds.add(match[1]);
}

const currentIds = new Set();
while ((match = idRegex.exec(currentHtml)) !== null) {
  currentIds.add(match[1]);
}

console.log(`HEAD total IDs: ${headIds.size}`);
console.log(`Current total IDs: ${currentIds.size}`);

const missingFromHead = [];
for (const id of headIds) {
  if (!currentIds.has(id)) {
    missingFromHead.push(id);
  }
}

if (missingFromHead.length > 0) {
  console.error(`ERROR: The following ${missingFromHead.length} IDs from HEAD were removed or renamed:`);
  missingFromHead.forEach(id => console.error(`  - ${id}`));
} else {
  console.log('SUCCESS: 100% of IDs from HEAD are preserved in current frontend/index.html!');
}

process.exit(missingFromHead.length > 0 ? 1 : 0);
