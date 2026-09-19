const fs = require('fs');
const path = require('path');

const targetFiles = [
  'frontend/src/components/Sidebar.tsx',
  'frontend/src/components/Footer.tsx',
  'frontend/src/components/Modal.tsx'
];

const errorMap = {
  'Not authenticated': 'notAuthenticated',
  'Authentication required': 'authenticationRequired',
  'Failed': 'failed',
  'Failed to load usage data': 'failedToLoadUsageData',
  'Failed to load user resources': 'failedToLoadUserResources',
  'Failed to load servers': 'failedToLoadServers',
  'Failed to load earn info': 'failedToLoadEarnInfo',
  'Failed to start': 'failedToStart',
  'Failed to load panel information': 'failedToLoadPanelInformation',
  'Failed to reset password': 'failedToResetPassword',
  'Failed to load profile': 'failedToLoadProfile',
  'Failed to update profile picture': 'failedToUpdateProfilePicture',
  'Failed to revoke session': 'failedToRevokeSession',
  'Failed to send verification email': 'failedToSendVerificationEmail',
  'Failed to verify code': 'failedToVerifyCode',
  'Failed to load tickets': 'failedToLoadTickets',
  'Server not found': 'serverNotFound',
  'Update failed': 'updateFailed',
  'Failed to load creation data': 'failedToLoadCreationData',
  'Please fix the validation errors before saving': 'validationFixRequired',
  'Resource limits exceeded. Please check the validation errors below.': 'resourceLimitsExceeded',
  'Status fetch failed': 'statusFetchFailed'
};

for (const relPath of targetFiles) {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) {
    console.log("Missing " + relPath);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add import if missing
  if (!content.includes('useTranslations')) {
    if (content.includes('next-intl')) {
      content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]next-intl['"];/, (match, p1) => {
        return 'import { ' + p1 + ', useTranslations } from "next-intl";';
      });
    } else {
      content = content.replace(/(import.*react['"];?\n)/i, "$1import { useTranslations } from 'next-intl';\n");
    }
  }

  // Inject hook inside main function
  const funcRegex = /(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*{)/;
  if (funcRegex.test(content) && !content.includes('const tError = useTranslations')) {
    content = content.replace(funcRegex, "$1\n  const tError = useTranslations('GlobalErrors');");
  }

  for (const [text, key] of Object.entries(errorMap)) {
    // Regex strings
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // throw new Error("text")
    const regex1 = new RegExp(`throw new Error\\(['"]${escaped}['"]\\)`, 'g');
    if (regex1.test(content)) {
      content = content.replace(regex1, `throw new Error(tError('${key}'))`);
      changed = true;
    }

    // setError("text")
    const regex2 = new RegExp(`setError\\(['"]${escaped}['"]\\)`, 'g');
    if (regex2.test(content)) {
      content = content.replace(regex2, `setError(tError('${key}'))`);
      changed = true;
    }

    // throw new Error(x?.error || 'text')
    const regex3 = new RegExp(`throw new Error\\(([^)]+?)\\s*\\|\\|\\s*['"]${escaped}['"]\\)`, 'g');
    if (regex3.test(content)) {
      content = content.replace(regex3, `throw new Error($1 || tError('${key}'))`);
      changed = true;
    }
    
    // setError(String(e?.message || "Failed to load earn info"))
    const regex4 = new RegExp(`setError\\(String\\(([^)]+?)\\s*\\|\\|\\s*['"]${escaped}['"]\\)\\)`, 'g');
    if (regex4.test(content)) {
      content = content.replace(regex4, `setError(String($1 || tError('${key}')))`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + relPath);
  }
}
