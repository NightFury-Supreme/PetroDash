const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile';
const messagesDir = 'c:/Users/Edwin Jilson/Downloads/project/frontend/messages';

let enJson = JSON.parse(fs.readFileSync(path.join(messagesDir, 'en.json'), 'utf8'));

if (!enJson.Profile) enJson.Profile = {};

const map = {
  'Overview': 'overview',
  'Manage your profile information and account details.': 'overviewDesc',
  'Avatar URL': 'avatarUrl',
  'Your profile picture URL.': 'avatarUrlDesc',
  'Not set': 'notSet',
  'Username': 'username',
  'Your unique username.': 'usernameDesc',
  'Full name': 'fullName',
  'The name displayed on your account.': 'fullNameDesc',
  'First name': 'firstName',
  'Last name': 'lastName',
  'Email address': 'emailAddress',
  'Used for account communication.': 'emailAddressDesc',
  'Security': 'security',
  'Manage your account security and authentication methods.': 'securityDesc',
  'Active Sessions': 'activeSessions',
  'Manage devices currently logged into your account.': 'activeSessionsDesc',
  'Invoices': 'invoices',
  'View and manage your billing history.': 'invoicesDesc',
  'Activity Log': 'activityLog',
  'Recent actions performed on your account.': 'activityLogDesc',
  'Password': 'password',
  'Two-Factor Auth': 'tfa',
  'Change Email': 'changeEmail',
  'Save': 'save',
  'Cancel': 'cancel',
  'Edit': 'edit',
  'Delete Account': 'deleteAccount'
};

Object.entries(map).forEach(([k, v]) => {
  enJson.Profile[v] = k;
});

fs.writeFileSync(path.join(messagesDir, 'en.json'), JSON.stringify(enJson, null, 2) + '\n');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  if (!content.includes('useTranslations(')) {
    content = content.replace(/(export function [A-Za-z0-9_]+\([^)]*\)\s*\{)/, "import { useTranslations } from 'next-intl';\n$1\n  const t = useTranslations('Profile');\n");
    changed = true;
  }
  
  for (const [english, key] of Object.entries(map)) {
    const regex = new RegExp('>' + english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '<', 'g');
    if (content.match(regex)) {
      content = content.replace(regex, `>{t('${key}')}<`);
      changed = true;
    }
    
    const attrRegex = new RegExp('="' + english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"', 'g');
    if (content.match(attrRegex)) {
      content = content.replace(attrRegex, `={t('${key}')}`);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Translated:', filePath);
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
