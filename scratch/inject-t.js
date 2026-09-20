const fs = require('fs');

function injectT(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("const t = useTranslations('Profile');")) {
    content = content.replace(/export function [A-Za-z0-9_]+\([\s\S]*?\)\s*\{/, "$&\n  const t = useTranslations('Profile');\n");
    fs.writeFileSync(file, content);
    console.log('Injected t into', file);
  }
}

injectT('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs/OverviewTab.tsx');
injectT('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs/SecurityTab.tsx');
injectT('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs/ActiveSessionsTab.tsx');
injectT('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs/InvoicesTab.tsx');
injectT('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs/ActivityLogSection.tsx');
