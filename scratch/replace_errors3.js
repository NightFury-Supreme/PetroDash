const fs = require('fs');
const path = require('path');

const targetFiles = [
  'frontend/src/hooks/useDashboard.ts',
  'frontend/src/hooks/usePanel.ts',
  'frontend/src/hooks/useServerCreate.ts',
  'frontend/src/hooks/useShop.ts',
  'frontend/src/hooks/useTickets.ts',
  'frontend/src/hooks/useAuthSettings.ts'
];

const errorMap = {
  'Failed to load dashboard data': 'failedToLoadDashboardData',
  'Failed to load panel information': 'failedToLoadPanelInformation',
  'Failed to reset password': 'failedToResetPassword',
  'Failed to load data': 'failedToLoadData',
  'Failed to create server': 'failedToCreateServer',
  'Failed to load items': 'failedToLoadItems',
  'Failed to load plans': 'failedToLoadPlans',
  'Failed to load tickets': 'failedToLoadTickets',
  'Unknown error': 'unknownError'
};

for (const relPath of targetFiles) {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [text, key] of Object.entries(errorMap)) {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // setError(err.message || 'text')
    const regex1 = new RegExp(`(setError|showError)\\((.*?)\\s*\\|\\|\\s*['"]${escaped}['"]\\)`, 'g');
    if (regex1.test(content)) {
      content = content.replace(regex1, `$1($2 || tError('${key}'))`);
      changed = true;
    }
    
    // setError(err instanceof Error ? err.message : 'text')
    const regex2 = new RegExp(`(setError|showError)\\((.*?)\\?\\s*(.*?)\\s*:\\s*['"]${escaped}['"]\\)`, 'g');
    if (regex2.test(content)) {
      content = content.replace(regex2, `$1($2 ? $3 : tError('${key}'))`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + relPath);
  }
}
