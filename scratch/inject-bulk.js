const fs = require('fs');
const path = require('path');

const imports = `
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { SharedLogsTable } from '@/components/ui/SharedLogsTable';
import React, { useState, useEffect, useRef } from 'react';
import { Session } from '@/hooks/useProfile';
import { Pagination } from '@/components/Pagination';
import { useTranslations } from 'next-intl';
import {
  User,
  Mail,
  ShieldCheck,
  Camera,
  Check,
  Pencil,
  KeyRound,
  Save,
  Smartphone,
  Globe,
  LogOut,
  Clock3,
  Laptop,
  AlertCircle,
} from "lucide-react";
`;

function injectAll(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (f.endsWith('.tsx') && !f.includes('ProfileForms')) {
      let content = fs.readFileSync(p, 'utf8');
      
      content = content.replace(/import .* 'lucide-react';\n?/g, '');
      content = content.replace(/import React.*? 'react';\n?/g, '');
      content = content.replace(/import \{ useTranslations \} from 'next-intl';\n?/g, '');
      content = content.replace(/import \{ Session \} from '@\/hooks\/useProfile';\n?/g, '');
      content = content.replace(/import \{ Pagination \} from '@\/components\/Pagination';\n?/g, '');
      content = content.replace(/import \{ SharedLogsTable \} from '@\/components\/ui\/SharedLogsTable';\n?/g, '');
      
      let finalImports = imports;
      if (content.includes('parseUserAgent(') && !content.includes('function parseUserAgent')) {
        finalImports += `\nfunction parseUserAgent(ua: string) {
  if (!ua) return { os: 'Unknown OS', browser: 'Unknown Browser' };
  let os = 'Unknown OS', browser = 'Unknown Browser';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  return { os, browser };
}\n`;
      }
      
      content = finalImports + '\n' + content;
      fs.writeFileSync(p, content);
    }
  });
}

injectAll('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs');
injectAll('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/ui');
console.log('Done');
