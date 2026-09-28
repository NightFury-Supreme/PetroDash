'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, locales } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import LoginForm from './LoginForm';
import TwoFactorForm from './TwoFactorForm';

import { sanitizeRedirect } from '@/utils/sanitizeRedirect';


function LoginCoordinatorInner() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const redirectTo = sanitizeRedirect(searchParams?.get('redirect'));

  const getTargetUrl = useCallback((dest: string) => {
    const hasLocalePrefix = (locales as readonly string[]).some(
      (l) => dest === `/${l}` || dest.startsWith(`/${l}/`)
    );
    if (!hasLocalePrefix && locale && locale !== 'en') {
      return `/${locale}${dest.startsWith('/') ? dest : `/${dest}`}`;
    }
    return dest;
  }, [locale]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      window.location.href = getTargetUrl(redirectTo);
    }
  }, [getTargetUrl, redirectTo]);

  const handleSuccess = (token: string) => {
    localStorage.setItem('auth_token', token);
    window.dispatchEvent(new Event('user:refresh'));
    window.location.href = getTargetUrl(redirectTo);
  };

  const handleRequires2FA = (token: string) => {
    setTempToken(token);
    setRequires2FA(true);
  };

  const handleCancel2FA = () => {
    setTempToken(null);
    setRequires2FA(false);
  };

  if (requires2FA && tempToken) {
    return <TwoFactorForm tempToken={tempToken} onSuccess={handleSuccess} onBack={handleCancel2FA} />;
  }

  return <LoginForm onSuccess={handleSuccess} onRequires2FA={handleRequires2FA} />;
}

export default function LoginCoordinator() {
  return (
    <Suspense fallback={null}>
      <LoginCoordinatorInner />
    </Suspense>
  );
}
