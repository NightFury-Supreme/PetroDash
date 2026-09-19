const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../frontend/messages');
const srcDir = path.join(__dirname, '../frontend/src');

// 1. Process JSON Files
const jsonFiles = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

for (const file of jsonFiles) {
  const p = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  
  if (!data.Common) data.Common = {};
  
  // Helper to extract a value and optionally delete the old key
  // Safe extraction (in case some keys are already missing)
  const extract = (paths, commonKey) => {
    let value = null;
    for (const dPath of paths) {
      const parts = dPath.split('.');
      let current = data;
      let valid = true;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) { valid = false; break; }
        current = current[parts[i]];
      }
      if (valid && current[parts[parts.length - 1]]) {
        if (!value) value = current[parts[parts.length - 1]]; // capture the first found value
        delete current[parts[parts.length - 1]]; // delete from original location
      }
    }
    if (value) {
      data.Common[commonKey] = value;
    }
  };

  extract(['Tickets.cancel', 'Gift.cancel', 'Referrals.cancel', 'Auth.verify.cancelButton', 'Dashboard.cancel', 'Shop.cancel', 'UI.deleteDrawer.cancel'], 'cancel');
  extract(['Tickets.status', 'Dashboard.colStatus', 'UI.status', 'Gift.tableStatus', 'Referrals.tableStatus', 'Referrals.status'], 'status');
  extract(['Tickets.loading', 'Auth.register.submittingButton'], 'loading');
  extract(['Dashboard.saving', 'Referrals.saving'], 'saving');
  extract(['Auth.verify.updatingButton', 'Auth.forgot.updating'], 'updating');
  extract(['Auth.verify.sending', 'Auth.forgot.submitting'], 'sending');
  extract(['Shop.retry', 'Tickets.retry', 'Footer.retry'], 'retry');
  extract(['Panel.copy', 'Gift.copy', 'Referrals.copy'], 'copy');
  extract(['Shop.action', 'Dashboard.colAction', 'UI.action', 'Panel.colAction', 'Gift.tableAction'], 'action');
  extract(['Referrals.tableUser', 'Dashboard.user'], 'user');
  extract(['Panel.password', 'Auth.common.passwordLabel'], 'password');
  extract(['Panel.emailAddress', 'Auth.common.emailLabel'], 'email');
  extract(['Shop.success', 'UI.toast.success'], 'success');
  extract(['Gift.statusActive', 'Dashboard.statusActive'], 'active');
  extract(['Tickets.pending', 'Referrals.pending'], 'pending');
  extract(['Shop.resource', 'ErrorState.defaultResource', 'Dashboard.resourceUsage'], 'resource');
  extract(['Dashboard.refresh', 'Panel.refresh'], 'refresh');
  extract(['Dashboard.back', 'Auth.common.back'], 'back');
  extract(['Dashboard.unknown'], 'unknown');

  // Edge cases / missed duplicates during previous cleanup
  extract(['Auth.forgot.codeLabel', 'Auth.common.codeLabel'], 'verificationCode');

  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}
console.log('JSON deduplication complete.');

// 2. Process TSX Files
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const tsxFiles = walk(srcDir);

const replacers = [
  { regex: /t\(['"]cancel(?:Button)?['"]\)/g, replacement: "tCommon('cancel')" },
  { regex: /t\(['"](?:col|table)?status['"]\)/gi, replacement: "tCommon('status')" },
  { regex: /t\(['"](?:submittingButton|loading)['"]\)/g, replacement: "tCommon('loading')" },
  { regex: /t\(['"]saving['"]\)/g, replacement: "tCommon('saving')" },
  { regex: /t\(['"]updating(?:Button)?['"]\)/g, replacement: "tCommon('updating')" },
  { regex: /t\(['"](?:submitting|sending)['"]\)/g, replacement: "tCommon('sending')" },
  { regex: /t\(['"]retry['"]\)/g, replacement: "tCommon('retry')" },
  { regex: /t\(['"]copy['"]\)/g, replacement: "tCommon('copy')" },
  { regex: /t\(['"](?:col|table)?action['"]\)/gi, replacement: "tCommon('action')" },
  { regex: /t\(['"](?:table)?user['"]\)/gi, replacement: "tCommon('user')" },
  { regex: /t\(['"](?:passwordLabel|password)['"]\)/g, replacement: "tCommon('password')" },
  { regex: /t\(['"](?:emailLabel|emailAddress)['"]\)/g, replacement: "tCommon('email')" },
  { regex: /t\(['"]success['"]\)/g, replacement: "tCommon('success')" },
  { regex: /t\(['"]statusActive['"]\)/g, replacement: "tCommon('active')" },
  { regex: /t\(['"]pending['"]\)/g, replacement: "tCommon('pending')" },
  { regex: /t\(['"](?:defaultResource|resourceUsage|resource)['"]\)/g, replacement: "tCommon('resource')" },
  { regex: /t\(['"]refresh['"]\)/g, replacement: "tCommon('refresh')" },
  { regex: /t\(['"]back['"]\)/g, replacement: "tCommon('back')" },
  { regex: /t\(['"]unknown['"]\)/g, replacement: "tCommon('unknown')" }
];

let changedCount = 0;

for (const file of tsxFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  for (const r of replacers) {
    content = content.replace(r.regex, r.replacement);
  }

  if (content !== originalContent) {
    // Determine if we need to inject tCommon
    if (!content.includes("useTranslations('Common')") && !content.includes('useTranslations("Common")')) {
      // Find where 't' is defined
      const useTranslationsMatch = content.match(/(const \s*\w+\s*=\s*useTranslations\([^)]+\);)/);
      if (useTranslationsMatch) {
        content = content.replace(useTranslationsMatch[1], useTranslationsMatch[1] + "\n  const tCommon = useTranslations('Common');");
      } else {
        // Just slap it inside the component (risky, but usually useTranslations exists if t() is used)
        console.warn(`WARNING: Could not auto-inject tCommon in ${file}`);
      }
    }
    
    // Check if next-intl is imported
    if (!content.includes("next-intl")) {
      content = "import { useTranslations } from 'next-intl';\n" + content;
    }

    fs.writeFileSync(file, content);
    changedCount++;
  }
}

console.log(`TSX deduplication complete. Updated ${changedCount} files.`);
