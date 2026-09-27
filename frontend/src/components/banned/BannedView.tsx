/* ==========================================================================
   Banned Presentation View Component
   Matches 404 page layout and aesthetic: dark #0F0F0F, centered orange
   stroke icon, uppercase kicker, clamp typography, accessible and localized.
   Compliance: ISO/IEC 25010, WCAG 2.1 (Accessibility)
========================================================================== */

'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Ban, Copy, Check } from 'lucide-react';
import { useBannedStatus } from '@/hooks/auth';
import { ErrorState, ErrorHeader } from '@/components/error';
import { BannedActions } from './BannedActions';
import { BannedSkeleton } from './BannedSkeleton';

export function BannedView() {
  const t = useTranslations('Banned');
  const { reason, untilText, username, userId, logout, checkNow, checking, loading } = useBannedStatus();
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyUserId = useCallback(() => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [userId]);

  if (loading) {
    return <BannedSkeleton />;
  }

  const displayName = username || t('defaultUser');

  return (
    <ErrorState
      fullScreen={true}
      header={<ErrorHeader />}
      icon={<Ban strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
      kicker={t('kicker')}
      title={t('title')}
      description={
        <div className="space-y-2.5" suppressHydrationWarning>
          <p className="text-[14px] sm:text-[15px] font-medium text-[#EDEDED]" suppressHydrationWarning>
            {t('greeting', { username: displayName })}
          </p>

          <p className="text-[#888888]">{t('subtitle')}</p>

          <p className="text-[12px] sm:text-[13px] leading-relaxed" suppressHydrationWarning>
            <span className="text-[#666]">{t('reasonLabel')} </span>
            <span className="text-[#DDDDDD]">{reason || t('noReasonProvided')}</span>
            <span className="text-[#444] mx-2.5 select-none" aria-hidden="true">|</span>
            <span className="text-[#666]">{t('statusLabel')} </span>
            <span className={untilText ? 'text-[#FF5722]' : 'text-[#FF4444]'}>
              {untilText ? t('bannedUntil', { date: untilText }) : t('lifetimeBan')}
            </span>
          </p>

          {userId && (
            <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-[#777]" suppressHydrationWarning>
              <span>{t('userIdLabel')}:</span>
              <button
                type="button"
                onClick={handleCopyUserId}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[#AAA] hover:text-white transition-colors font-mono cursor-pointer border border-white/[0.06]"
                title={t('clickToCopyId')}
                aria-label={t('clickToCopyId')}
              >
                <span>{userId}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#777]" />}
              </button>
              {copied && <span className="text-emerald-400 text-[11px] font-medium">{t('copied')}</span>}
            </div>
          )}

          <p className="text-[11px] text-[#666]">
            {t('contactSupport')}
          </p>
        </div>
      }
      buttons={<BannedActions onLogout={logout} onRefresh={checkNow} checking={checking} />}
    />
  );
}

export default BannedView;
