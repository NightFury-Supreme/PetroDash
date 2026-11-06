'use client';

import React from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import enMessages from '../../../messages/en.json';
import type { GlobalErrorViewProps } from './Error.types';

function GlobalErrorContent({ error, reset }: GlobalErrorViewProps) {
  const t = useTranslations('ErrorState');
  const tFooter = useTranslations('Footer');
  const tDashboard = useTranslations('Dashboard');

  const isServerOmitted =
    error.message ===
    'An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.';

  const displayMessage =
    error.message && !isServerOmitted
      ? error.message
      : t('unexpectedIssue');

  const currentYear = new Date().getFullYear();

  return (
    <>
      <header role="banner" className="w-full bg-[#0F0F0F]/80 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="w-full px-4 sm:px-6 py-4 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-[#FF5722] rounded-md px-1 py-0.5"
            aria-label="PteroDash"
          >
            <img src="/logo.svg" alt="PteroDash" className="h-7 w-auto object-contain" />
            <span className="font-bold tracking-tight text-base sm:text-lg">
              PteroDash
            </span>
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <section className="text-center w-full max-w-[620px]" aria-labelledby="error-title">
          <div className="mx-auto mb-[24px] flex items-center justify-center text-[#FF5722]" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]"
            >
              <path d="M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
              <path d="M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" />
              <path d="M6 6h.01" />
              <path d="M6 18h.01" />
              <path d="m13 6-4 6h6l-4 6" />
            </svg>
          </div>
          <h1
            id="error-title"
            className="m-0 text-[#ededed] text-[clamp(28px,4vw,38px)] leading-[1.15] font-semibold tracking-[-0.04em]"
          >
            {t('applicationError')}
          </h1>
          <p className="max-w-[500px] mx-auto mt-3.5 text-[#888888] text-[12px] sm:text-[13px] leading-[1.7]">
            {displayMessage}
          </p>
          <div className="mt-[29px] flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (reset) reset();
                else window.location.reload();
              }}
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
          </div>
        </section>
      </main>

      <footer className="w-full py-6 mt-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[13px] text-[#555]">
          <div className="flex items-center gap-2">
            <span>© {currentYear} PteroDash</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 cursor-default">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hover:text-white transition-colors">{tDashboard('allNormal')}</span>
            </div>
            <span className="text-[#333]">•</span>
            <span>
              {tFooter('poweredBy')}{' '}
              <a
                href="https://github.com/NightFury-Supreme/PetroDash"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors font-medium text-[#777]"
              >
                PteroDash
              </a>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}

export function GlobalErrorView({ error, reset }: GlobalErrorViewProps) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-[#0F0F0F] text-white flex flex-col justify-between font-sans antialiased">
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <GlobalErrorContent error={error} reset={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
