const fs = require('fs');
const path = require('path');

const imports = `
import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import { Drawer } from '@/components/ui/Drawer';
import { ValidationMsg } from '../ui/ValidationMsg';
import {
  User, Mail, ShieldCheck, Camera, Check, Pencil, KeyRound, Save, ArrowRight, Copy, CheckCircle2, AlertTriangle,
  Smartphone, Globe, LogOut, Clock3, Laptop, AlertCircle, Download, Loader2, X, Lock
} from "lucide-react";
`;

function fixDrawers(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (f.endsWith('.tsx')) {
      let content = fs.readFileSync(p, 'utf8');
      
      content = content.replace(/^import\s+.*?\s+from\s+['"].*?['"];?\r?\n/gm, (match) => {
        if (match.includes('react') || match.includes('lucide-react') || match.includes('fetchWithRetry') || match.includes('useToast') || match.includes('ToastProvider') || match.includes('ValidationMsg') || match.includes('next-intl') || match.includes('@/components/ui/Drawer')) {
          return '';
        }
        return match;
      });
      content = content.replace(/^\s+/, '');
      
      content = imports + '\n' + content;
      fs.writeFileSync(p, content);
      console.log('Fixed', p);
    }
  });
}

fixDrawers('c:/Users/Edwin Jilson/Downloads/project/frontend/src/components/profile/drawers');
