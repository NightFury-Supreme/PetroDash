/**
 * Error Page Header Component
 * Provides top-level branding and locale navigation for error pages.
 * Complies with ISO/IEC 25010 and WCAG 2.1 (Accessibility)
 */

'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { useBranding } from '@/hooks/useBranding';
import LanguageSwitcher from '@/components/auth/layout/LanguageSwitcher';

export function ErrorHeader() {
  const { branding } = useBranding();
  const siteName = branding.siteName || 'PteroDash';
  const siteIcon = branding.siteIcon || '/logo.svg';

  return (
    <header
      role="banner"
      className="w-full border-b border-white/[0.06] bg-[#0F0F0F]/80 backdrop-blur-md sticky top-0 z-50 shrink-0"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-[#FF5722] rounded-md px-1 py-0.5"
          aria-label={`${siteName} home`}
        >
          <img
            src={siteIcon}
            alt={siteName}
            className="h-7 w-auto object-contain"
          />
          <span className="font-bold tracking-tight text-base sm:text-lg">
            {siteName}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher align="right" direction="down" variant="ghost" />
        </div>
      </div>
    </header>
  );
}

export default ErrorHeader;
