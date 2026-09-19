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

  if (!content.includes('const tError = useTranslations')) {
    // Match export function useX(...) { or export const useX = (...) => {
    content = content.replace(/(export\s+(?:default\s+)?(?:function|const)\s+use[a-zA-Z0-9_]+\s*(?:=\s*)?\([^)]*\)\s*(?:=>\s*)?{)/, "$1\n  const tError = useTranslations('GlobalErrors');");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed tError in ' + relPath);
  }
}
