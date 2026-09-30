/**
 * Runtime Error Boundary Presentation View
 * Complies with ISO/IEC 25010 (Fault Tolerance) and WCAG 2.1 (Accessibility)
 */

'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/routing';

const SHELL_PAGES = [
  '/dashboard',
  '/panel',
  '/shop',
  '/gift',
  '/create',
  '/admin',
  '/server',
  '/referrals',
  '/tickets',
  '/profile',
  '/earn'
];

import { ErrorState } from './ErrorState';
import { ErrorHeader } from './ErrorHeader';
import { GoBackButton } from './ErrorButtons';
import type { ErrorBoundaryViewProps } from './Error.types';

export function ErrorBoundaryView({ error, reset }: ErrorBoundaryViewProps) {
  const t = useTranslations('ErrorState');
  const pathname = usePathname();
  const usesShell = pathname ? SHELL_PAGES.some(page => pathname.startsWith(page)) : false;

  useEffect(() => {
    // Log unexpected runtime errors for observability and monitoring
    console.error('Unhandled application error:', error);
  }, [error]);

  const isServerOmitted =
    error.message ===
    'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.';

  const displayMessage = error.message && !isServerOmitted ? error.message : t('unexpectedIssue');

  return (
    <ErrorState
      fullScreen={!usesShell}
      header={usesShell ? <React.Fragment /> : <ErrorHeader />}
      showFooter={!usesShell}
      icon={
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]"
          aria-hidden="true"
        >
          <path d="M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
          <path d="M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" />
          <path d="M6 6h.01" />
          <path d="M6 18h.01" />
          <path d="m13 6-4 6h6l-4 6" />
        </svg>
      }
      title={t('somethingWentWrong')}
      description={<p>{displayMessage}</p>}
      buttons={
        <>
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-[14px] h-[14px]">
              <path
                d="M20 11a8 8 0 0 0-14.7-4M4 5v4h4M4 13a8 8 0 0 0 14.7 4M20 19v-4h-4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            {t('tryAgain')}
          </button>
          <GoBackButton />
        </>
      }
    />
  );
}
