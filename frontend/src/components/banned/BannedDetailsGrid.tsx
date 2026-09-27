/* ==========================================================================
   Banned Details Grid Component
   Replaces single box container with a responsive multi-card grid UI
   matching the dashboard resource tab aesthetic.
   Compliance: ISO/IEC 25010, WCAG 2.1 (Accessibility)
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert, Calendar, AlertCircle, HelpCircle } from 'lucide-react';
import type { BannedDetailsGridProps } from './types';

export function BannedDetailsGrid({ reason, untilText }: BannedDetailsGridProps) {
  const t = useTranslations('Banned');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[620px] mx-auto mt-6 text-left">
      {/* Card 1: Suspension Reason */}
      <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-[#777] uppercase tracking-wider font-semibold">
            {t('reasonLabel')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#FF5722]/10 border border-[#FF5722]/20 flex items-center justify-center text-[#FF5722] shrink-0">
            <AlertCircle size={15} />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white break-words">
            {reason || t('noReasonProvided')}
          </p>
          <p className="text-[11px] text-[#777] mt-1.5 leading-relaxed">
            {t('reasonNote')}
          </p>
        </div>
      </div>

      {/* Card 2: Ban Duration / Expiration */}
      <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-[#777] uppercase tracking-wider font-semibold">
            {t('statusLabel')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#FF5722]/10 border border-[#FF5722]/20 flex items-center justify-center text-[#FF5722] shrink-0">
            <Calendar size={15} />
          </div>
        </div>
        <div>
          <div>
            {untilText ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FF5722]/10 text-[#FF5722] border border-[#FF5722]/20">
                {t('bannedUntil', { date: untilText })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FF4444]/10 text-[#FF4444] border border-[#FF4444]/20">
                {t('lifetimeBan')}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#777] mt-2 leading-relaxed">
            {untilText ? t('temporaryNotice') : t('permanentNotice')}
          </p>
        </div>
      </div>

      {/* Card 3: Restriction Scope */}
      <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-[#777] uppercase tracking-wider font-semibold">
            {t('scopeLabel')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#FF5722]/10 border border-[#FF5722]/20 flex items-center justify-center text-[#FF5722] shrink-0">
            <ShieldAlert size={15} />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {t('scopeTitle')}
          </p>
          <p className="text-[11px] text-[#777] mt-1.5 leading-relaxed">
            {t('scopeDescription')}
          </p>
        </div>
      </div>

      {/* Card 4: Support & Appeal */}
      <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-[#777] uppercase tracking-wider font-semibold">
            {t('appealLabel')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#FF5722]/10 border border-[#FF5722]/20 flex items-center justify-center text-[#FF5722] shrink-0">
            <HelpCircle size={15} />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {t('appealTitle')}
          </p>
          <p className="text-[11px] text-[#777] mt-1.5 leading-relaxed">
            {t('contactSupport')}
          </p>
          <p className="text-[10px] text-[#555] mt-1">
            {t('appealHint')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default BannedDetailsGrid;
