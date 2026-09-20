const fs = require('fs');
const path = require('path');

const overviewPath = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs/OverviewTab.tsx';
let overview = fs.readFileSync(overviewPath, 'utf8');
overview = overview.replace(/from 'lucide-react';/, ", Camera, User, ShieldCheck, AlertCircle } from 'lucide-react';");
if (!overview.includes("import { InfoRow }")) {
  overview = overview.replace(/from 'lucide-react';/, "from 'lucide-react';\nimport { InfoRow } from '../ui/InfoRow';");
}
fs.writeFileSync(overviewPath, overview);

const securityPath = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs/SecurityTab.tsx';
let security = fs.readFileSync(securityPath, 'utf8');
security = security.replace(/from 'lucide-react';/, ", ShieldCheck, AlertCircle } from 'lucide-react';");
if (!security.includes("import { SecurityItem }")) {
  security = security.replace(/from 'lucide-react';/, "from 'lucide-react';\nimport { SecurityItem } from '../ui/SecurityItem';");
}
fs.writeFileSync(securityPath, security);

const infoRowPath = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/ui/InfoRow.tsx';
let infoRow = fs.readFileSync(infoRowPath, 'utf8');
infoRow = infoRow.replace(/import React, \{ useState \} from 'react';/, "import React, { useState, useEffect, useRef } from 'react';");
infoRow = infoRow.replace(/from 'lucide-react';/, ", AlertCircle, Pencil } from 'lucide-react';");
fs.writeFileSync(infoRowPath, infoRow);

const profileFormsPath = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/ui/ProfileForms.tsx';
let profileForms = fs.readFileSync(profileFormsPath, 'utf8');
if (!profileForms.includes('useTranslations(')) {
  profileForms = "import { useTranslations } from 'next-intl';\n" + profileForms;
  profileForms = profileForms.replace(/export function ProfileInfoForm[^{]*\{/g, "$&\n  const t = useTranslations('Profile');");
  profileForms = profileForms.replace(/export function EmailChangeForm[^{]*\{/g, "$&\n  const t = useTranslations('Profile');");
  profileForms = profileForms.replace(/export function PasswordChangeForm[^{]*\{/g, "$&\n  const t = useTranslations('Profile');");
}
fs.writeFileSync(profileFormsPath, profileForms);

console.log('Fixed imports');
