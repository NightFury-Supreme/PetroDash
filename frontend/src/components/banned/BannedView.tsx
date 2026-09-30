/* ==========================================================================
   Banned Presentation View Component
   Matches 404 page layout and aesthetic: dark #0F0F0F, centered orange
   stroke icon, clamp typography, accessible and localized.
   Compliance: ISO/IEC 25010, WCAG 2.1 (Accessibility)
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Gavel } from 'lucide-react';
import { useBannedStatus } from '@/hooks/auth';
import { ErrorState, ErrorHeader } from '@/components/error';
import { BannedActions } from './BannedActions';
import { BannedSkeleton } from './BannedSkeleton';

export function BannedView() {
  const t = useTranslations('Banned');
  const { reason, untilText, username, logout, loading } = useBannedStatus();

  if (loading) {
    return <BannedSkeleton />;
  }

  const displayName = username || t('defaultUser');

  return (
    <ErrorState
      fullScreen={true}
      header={<ErrorHeader />}
      icon={<Gavel strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
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

          <p className="text-[11px] text-[#666]">
            {t('contactSupport')}
          </p>
        </div>
      }
      buttons={<BannedActions onLogout={logout} />}
    />
  );
}

export default BannedView;
