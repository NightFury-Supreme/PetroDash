'use client';

import React, { ReactNode } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface ErrorStateProps {
  icon: ReactNode;
  kicker: string;
  title: string;
  description: ReactNode;
  buttons?: ReactNode;
  fullScreen?: boolean;
  errorString?: string | null;
}

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
    <div className={`flex flex-col items-center justify-center w-full text-sans ${minHeightClass} min-h-[calc(100vh-60px)] py-12`}>
      <section className="text-center w-full max-w-[620px] px-4" aria-labelledby="error-title">
        <div className="mx-auto mb-[24px] flex items-center justify-center text-[#FF5722]">
          {icon}
        </div>
        <p className="m-0 mb-2.5 text-[#FF5722] text-[10px] font-semibold tracking-[0.12em] uppercase">
          {displayKicker}
        </p>
        <h1 id="error-title" className="m-0 text-[#ededed] text-[clamp(28px,4vw,38px)] leading-[1.15] font-semibold tracking-[-0.04em] break-words">
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

// Pre-built common buttons for convenience
export function DashboardButton({ variant = 'primary' }: { variant?: 'primary' | 'secondary' }) {
  const isPrimary = variant === 'primary';
  const className = isPrimary
    ? "flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
    : "flex items-center gap-2 bg-[#1A1A1A] border border-[#222] text-[#888] hover:text-white px-4 py-2 rounded-md text-[13px] font-medium transition-colors";
  
  const t = useTranslations('ErrorState');

  return (
    <Link href="/dashboard" className={className}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      {t('btnDashboard')}
    </Link>
  );
}

export function GoBackButton() {
  const t = useTranslations('ErrorState');
  return (
    <button
      onClick={() => window.history.back()}
      className="flex items-center gap-2 bg-[#1A1A1A] border border-[#222] text-[#888] hover:text-[#D4D4D4] px-4 py-2 rounded-md text-[13px] font-medium transition-colors bg-transparent rounded-lg"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {t('btnGoBack')}
    </button>
  );
}

export function ErrorDescription({ error, topic }: { error: string; topic?: string }) {
  const t = useTranslations('ErrorState');
  const e = typeof error === 'string' ? error.toLowerCase() : '';
  
  let msg = t('descGeneric').replace('{topic}', topic || t('defaultTopic'));
  let matched = false;
  
  if (e.includes('forbidden') || e.includes('unauthorized') || e.includes('access denied')) {
    msg = t('descForbidden');
    matched = true;
  } else if (e.includes('not found')) {
    msg = t('descNotFound').replace('{topic}', topic ? topic.toLowerCase() : t('defaultResource'));
    matched = true;
  } else if (e.includes('failed to fetch') || e.includes('network') || e.includes('timeout')) {
    msg = t('descNetwork');
    matched = true;
  } else if (e.includes('rate limit') || e.includes('too many requests')) {
    msg = t('descRateLimit');
    matched = true;
  } else if (e.includes('pending') || e.includes('provisioning')) {
    msg = t('descPending');
    matched = true;
  }

  // If we didn't match a generic network/auth error, it might be a specific business logic error 
  // from the API (like "Not enough balance"). Show it cleanly as regular text.
  if (!matched && error) {
    msg = error;
  }
  
  return (
    <div className="space-y-3">
      <p>{msg}</p>
    </div>
  );
}
