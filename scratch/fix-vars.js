const fs = require('fs');
const path = require('path');

function fix(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (f.endsWith('.tsx')) {
      let content = fs.readFileSync(p, 'utf8');
      
      // Inject useMemo
      if (!content.includes('useMemo')) {
        content = content.replace(/useState, useEffect, useRef \}/, "useState, useEffect, useRef, useMemo }");
      }
      
      // Inject tErrorBackend
      if (content.includes('tErrorBackend') && !content.includes("const tErrorBackend = useTranslations('BackendErrors')")) {
        content = content.replace(/export function .*?\{/, "$&\n  const tErrorBackend = useTranslations('BackendErrors');\n");
      }
      
      // Inject t
      if (content.includes('t(') && !content.includes("const t = useTranslations('Profile')")) {
        content = content.replace(/export function .*?\{/, "$&\n  const t = useTranslations('Profile');\n");
      }
      
      fs.writeFileSync(p, content);
      console.log('Fixed', p);
    }
  });
}

fix('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/drawers');
fix('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs');
fix('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/ui');
