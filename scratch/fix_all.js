const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Add import
  if (!content.includes('useTranslations')) {
    if (content.includes('"use client"')) {
      content = content.replace(/("use client";?\r?\n)/i, "$1import { useTranslations } from 'next-intl';\n");
    } else {
      content = "import { useTranslations } from 'next-intl';\n" + content;
    }
  }

  // Inject hook
  content = content.replace(/(export\s+(?:default\s+)?(?:function|const)\s+use[a-zA-Z0-9_]+\s*(?:=\s*)?\([^)]*\)\s*(?::\s*[a-zA-Z0-9_]+\s*)?(?:=>\s*)?{)/, "$1\n  const tError = useTranslations('GlobalErrors');");

  // Error mappings
  const errorMap = {
    'Failed to load dashboard data': 'failedToLoadDashboardData',
    'Failed to load panel information': 'failedToLoadPanelInformation',
    'Failed to reset password': 'failedToResetPassword',
    'Failed to load data': 'failedToLoadData',
    'Failed to create server': 'failedToCreateServer',
    'Failed to load items': 'failedToLoadItems',
    'Failed to load plans': 'failedToLoadPlans',
    'Failed to load tickets': 'failedToLoadTickets',
    'Unknown error': 'unknownError',
    'serverNotFound': 'serverNotFound',
    'validationFixRequired': 'validationFixRequired',
    'resourceLimitsExceeded': 'resourceLimitsExceeded',
    'updateFailed': 'updateFailed',
    'Server not found': 'serverNotFound',
    'Please fix the validation errors before saving': 'validationFixRequired',
    'Resource limits exceeded. Please check the validation errors below.': 'resourceLimitsExceeded',
    'Update failed': 'updateFailed'
  };

  for (const [text, key] of Object.entries(errorMap)) {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const regex1 = new RegExp(`throw new Error\\(['"]${escaped}['"]\\)`, 'g');
    content = content.replace(regex1, `throw new Error(tError('${key}'))`);
    
    const regex2 = new RegExp(`setError\\(['"]${escaped}['"]\\)`, 'g');
    content = content.replace(regex2, `setError(tError('${key}'))`);

    const regex3 = new RegExp(`throw new Error\\(([^)]+?)\\s*\\|\\|\\s*['"]${escaped}['"]\\)`, 'g');
    content = content.replace(regex3, `throw new Error($1 || tError('${key}'))`);

    const regex4 = new RegExp(`(setError|showError)\\((.*?)\\s*\\|\\|\\s*['"]${escaped}['"]\\)`, 'g');
    content = content.replace(regex4, `$1($2 || tError('${key}'))`);
    
    const regex5 = new RegExp(`(setError|showError)\\((.*?)\\?\\s*(.*?)\\s*:\\s*['"]${escaped}['"]\\)`, 'g');
    content = content.replace(regex5, `$1($2 ? $3 : tError('${key}'))`);
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log("Fixed " + file);
}

[
  'frontend/src/hooks/useServerEdit.tsx',
  'frontend/src/hooks/useTickets.ts',
  'frontend/src/hooks/useAuthSettings.ts'
].forEach(fix);

