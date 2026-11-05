'use client';

import { useCallback } from 'react';
import { useRouter, locales } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import TwoFactorForm from './TwoFactorForm';
import { sanitizeRedirect } from '@/utils/sanitizeRedirect';

interface TwoFactorClientProps {
  tempToken: string;
  redirectTo?: string;
}

export default function TwoFactorClient({ tempToken, redirectTo }: TwoFactorClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const safeRedirect = sanitizeRedirect(redirectTo);

  const getTargetUrl = useCallback((dest: string) => {
    const hasLocalePrefix = (locales as readonly string[]).some(
      (l) => dest === `/${l}` || dest.startsWith(`/${l}/`)
    );
    if (!hasLocalePrefix && locale && locale !== 'en') {
      return `/${locale}${dest.startsWith('/') ? dest : `/${dest}`}`;
    }
    return dest;
  }, [locale]);

  const handleSuccess = useCallback((token: string) => {
    localStorage.setItem('auth_token', token);
    window.dispatchEvent(new Event('user:refresh'));
    window.location.href = getTargetUrl(safeRedirect);
  }, [getTargetUrl, safeRedirect]);

  const handleBack = useCallback(() => {
    const dest = safeRedirect && safeRedirect !== '/dashboard'
      ? `/login?redirect=${encodeURIComponent(safeRedirect)}`
      : '/login';
    router.replace(dest);
  }, [router, safeRedirect]);

  return (
    <TwoFactorForm
      tempToken={tempToken}
      onSuccess={handleSuccess}
      onBack={handleBack}
    />
  );
}
