'use client';

import React from 'react';
import { Link } from '@/i18n/routing';
import { useAppConfig } from '@/hooks/useAppConfig';
import LanguageSwitcher from '@/components/auth/layout/LanguageSwitcher';

export interface ErrorHeaderProps {
  className?: string;
}

export function ErrorHeader({ className = '' }: ErrorHeaderProps) {
  const { config } = useAppConfig();
  const siteName = config.branding.siteName || 'PteroDash';
  const siteIcon = config.branding.siteIcon || '/logo.svg';

  return (
    <header
      role="banner"
      className={`w-full bg-[#0F0F0F]/80 backdrop-blur-md sticky top-0 z-50 shrink-0 ${className}`}
    >
      <div className="w-full px-4 sm:px-6 py-4 flex items-center justify-between">
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

export { ErrorHeader as CommonHeader };
export default ErrorHeader;
