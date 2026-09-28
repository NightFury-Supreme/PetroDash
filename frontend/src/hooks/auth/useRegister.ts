/* ==========================================================================
   useRegister Hook
   Compliance: ISO/IEC 25010, Separation of Concerns (<300 lines)
========================================================================== */

'use client';

import { useState } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations, useLocale } from 'next-intl';
import type { RegisterFormData } from './types';

export function useRegister() {
  const locale = useLocale();
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

      const data = await res.json();
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
      window.dispatchEvent(new Event('user:refresh'));
      const target = locale && locale !== 'en' ? `/${locale}/dashboard` : '/dashboard';
      window.location.href = target;
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
