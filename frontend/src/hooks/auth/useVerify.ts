'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';

export function useVerify() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const tErrors = useTranslations('Auth.errors');
  const tVerify = useTranslations('Auth.verify');

  const [email, setEmail] = useState('');
  const [loginMethod, setLoginMethod] = useState('');
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState(0);

  useEffect(() => {
    if (rateLimit > 0) {
      const timer = setTimeout(() => setRateLimit((v) => v - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimit]);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.replace('/login');
          return;
        }
        const base = process.env.NEXT_PUBLIC_API_BASE || '';
        const res = await fetchWithRetry(`${base}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          localStorage.removeItem('auth_token');
          router.replace('/login');
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        if (data.emailVerified) {
          router.replace('/dashboard');
          return;
        }
        setEmail(data.email || '');
        setLoginMethod(data.loginMethod || '');
        setTfaEnabled(data.tfaEnabled || false);
        setInitialLoading(false);
      } catch {
        if (mounted) router.replace('/login');
      }
    };
    fetchStatus();
    return () => {
      mounted = false;
    };
  }, [router]);

  const verifyCode = async (code: string): Promise<boolean> => {
    if (code.length !== 8 || loading) return false;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return false;
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        showSuccess(tVerify('successVerified'));
        setTimeout(() => router.replace('/dashboard'), 1500);
        return true;
      }
      const data = await res.json().catch(() => ({}));
      showError(data?.error || tErrors('invalidVerifyCode'));
      return false;
    } catch {
      showError(tErrors('invalidVerifyCode'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async (): Promise<boolean> => {
    if (resendLoading || rateLimit > 0) return false;
    setResendLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return false;
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/auth/verify/resend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRateLimit(60);
        setCodeSent(true);
        showSuccess(tVerify('successSent'));
        return true;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        const retry = data.retryAfter || 60;
        setRateLimit(retry);
        showError(data.message || tErrors('rateLimitExceeded'));
      } else {
        showError(data.error || tErrors('failedSendVerify'));
      }
      return false;
    } catch {
      showError(tErrors('failedSendVerify'));
      return false;
    } finally {
      setResendLoading(false);
    }
  };

  const changeEmail = async (payload: { email: string; password?: string; tfaCode?: string }): Promise<boolean> => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return false;
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/auth/profile/email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEmail(payload.email);
        showSuccess(tVerify('successUpdated'));
        setCodeSent(true);
        return true;
      }
      const data = await res.json().catch(() => ({}));
      showError(data.error || tErrors('failedUpdateEmail'));
      return false;
    } catch {
      showError(tErrors('networkErrorUpdateEmail'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    loginMethod,
    tfaEnabled,
    codeSent,
    initialLoading,
    loading,
    resendLoading,
    rateLimit,
    verifyCode,
    resendCode,
    changeEmail,
  };
}
