const cp = require('child_process');
const fs = require('fs');

const oldHtml = cp.execSync('git show HEAD:frontend/index.html', { encoding: 'utf8' });
const newHtml = fs.readFileSync('frontend/index.html', 'utf8');

function extractIds(html) {
  const regex = /id=["']([^"']+)["']/g;
  const ids = new Set();
  let m;
  while ((m = regex.exec(html)) !== null) {
    ids.add(m[1]);
  }
  return ids;
}

const oldIds = extractIds(oldHtml);
const newIds = extractIds(newHtml);

console.log('Old IDs total:', oldIds.size);
console.log('New IDs total:', newIds.size);

const missing = [];
for (const id of oldIds) {
  if (!newIds.has(id)) {
    missing.push(id);
  }
}

console.log('Missing IDs from HEAD (' + missing.length + '):', missing);

const added = [];
for (const id of newIds) {
  if (!oldIds.has(id)) {
    added.push(id);
  }
}
console.log('Added IDs (' + added.length + '):', added);
