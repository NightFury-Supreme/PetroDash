/* ==========================================================================
   Banned Actions Component
   Compliance: ISO/IEC 25010, User Experience
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import type { BannedActionsProps } from './types';

export function BannedActions({ onLogout }: BannedActionsProps) {
  const t = useTranslations('Banned');

  return (
    <button
      type="button"
      onClick={onLogout}
      className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer"
    >
      <LogOut size={14} />
      <span>{t('btnLogout')}</span>
    </button>
  );
}
