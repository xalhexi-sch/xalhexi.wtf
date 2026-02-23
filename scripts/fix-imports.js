const fs = require('fs');
const path = require('path');

try { console.log('/code contents:', fs.readdirSync('/code')); } catch(e) { console.log('/code not found'); }
try { console.log('/code/app:', fs.readdirSync('/code/app')); } catch(e) { console.log('/code/app not found'); }
try { console.log('/tmp:', fs.readdirSync('/tmp').slice(0,10)); } catch(e) {}

function findFile(dir, name, depth = 0) {
  if (depth > 4) return null;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === name) return fullPath;
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const result = findFile(fullPath, name, depth + 1);
        if (result) return result;
      }
    }
  } catch(e) {}
  return null;
}

const filePath = findFile('/code', 'page.tsx') || findFile('/tmp', 'page.tsx');
if (!filePath) { console.error('Could not find page.tsx!'); process.exit(1); }
console.log('Found:', filePath);
let content = fs.readFileSync(filePath, 'utf-8');

console.log('=== BEFORE FIX ===');
const beforeLucideImports = (content.match(/from "lucide-react"/g) || []).length;
console.log(`lucide-react import statements: ${beforeLucideImports}`);

// Fix 1: Remove the duplicate "import { Minus } from 'lucide-react';" line
// and add Minus to the main import block
content = content.replace(
  /import \{ Minus \} from "lucide-react";\nimport \{/,
  'import {\n  Minus,'
);

// Also handle single-quote variant
content = content.replace(
  /import \{ Minus \} from 'lucide-react';\nimport \{/,
  'import {\n  Minus,'
);

// Fix 2: Add starred to Tutorial interface if missing
if (!content.includes('starred?: boolean;')) {
  content = content.replace(
    /  locked\?: boolean;\n\}/,
    '  locked?: boolean;\n  starred?: boolean;\n}'
  );
}

// Fix 3: Add toggleStar if missing
if (!content.includes('const toggleStar')) {
  content = content.replace(
    /const toggleLock = \(id: string\) => \{\n    setTutorials\(\(prev\) =>\n      prev\.map\(\(t\) => \(t\.id === id \? \{ \.\.\.t, locked: !t\.locked \} : t\)\)\n    \);\n  \};/,
    `const toggleLock = (id: string) => {
    setTutorials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, locked: !t.locked } : t))
    );
  };

  const toggleStar = (id: string) => {
    setTutorials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t))
    );
  };`
  );
}

fs.writeFileSync(filePath, content, 'utf-8');

// Verify the fix
const fixed = fs.readFileSync(filePath, 'utf-8');
const lucideImports = (fixed.match(/from "lucide-react"/g) || []).length;
const gripVerticalCount = (fixed.match(/GripVertical/g) || []).length;
const handleDragStartCount = (fixed.match(/const handleDragStart/g) || []).length;
const handleDragOverCount = (fixed.match(/const handleDragOver/g) || []).length;
const handleDropCount = (fixed.match(/const handleDrop/g) || []).length;
const toggleStarCount = (fixed.match(/const toggleStar/g) || []).length;
const starredCount = (fixed.match(/starred\?: boolean/g) || []).length;

console.log('\n=== AFTER FIX ===');
console.log(`lucide-react import statements: ${lucideImports} (should be 1)`);
console.log(`GripVertical references: ${gripVerticalCount} (should be >= 2)`);
console.log(`handleDragStart definitions: ${handleDragStartCount} (should be 1)`);
console.log(`handleDragOver definitions: ${handleDragOverCount} (should be 1)`);
console.log(`handleDrop definitions: ${handleDropCount} (should be 1)`);
console.log(`toggleStar definitions: ${toggleStarCount} (should be 1)`);
console.log(`starred in interface: ${starredCount} (should be 1)`);

if (lucideImports === 1 && handleDragStartCount === 1 && handleDragOverCount === 1 && handleDropCount === 1) {
  console.log('\nSUCCESS: All duplicates fixed! App should compile now.');
} else {
  console.log('\nWARNING: Some issues remain');
}
