'use client';

import { Suspense, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, locales } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import LoginForm from './LoginForm';
import { sanitizeRedirect } from '@/utils/sanitizeRedirect';
import type { LoginResponse } from '@/hooks/auth';

export interface LoginCoordinatorProps {
  initialRedirect?: string;
}

function LoginCoordinatorInner({ initialRedirect }: LoginCoordinatorProps) {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  const rawRedirect = initialRedirect || searchParams?.get('redirect');
  const redirectTo = sanitizeRedirect(rawRedirect);

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

  const handleSuccess = (token: string, data?: LoginResponse) => {
    localStorage.setItem('auth_token', token);
    window.dispatchEvent(new Event('user:refresh'));

    const isVerifyRequired = Boolean(
      data?.requiresVerification ||
      (data?.user && !data.user.emailVerified && data.requiresVerification !== false)
    );

    if (isVerifyRequired) {
      if (data?.user?.email) {
        try {
          sessionStorage.setItem('verify_email', data.user.email);
        } catch {}
      }
      const dest = redirectTo && redirectTo !== '/dashboard'
        ? `/verify?redirect=${encodeURIComponent(redirectTo)}`
        : '/verify';
      window.location.href = getTargetUrl(dest);
      return;
    }

    window.location.href = getTargetUrl(redirectTo);
  };

  const handleRequires2FA = (tempToken: string) => {
    const params = new URLSearchParams({ temp_token: tempToken });
    if (redirectTo && redirectTo !== '/dashboard') {
      params.set('redirect', redirectTo);
    }
    router.push(`/2fa?${params.toString()}`);
  };

  return <LoginForm onSuccess={handleSuccess} onRequires2FA={handleRequires2FA} />;
}

export default function LoginCoordinator({ initialRedirect }: LoginCoordinatorProps) {
  return (
    <Suspense fallback={null}>
      <LoginCoordinatorInner initialRedirect={initialRedirect} />
    </Suspense>
  );
}
