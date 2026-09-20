const fs = require('fs');
const path = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/app/[locale]/profile/page.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('useTranslations(')) {
  content = content.replace(/import \{ useProfile \} from '@\/hooks\/useProfile';/, "import { useProfile } from '@/hooks/useProfile';\nimport { useTranslations } from 'next-intl';");
  content = content.replace(/export default function ProfilePage\(\)\s*\{/, "export default function ProfilePage() {\n  const t = useTranslations('Profile');");
}

content = content.replace(/>Profile Settings</g, `>{t('profileSettings')}<`);
content = content.replace(/>Manage your account details and security preferences.</g, `>{t('profileSettingsDesc')}<`);
content = content.replace(/>Balance</g, `>{t('balance')}<`);
content = content.replace(/>Account</g, `>{t('account')}<`);
content = content.replace(/>Account actions</g, `>{t('accountActions')}<`);

fs.writeFileSync(path, content);
console.log('Translated page.tsx');
