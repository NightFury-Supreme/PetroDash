'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, locales } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import LoginForm from './LoginForm';
import TwoFactorForm from './TwoFactorForm';

/**
 * Validates that a redirect target is a safe same-origin relative path.
 *
 * Security vectors covered:
 * - Absolute URLs (https://evil.com)           → rejected (no leading /)
 * - Protocol-relative (//evil.com)              → rejected (double slash)
 * - Backslash bypass (/\evil.com)               → rejected
 * - Encoded absolute (%2Fhttps%3A//evil.com)    → rejected via URL origin check
 * - Auth route loops (/login, /register, etc.)  → redirected to /dashboard
 *
 * Uses the URL constructor to resolve the path against the current origin —
 * if the resolved origin doesn't match, the value is rejected.
 */
function sanitizeRedirect(raw: string | null): string {
  if (!raw || raw === '/') return '/dashboard';
  try {
    const decoded = decodeURIComponent(raw);

    // Reject anything that isn't a root-relative path.
    if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.startsWith('/\\')) {
      return '/dashboard';
    }

    // Block auth routes that would cause redirect loops.
    const lower = decoded.toLowerCase();
    if (
      lower.startsWith('/login') ||
      lower.startsWith('/register') ||
      lower.startsWith('/auth/callback')
    ) {
      return '/dashboard';
    }

    // Parse against current origin — the only safe redirect targets have
    // origin === window.location.origin. Catches encoded absolute URLs
    // such as /https://evil.com which would still resolve to a foreign origin.
    if (typeof window !== 'undefined') {
      const resolved = new URL(decoded, window.location.origin);
      if (resolved.origin !== window.location.origin) return '/dashboard';
      return resolved.pathname + resolved.search + resolved.hash || '/dashboard';
    }

    return decoded;
  } catch {
    // Malformed URI or URL parse failure — fallback to safe default.
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
