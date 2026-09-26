'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';

export function useForgot() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState(0);

  const t = useTranslations('Auth.forgot');
  const tErrors = useTranslations('Auth.errors');

  useEffect(() => {
    if (rateLimit > 0) {
      const timer = setTimeout(() => setRateLimit((v) => v - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimit]);

  const requestReset = async (email: string): Promise<boolean> => {
    if (!email || loading) return false;
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        showSuccess(t('successRequest'));
        setRateLimit(60);
        return true;
      }

      const data = await res.json().catch(() => ({}));
      showError(data?.error || tErrors('failedSendReset'));
      return false;
    } catch {
      showError(tErrors('failedSendReset'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (email: string, code: string, password: string): Promise<boolean> => {
    if (loading) return false;
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/auth/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: password }),
      });

      if (res.ok) {
        showSuccess(t('successReset'));
        setTimeout(() => router.replace('/login'), 1500);
        return true;
      }

      const data = await res.json().catch(() => ({}));
      showError(data?.error || tErrors('failedReset'));
      return false;
    } catch {
      showError(tErrors('failedReset'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resendResetCode = async (email: string): Promise<boolean> => {
    if (resendLoading || rateLimit > 0 || !email) return false;
    setResendLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setRateLimit(60);
        showSuccess(t('successRequest'));
        return true;
      }

      const data = await res.json().catch(() => ({}));
      showError(data?.error || tErrors('failedResend'));
      return false;
    } catch {
      showError(tErrors('failedResend'));
      return false;
    } finally {
      setResendLoading(false);
    }
  };

  return {
    loading,
    resendLoading,
    rateLimit,
    requestReset,
    confirmReset,
    resendResetCode,
  };
}
