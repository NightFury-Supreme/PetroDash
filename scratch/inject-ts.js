const fs = require('fs');
const path = require('path');

function injectTop(file, importStr) {
  let content = fs.readFileSync(file, 'utf8');
  // Check if it's already there to prevent duplicates
  if (!content.includes(importStr.split(' ')[1])) {
    content = importStr + '\n' + content;
    fs.writeFileSync(file, content);
    console.log('Injected into', file);
  }
}

const overview = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs/OverviewTab.tsx';
injectTop(overview, "import { Camera, User, ShieldCheck, AlertCircle, Mail } from 'lucide-react';\nimport { InfoRow } from '../ui/InfoRow';\nimport { useTranslations } from 'next-intl';");

const security = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs/SecurityTab.tsx';
injectTop(security, "import { ShieldCheck, AlertCircle, KeyRound, Mail } from 'lucide-react';\nimport { SecurityItem } from '../ui/SecurityItem';\nimport { useTranslations } from 'next-intl';");

const profileForms = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/ui/ProfileForms.tsx';
let pfc = fs.readFileSync(profileForms, 'utf8');
if (!pfc.includes('useTranslations(')) {
  pfc = "import { useTranslations } from 'next-intl';\n" + pfc;
  fs.writeFileSync(profileForms, pfc);
}

const infoRow = 'c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/ui/InfoRow.tsx';
// infoRow might need React useEffect etc
let ir = fs.readFileSync(infoRow, 'utf8');
if (!ir.includes('useRef')) {
  ir = ir.replace(/import React, \{ useState \} from 'react';/, "import React, { useState, useEffect, useRef } from 'react';");
  fs.writeFileSync(infoRow, ir);
}
// InfoRow also needs AlertCircle and Pencil and Check and Save
if (!ir.includes('AlertCircle')) {
  injectTop(infoRow, "import { AlertCircle, Pencil, Check, Save } from 'lucide-react';");
}

console.log('Done robust injections');
