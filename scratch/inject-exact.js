const fs = require('fs');

const overview = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs/OverviewTab.tsx';
let oContent = fs.readFileSync(overview, 'utf8');
if (!oContent.includes('import { Camera')) {
  oContent = "import { Camera, User, ShieldCheck, AlertCircle, Mail } from 'lucide-react';\nimport { InfoRow } from '../ui/InfoRow';\nimport { useTranslations } from 'next-intl';\n" + oContent;
  fs.writeFileSync(overview, oContent);
}

const security = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs/SecurityTab.tsx';
let sContent = fs.readFileSync(security, 'utf8');
if (!sContent.includes('import { ShieldCheck')) {
  sContent = "import { ShieldCheck, AlertCircle, KeyRound, Mail } from 'lucide-react';\nimport { SecurityItem } from '../ui/SecurityItem';\nimport { useTranslations } from 'next-intl';\n" + sContent;
  fs.writeFileSync(security, sContent);
}

console.log('Fixed exactly.');
