'use client';

import { useState, useEffect } from 'react';
import { useRouter, locales } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { fetchCurrentUser } from '@/utils/userCache';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations, useLocale } from 'next-intl';
import { sanitizeRedirect } from '@/utils/sanitizeRedirect';

function safeSessionRemove(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

export function useVerify() {
  const router = useRouter();
  const locale = useLocale();
  const { showError, showSuccess } = useToast();
  const tErrors = useTranslations('Auth.errors');
  const tVerify = useTranslations('Auth.verify');
  const tBackendErrors = useTranslations('BackendErrors');

  const [email, setEmail] = useState('');
  const [loginMethod, setLoginMethod] = useState('');
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [codeSent, setCodeSent] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('verify_code_sent') === 'true';
    } catch {
      return false;
    }
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState<number>(() => {
    try {
      const until = Number(sessionStorage.getItem('verify_cooldown_until') || '0');
      if (until > Date.now()) {
        return Math.ceil((until - Date.now()) / 1000);
      }
    } catch {}
    return 0;
  });

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
        const data = await fetchCurrentUser({ force: true });
        if (!data) {
          localStorage.removeItem('auth_token');
          router.replace('/login');
          return;
        }
        if (!mounted) return;
        if (data.emailVerified) {
          safeSessionRemove('verify_email');
          safeSessionRemove('verify_code_sent');
          safeSessionRemove('verify_cooldown_until');
          const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
          const redirectTo = sanitizeRedirect(search?.get('redirect'));
          const hasLocalePrefix = (locales as readonly string[]).some(
            (l) => redirectTo === `/${l}` || redirectTo.startsWith(`/${l}/`)
          );
          const target =
            !hasLocalePrefix && locale && locale !== 'en'
              ? `/${locale}${redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`}`
              : redirectTo;
          window.location.href = target;
          return;
        }
        try {
          sessionStorage.setItem('verify_email', data.email || '');
        } catch {}
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
  }, [router, locale]);

  const verifyCode = async (code: string): Promise<boolean> => {
    if (code.length !== 8 || loading) return false;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return false;
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/auth/verify/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, code }),
      });
      if (res.ok) {
        safeSessionRemove('verify_email');
        safeSessionRemove('verify_code_sent');
        safeSessionRemove('verify_cooldown_until');
        window.dispatchEvent(new Event('user:refresh'));
        showSuccess(tVerify('successVerified'));
        const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const redirectTo = sanitizeRedirect(search?.get('redirect'));
        const hasLocalePrefix = (locales as readonly string[]).some(
          (l) => redirectTo === `/${l}` || redirectTo.startsWith(`/${l}/`)
        );
        const target =
          !hasLocalePrefix && locale && locale !== 'en'
            ? `/${locale}${redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`}`
            : redirectTo;
        setTimeout(() => {
          window.location.href = target;
        }, 1200);
        return true;
      }
      const data = await res.json().catch(() => ({}));
      const errKey = data?.error || '';
      const msg = tBackendErrors.has(errKey)
        ? tBackendErrors(errKey)
        : (data?.message || tErrors('invalidVerifyCode'));
      showError(msg);
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setRateLimit(60);
        setCodeSent(true);
        try {
          sessionStorage.setItem('verify_code_sent', 'true');
          sessionStorage.setItem('verify_cooldown_until', String(Date.now() + 60000));
        } catch {}
        showSuccess(tVerify('successSent'));
        return true;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        const retry = data.details?.retryAfter || data.retryAfter || 60;
        setRateLimit(retry);
        try {
          sessionStorage.setItem('verify_cooldown_until', String(Date.now() + retry * 1000));
        } catch {}
        const errKey = data?.error || '';
        const msg = tBackendErrors.has(errKey)
          ? tBackendErrors(errKey)
          : tErrors('rateLimitExceeded');
        showError(msg);
      } else {
        const errKey = data?.error || '';
        const msg = tBackendErrors.has(errKey)
          ? tBackendErrors(errKey)
          : (data?.message || tErrors('failedSendVerify'));
        showError(msg);
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
        try {
          sessionStorage.setItem('verify_email', payload.email);
          sessionStorage.setItem('verify_code_sent', 'true');
          sessionStorage.setItem('verify_cooldown_until', String(Date.now() + 60000));
        } catch {}
        return true;
      }
      const data = await res.json().catch(() => ({}));
      const errKey = data?.error || '';
      const msg = tBackendErrors.has(errKey)
        ? tBackendErrors(errKey)
        : (data?.message || tErrors('failedUpdateEmail'));
      showError(msg);
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
