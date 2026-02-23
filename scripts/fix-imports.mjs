import fs from 'fs';

const filePath = './app/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix 1: Remove the duplicate "import { Minus } from 'lucide-react';" line
// and add Minus to the main import block
content = content.replace(
  /import \{ Minus \} from "lucide-react";\nimport \{/,
  'import {\n  Minus,'
);

// Fix 2: Add starred to Tutorial interface if missing
if (!content.includes('starred?: boolean;')) {
  content = content.replace(
    '  locked?: boolean;\n}',
    '  locked?: boolean;\n  starred?: boolean;\n}'
  );
}

// Fix 3: Add toggleStar if missing
if (!content.includes('const toggleStar')) {
  content = content.replace(
    `const toggleLock = (id: string) => {
    setTutorials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, locked: !t.locked } : t))
    );
  };`,
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
const minusImports = (fixed.match(/Minus/g) || []).length;
const lucideImports = (fixed.match(/from "lucide-react"/g) || []).length;
const gripVerticalCount = (fixed.match(/GripVertical/g) || []).length;
const handleDragStartCount = (fixed.match(/const handleDragStart/g) || []).length;
const handleDragOverCount = (fixed.match(/const handleDragOver/g) || []).length;
const handleDropCount = (fixed.match(/const handleDrop/g) || []).length;
const toggleStarCount = (fixed.match(/const toggleStar/g) || []).length;
const starredCount = (fixed.match(/starred\?: boolean/g) || []).length;

console.log('=== VERIFICATION ===');
console.log(`lucide-react import statements: ${lucideImports} (should be 1)`);
console.log(`Minus references: ${minusImports} (should be >= 2)`);
console.log(`GripVertical references: ${gripVerticalCount} (should be >= 2)`);
console.log(`handleDragStart definitions: ${handleDragStartCount} (should be 1)`);
console.log(`handleDragOver definitions: ${handleDragOverCount} (should be 1)`);
console.log(`handleDrop definitions: ${handleDropCount} (should be 1)`);
console.log(`toggleStar definitions: ${toggleStarCount} (should be 1)`);
console.log(`starred in interface: ${starredCount} (should be 1)`);

if (lucideImports === 1 && handleDragStartCount === 1 && handleDragOverCount === 1 && handleDropCount === 1) {
  console.log('\nSUCCESS: All duplicates fixed!');
} else {
  console.log('\nWARNING: Some issues remain');
}
