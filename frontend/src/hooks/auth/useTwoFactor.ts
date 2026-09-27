/* ==========================================================================
   useTwoFactor Hook
   Compliance: ISO/IEC 25010, Separation of Concerns (<300 lines)
========================================================================== */

'use client';

import { useState } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';

interface UseTwoFactorOptions {
  onSuccess?: (token: string) => void;
}

export function useTwoFactor({ onSuccess }: UseTwoFactorOptions = {}) {
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();
  const tErrors = useTranslations('Auth.errors');
  const tBackendErrors = useTranslations('BackendErrors');

  const verify2FA = async (tempToken: string, code: string): Promise<boolean> => {
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/auth/login/2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errKey = data?.error || '';
        const msg = tBackendErrors.has(errKey)
          ? tBackendErrors(errKey)
          : (data?.message || tErrors('verifyFailed'));
        throw new Error(msg);
      }

      if (!data?.token) {
        throw new Error(tErrors('verifyFailed'));
      }

      onSuccess?.(data.token);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tErrors('verifyFailed');
      showError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { verify2FA, loading };
}
