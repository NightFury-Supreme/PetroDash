const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  if (content.includes('showError(')) {
    if (!content.includes('tErrorBackend')) {
      content = content.replace(/const t = useTranslations\('Profile'\);/, "const t = useTranslations('Profile');\n  const tErrorBackend = useTranslations('BackendErrors');");
      changed = true;
    }
    
    // Replace showError(e.message || ...) with showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || 'Error'))
    // Actually, fetchWithRetry in tickets handles Zod via e.details...
    // Let's replace showError(e.message || 'An error occurred') with generic parser
    const genericParser = `
        const errorKey = e.details?.[0]?.[0]?.message || e.details?.[0]?.message || e.message;
        showError(tErrorBackend.has(errorKey) ? tErrorBackend(errorKey) : (e.message || t('errorOccurred')));
    `;
    
    content = content.replace(/showError\(e\.message[^)]*\);/g, `
        const errKey = e.details?.[0]?.message || e.message;
        showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (e.message || 'An error occurred'));
    `);
    
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Patched errors in:', filePath);
  }
}

function traverse(dir) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) traverse(p);
    else if (p.endsWith('.tsx')) processFile(p);
  });
}

traverse(srcDir);
