const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // ensure import
  if (!content.includes('useTranslations')) {
    content = "import { useTranslations } from 'next-intl';\n" + content;
  }
  
  // ensure tError definition
  const funcRegex = /(export\s+(?:default\s+)?(?:function|const)\s+use[a-zA-Z0-9_]+\s*(?:=\s*)?\([^)]*\)\s*(?:=>\s*(?:{|(?:\([^)]*\))))?)/;
  if (funcRegex.test(content) && !content.includes('const tError = useTranslations')) {
    content = content.replace(funcRegex, "$1\n  const tError = useTranslations('GlobalErrors');\n");
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log("Fixed " + file);
}

[
  'frontend/src/hooks/useAuthSettings.ts',
  'frontend/src/hooks/useDashboard.ts',
  'frontend/src/hooks/usePanel.ts',
  'frontend/src/hooks/useServerCreate.ts',
  'frontend/src/hooks/useServerEdit.tsx',
  'frontend/src/hooks/useTickets.ts'
].forEach(fixFile);

