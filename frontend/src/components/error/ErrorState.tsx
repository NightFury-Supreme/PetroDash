/**
 * Accessible Error State Presentation Container
 * Complies with ISO/IEC 25010 (Usability & Maintainability) and WCAG 2.1 (Accessibility)
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { ErrorStateProps } from './Error.types';

export function ErrorState({
  icon,
  kicker,
  title,
  description,
  buttons,
  fullScreen = false,
  errorString,
}: ErrorStateProps) {
  const minHeightClass = fullScreen ? 'min-h-screen bg-[#0F0F0F]' : 'flex-1 min-h-0';
  const t = useTranslations('ErrorState');

  let displayKicker = kicker;
  let displayTitle = title;

  if (errorString) {
    const e = errorString.toLowerCase();
    if (e.includes('rate limit') || e.includes('too many requests')) {
      displayKicker = t('kickerRateLimited');
      displayTitle = t('titleTooManyRequests');
    } else if (e.includes('forbidden') || e.includes('unauthorized') || e.includes('access denied')) {
      displayKicker = t('kickerAccessDenied');
      displayTitle = t('titleForbidden');
    } else if (e.includes('not found')) {
      displayKicker = t('kickerNotFound');
      displayTitle = t('titleNotFound');
    }
  }

  return (
    <div
      role="region"
      aria-labelledby="error-title"
      className={`flex flex-col items-center justify-center w-full text-sans ${minHeightClass} min-h-[calc(100vh-60px)] py-12`}
    >
      <section className="text-center w-full max-w-[620px] px-4">
        <div className="mx-auto mb-[24px] flex items-center justify-center text-[#FF5722]" aria-hidden="true">
          {icon}
        </div>
        <p className="m-0 mb-2.5 text-[#FF5722] text-[10px] font-semibold tracking-[0.12em] uppercase">
          {displayKicker}
        </p>
        <h1
          id="error-title"
          className="m-0 text-[#ededed] text-[clamp(28px,4vw,38px)] leading-[1.15] font-semibold tracking-[-0.04em] break-words"
        >
          {displayTitle}
        </h1>
        <div className="max-w-[500px] mx-auto mt-3.5 text-[#888888] text-[12px] sm:text-[13px] leading-[1.7]">
          {description}
        </div>
        {buttons && (
          <div className="mt-[29px] flex justify-center gap-3">
            {buttons}
          </div>
        )}
      </section>
    </div>
  );
}
