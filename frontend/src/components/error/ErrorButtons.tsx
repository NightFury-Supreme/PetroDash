/**
 * Reusable Error Action Buttons
 * Complies with ISO/IEC 25010 (Single Responsibility Principle)
 */

'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import type { DashboardButtonProps, GoBackButtonProps } from './Error.types';

export function DashboardButton({
  variant = 'primary',
  label,
  className: customClassName,
}: DashboardButtonProps) {
  const t = useTranslations('ErrorState');
  const isPrimary = variant === 'primary';
  const defaultClass = isPrimary
    ? 'flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors'
    : 'flex items-center gap-2 bg-[#1A1A1A] border border-[#222] text-[#888] hover:text-white px-4 py-2 rounded-md text-[13px] font-medium transition-colors';

  return (
    <Link href="/dashboard" className={customClassName || defaultClass}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-[14px] h-[14px]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
      {label || t('btnDashboard')}
    </Link>
  );
}

export function GoBackButton({
  label,
  className: customClassName,
}: GoBackButtonProps) {
  const t = useTranslations('ErrorState');
  const defaultClass =
    'flex items-center gap-2 bg-[#1A1A1A] border border-[#222] text-[#888] hover:text-[#D4D4D4] px-4 py-2 rounded-md text-[13px] font-medium transition-colors';

  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className={customClassName || defaultClass}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-[14px] h-[14px]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      {label || t('btnGoBack')}
    </button>
  );
}
