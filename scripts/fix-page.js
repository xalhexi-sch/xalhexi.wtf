const fs = require('fs');

const filePath = '/vercel/share/v0-project/app/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

console.log('=== BEFORE ===');
console.log('lucide-react imports:', (content.match(/from "lucide-react"/g) || []).length);
console.log('handleDragStart defs:', (content.match(/const handleDragStart/g) || []).length);
console.log('handleDragOver defs:', (content.match(/const handleDragOver/g) || []).length);
console.log('handleDrop defs:', (content.match(/const handleDrop/g) || []).length);
console.log('toggleStar defs:', (content.match(/const toggleStar/g) || []).length);
console.log('starred in interface:', (content.match(/starred\?: boolean/g) || []).length);

// Fix 1: Merge duplicate lucide-react imports
content = content.replace(
  /import \{ Minus \} from "lucide-react";\nimport \{/,
  'import {\n  Minus,'
);

// Fix 2: Ensure starred in interface
if (!content.includes('starred?: boolean')) {
  content = content.replace(
    /(locked\?: boolean;)\n(\})/m,
    '$1\n  starred?: boolean;\n$2'
  );
}

// Fix 3: Ensure toggleStar exists
if (!content.includes('const toggleStar')) {
  content = content.replace(
    /(const toggleLock = \(id: string\) => \{[^}]*\}[^}]*\};)/,
    '$1\n\n  const toggleStar = (id: string) => {\n    setTutorials((prev) =>\n      prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t))\n    );\n  };'
  );
}

fs.writeFileSync(filePath, content);

// Verify
const fixed = fs.readFileSync(filePath, 'utf-8');
console.log('\n=== AFTER ===');
console.log('lucide-react imports:', (fixed.match(/from "lucide-react"/g) || []).length);
console.log('handleDragStart defs:', (fixed.match(/const handleDragStart/g) || []).length);
console.log('handleDragOver defs:', (fixed.match(/const handleDragOver/g) || []).length);
console.log('handleDrop defs:', (fixed.match(/const handleDrop/g) || []).length);
console.log('toggleStar defs:', (fixed.match(/const toggleStar/g) || []).length);
console.log('starred in interface:', (fixed.match(/starred\?: boolean/g) || []).length);
console.log('DONE');
