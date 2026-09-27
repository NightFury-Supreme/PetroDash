/* ==========================================================================
   Banned Details Card Component
   Compliance: ISO/IEC 25010, WCAG 2.1 (Accessibility)
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert, Calendar, AlertCircle } from 'lucide-react';
import type { BannedDetailsCardProps } from './types';

export function BannedDetailsCard({ reason, untilText }: BannedDetailsCardProps) {
  const t = useTranslations('Banned');

  return (
    <div className="mt-6 w-full max-w-[480px] mx-auto rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-left divide-y divide-white/[0.06]">
      {/* Reason Row */}
      <div className="pb-3.5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#FF5722]/10 border border-[#FF5722]/20 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle size={15} className="text-[#FF5722]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#777]">
            {t('reasonLabel')}
          </p>
          <p className="text-xs text-[#DDDDDD] mt-0.5 font-medium break-words leading-relaxed">
            {reason || t('noReasonProvided')}
          </p>
        </div>
      </div>

      {/* Status & Expiration Row */}
      <div className="py-3.5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#FF5722]/10 border border-[#FF5722]/20 flex items-center justify-center shrink-0 mt-0.5">
          <Calendar size={15} className="text-[#FF5722]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#777]">
            {t('statusLabel')}
          </p>
          <div className="mt-1">
            {untilText ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#FF5722]/10 text-[#FF5722] border border-[#FF5722]/20">
                {t('bannedUntil', { date: untilText })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#FF4444]/10 text-[#FF4444] border border-[#FF4444]/20">
                {t('lifetimeBan')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Appeal & Support Advice */}
      <div className="pt-3 text-[11px] text-[#777] leading-relaxed flex items-start gap-2.5">
        <ShieldAlert size={15} className="text-[#FF5722] shrink-0 mt-0.5" />
        <span>{t('contactSupport')}</span>
      </div>
    </div>
  );
}
