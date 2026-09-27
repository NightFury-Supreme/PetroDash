/* ==========================================================================
   Banned Actions Component
   Compliance: ISO/IEC 25010, User Experience
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { LogOut, RefreshCw } from 'lucide-react';
import type { BannedActionsProps } from './types';

export function BannedActions({ onLogout, onRefresh, checking }: BannedActionsProps) {
  const t = useTranslations('Banned');

  return (
    <>
      {/* Primary Action: Logout */}
      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer"
      >
        <LogOut size={14} />
        <span>{t('btnLogout')}</span>
      </button>

      {/* Secondary Action: Refresh / Check Status */}
      <button
        type="button"
        onClick={onRefresh}
        disabled={checking}
        className="flex items-center gap-2 bg-[#1A1A1A] border border-[#222] text-[#888] hover:text-[#D4D4D4] px-4 py-2 rounded-md text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <RefreshCw size={14} className={checking ? 'animate-spin text-[#FF5722]' : ''} />
        <span>{checking ? t('checkingStatus') : t('btnCheckStatus')}</span>
      </button>
    </>
  );
}
