/* ==========================================================================
   Banned Presentation View Component
   Matches 404 page layout and aesthetic: dark #0F0F0F, centered orange
   stroke icon, uppercase kicker, clamp typography, accessible and localized.
   Compliance: ISO/IEC 25010, WCAG 2.1 (Accessibility)
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Ban } from 'lucide-react';
import { useBannedStatus } from '@/hooks/auth';
import { BannedDetailsGrid } from './BannedDetailsGrid';
import { BannedActions } from './BannedActions';

export function BannedView() {
  const t = useTranslations('Banned');
  const { reason, untilText, logout, checkNow, checking } = useBannedStatus();

  return (
    <div
      role="region"
      aria-labelledby="banned-title"
      className="flex flex-col items-center justify-center w-full font-sans min-h-screen bg-[#0F0F0F] text-white py-12 px-4"
    >
      <section className="text-center w-full max-w-[620px]">
        {/* Top Centered Icon */}
        <div
          className="mx-auto mb-[24px] flex items-center justify-center text-[#FF5722]"
          aria-hidden="true"
        >
          <Ban strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />
        </div>

        {/* Kicker */}
        <p className="m-0 mb-2.5 text-[#FF5722] text-[10px] font-semibold tracking-[0.12em] uppercase">
          {t('kicker')}
        </p>

        {/* Title */}
        <h1
          id="banned-title"
          className="m-0 text-[#ededed] text-[clamp(28px,4vw,38px)] leading-[1.15] font-semibold tracking-[-0.04em] break-words"
        >
          {t('title')}
        </h1>

        {/* Subtitle */}
        <p className="max-w-[500px] mx-auto mt-3.5 text-[#888888] text-[12px] sm:text-[13px] leading-[1.7]">
          {t('subtitle')}
        </p>

        {/* Details Resource Grid */}
        <BannedDetailsGrid reason={reason} untilText={untilText} />

        {/* Action Buttons */}
        <BannedActions onLogout={logout} onRefresh={checkNow} checking={checking} />
      </section>
    </div>
  );
}

export default BannedView;
