const fs = require('fs');
const path = require('path');

function removeDups(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (f.endsWith('.tsx') && !f.includes('ProfileForms')) {
      let content = fs.readFileSync(p, 'utf8');
      
      // Let's use a regex to aggressively strip all imports and then we manually prepend them!
      // Actually, wait, no. We just strip all imports of 'react', 'lucide-react', 'fetchWithRetry', 'Session', 'Pagination', 'SharedLogsTable', 'next-intl'
      // and we just prepend ONE block.
      
      content = content.replace(/^import\s+.*?\s+from\s+['"].*?['"];?\r?\n/gm, (match) => {
        if (match.includes('react') || match.includes('lucide-react') || match.includes('fetchWithRetry') || match.includes('useProfile') || match.includes('Pagination') || match.includes('SharedLogsTable') || match.includes('next-intl') || match.includes('ToastProvider') || match.includes('InfoRow') || match.includes('SecurityItem') || match.includes('userAgent')) {
          return '';
        }
        return match;
      });
      
      // Strip empty lines at top
      content = content.replace(/^\s+/, '');
      
      const imports = `
import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import { SharedLogsTable } from '@/components/ui/SharedLogsTable';
import { Pagination } from '@/components/Pagination';
import { Session } from '@/hooks/useProfile';
import { InfoRow } from '../ui/InfoRow';
import { SecurityItem } from '../ui/SecurityItem';
import {
  User, Mail, ShieldCheck, Camera, Check, Pencil, KeyRound, Save,
  Smartphone, Globe, LogOut, Clock3, Laptop, AlertCircle, Download, Loader2
} from "lucide-react";
`;
      
      content = imports + '\n' + content;
      fs.writeFileSync(p, content);
      console.log('Fixed', p);
    }
  });
}

removeDups('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/tabs');
removeDups('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/ui');
