const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/drawers';
fs.readdirSync(dir).forEach(f => {
  if (f.endsWith('.tsx')) {
    let content = fs.readFileSync(path.join(dir, f), 'utf8');
    
    // Remove the bad injections in arguments
    content = content.replace(/\{\s*const tErrorBackend = useTranslations\('BackendErrors'\);\s*/, '{ ');
    content = content.replace(/\{\s*const t = useTranslations\('Profile'\);\s*/, '{ ');
    
    // Also remove any missing next-intl import if we stripped it
    if (!content.includes('import { useTranslations }')) {
      content = "import { useTranslations } from 'next-intl';\n" + content;
    }
    
    // Re-inject safely at the top of the function BODY
    content = content.replace(/(\)\s*\{)\s*/, "$1\n  const t = useTranslations('Profile');\n  const tErrorBackend = useTranslations('BackendErrors');\n");
    
    // Some components might have duplicated these because of multiple runs, let's deduplicate body
    const bodyMatch = content.match(/const tErrorBackend = useTranslations\('BackendErrors'\);/g);
    if (bodyMatch && bodyMatch.length > 1) {
      content = content.replace(/const tErrorBackend = useTranslations\('BackendErrors'\);\s*/, '');
    }
    const tMatch = content.match(/const t = useTranslations\('Profile'\);/g);
    if (tMatch && tMatch.length > 1) {
      content = content.replace(/const t = useTranslations\('Profile'\);\s*/, '');
    }

    fs.writeFileSync(path.join(dir, f), content);
    console.log('Fixed signature in', f);
  }
});
