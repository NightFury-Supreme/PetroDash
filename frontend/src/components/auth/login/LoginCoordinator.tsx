'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import LoginForm from './LoginForm';
import TwoFactorForm from './TwoFactorForm';

/**
 * Validates that a redirect target is a safe same-origin relative path.
 * Prevents open-redirect attacks: only accepts paths starting with /.
 * Never allows protocol-relative (//), absolute URLs, or javascript: URIs.
 */
function sanitizeRedirect(raw: string | null): string {
  if (!raw || raw === '/') return '/dashboard';
  const decoded = decodeURIComponent(raw);
  if (decoded === '/' || decoded.toLowerCase().startsWith('/login')) {
    return '/dashboard';
  }
  // Must start with / and not be protocol-relative (//evil.com)
  if (decoded.startsWith('/') && !decoded.startsWith('//')) {
    return decoded;
  }
  return '/dashboard';
}

function LoginCoordinatorInner() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const redirectTo = sanitizeRedirect(searchParams?.get('redirect'));

  const getTargetUrl = useCallback((dest: string) => {
    if (locale && locale !== 'en' && !dest.startsWith(`/${locale}/`) && dest !== `/${locale}`) {
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
