const fs = require('fs');
const path = require('path');

console.log('cwd:', process.cwd());
console.log('__dirname:', __dirname);

// Try to find page.tsx
const searchDirs = ['/', '/app', '/code', '/vercel', '/home', process.cwd(), __dirname, path.resolve(__dirname, '..')];

function findFile(dir, name, depth) {
  if (depth > 3) return [];
  let results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === name) results.push(full);
      if (entry.isDirectory()) results.push(...findFile(full, name, depth + 1));
    }
  } catch(e) {}
  return results;
}

for (const dir of searchDirs) {
  console.log('\nSearching:', dir);
  const found = findFile(dir, 'page.tsx', 0);
  if (found.length) console.log('FOUND:', found);
}
