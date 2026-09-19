const fs = require('fs');
const path = require('path');

const targetFiles = [
  'frontend/src/hooks/useServerEdit.tsx',
  'frontend/src/hooks/useDashboard.ts',
  'frontend/src/hooks/useEarn.ts',
  'frontend/src/hooks/usePanel.ts',
  'frontend/src/hooks/useProfile.ts',
  'frontend/src/hooks/useServerCreate.ts',
  'frontend/src/hooks/useShop.ts',
  'frontend/src/hooks/useTickets.ts'
];

for (const relPath of targetFiles) {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if it has the import
  if (!content.match(/import\s+{.*useTranslations.*}\s+from\s+['"]next-intl['"]/)) {
    // Add the import at the top
    content = content.replace(/("use client";\r?\n)/i, "$1import { useTranslations } from 'next-intl';\n");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed import in ' + relPath);
  }
}
