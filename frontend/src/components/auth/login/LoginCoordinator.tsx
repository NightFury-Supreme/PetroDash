'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from '@/i18n/routing';
import LoginForm from './LoginForm';
import TwoFactorForm from './TwoFactorForm';

/**
 * Validates that a redirect target is a safe same-origin relative path.
 * Prevents open-redirect attacks: only accepts paths starting with /.
 * Never allows protocol-relative (//), absolute URLs, or javascript: URIs.
 */
function sanitizeRedirect(raw: string | null): string {
  if (!raw) return '/dashboard';
  const decoded = decodeURIComponent(raw);
  // Must start with / and not be protocol-relative (//evil.com)
  if (decoded.startsWith('/') && !decoded.startsWith('//') && !decoded.toLowerCase().startsWith('/login')) {
    return decoded;
  }
  return '/dashboard';
}

function LoginCoordinatorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const redirectTo = sanitizeRedirect(searchParams?.get('redirect'));

  const handleSuccess = (token: string) => {
    localStorage.setItem('auth_token', token);
    router.replace(redirectTo as any);
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
