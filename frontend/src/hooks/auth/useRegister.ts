'use client';

import { useState } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { sanitizeRedirect } from '@/utils/sanitizeRedirect';
import { clearStoredReferralCode } from '@/utils/referral';
import type { RegisterFormData, RegisterResponse } from './types';

export function useRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const { showError } = useToast();
  const tErrors = useTranslations('Auth.errors');
  const tBackendErrors = useTranslations('BackendErrors');

  const register = async (formData: RegisterFormData, ref?: string): Promise<boolean> => {
    setLoading(true);
    setFieldErrors({});
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...(ref ? { ref } : {}) }),
      });

      const data: RegisterResponse = await res.json();
      if (!res.ok) {
        const serverFieldErrors = data?.details?.fieldErrors || {};
        const errs: Partial<Record<keyof RegisterFormData, string>> = {};
        Object.entries(serverFieldErrors).forEach(([k, v]) => {
          if (Array.isArray(v) && v.length > 0) {
            errs[k as keyof RegisterFormData] = v[0] as string;
          }
        });
        if (Object.keys(errs).length > 0) {
          setFieldErrors(errs);
        }
        const errKey = data?.error || '';
        const msg = tBackendErrors.has(errKey)
          ? tBackendErrors(errKey)
          : (data?.message || tErrors('registerFailed'));
        throw new Error(msg);
      }

      if (!data?.token) {
        throw new Error(tErrors('registerFailed'));
      }

      localStorage.setItem('auth_token', data.token);
      clearStoredReferralCode();
      window.dispatchEvent(new Event('user:refresh'));

      const isVerifyRequired = Boolean(
        data.requiresVerification ||
        (data.user && !data.user.emailVerified && data.requiresVerification !== false)
      );

      if (isVerifyRequired) {
        try {
          sessionStorage.setItem('verify_email', data.user?.email || formData.email);
          sessionStorage.removeItem('verify_code_sent');
          sessionStorage.removeItem('verify_cooldown_until');
        } catch {}
      }

      const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const redirectTo = sanitizeRedirect(search?.get('redirect'));
      const destinationPath = isVerifyRequired
        ? (redirectTo && redirectTo !== '/dashboard'
            ? `/verify?redirect=${encodeURIComponent(redirectTo)}`
            : '/verify')
        : redirectTo;

      router.replace(destinationPath as any);

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tErrors('registerFailed');
      showError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, fieldErrors, setFieldErrors };
}
