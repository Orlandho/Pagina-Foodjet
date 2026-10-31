const { execSync } = require('child_process');
const fs = require('fs');

const headHtml = execSync('git show HEAD:frontend/index.html', { encoding: 'utf8' });
const workHtml = fs.readFileSync('frontend/index.html', 'utf8');

const idRegex = /id=["']([^"']+)["']/g;
const headIds = new Set();
let match;
while ((match = idRegex.exec(headHtml)) !== null) {
  headIds.add(match[1]);
}

const workIds = new Set();
while ((match = idRegex.exec(workHtml)) !== null) {
  workIds.add(match[1]);
}

const removedIds = [...headIds].filter(id => !workIds.has(id));
console.log('Total HEAD IDs:', headIds.size);
console.log('Total Working Tree IDs:', workIds.size);
console.log('Removed IDs count:', removedIds.length);
if (removedIds.length > 0) {
  console.log('REMOVED IDS:', removedIds);
  process.exit(1);
} else {
  console.log('ALL HEAD DOM IDs 100% PRESERVED!');
}
