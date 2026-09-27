/* ==========================================================================
   Banned Status Hook
   Compliance: ISO/IEC 25010, Separation of Concerns (<300 lines)
========================================================================== */

'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';

/** Extracts username from the local JWT without an API call. */
function extractUsernameFromJwt(): string {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return '';
    const parts = token.split('.');
    if (parts.length >= 2) {
      const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadStr);
      return typeof payload.username === 'string' ? payload.username : '';
    }
  } catch {
    // Ignore decode errors — degrade gracefully
  }
  return '';
}

export function useBannedStatus() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Banned');
  const { showSuccess, showError } = useToast();

  const [reason, setReason] = useState<string>('');
  const [until, setUntil] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [checking, setChecking] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const isMountedRef = useRef<boolean>(true);

  // Seed initial state from sessionStorage and JWT on mount
  useEffect(() => {
    isMountedRef.current = true;
    try {
      const r = sessionStorage.getItem('ban_reason') || '';
      const u = sessionStorage.getItem('ban_until') || null;
      let uname = sessionStorage.getItem('ban_username') || '';

      if (!uname) {
        uname = extractUsernameFromJwt();
      }

      if (r) setReason(r);
      if (u) setUntil(u);
      if (uname) setUsername(uname);
    } catch {
      // sessionStorage unavailable — degrade gracefully
    } finally {
      setLoading(false);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const check = useCallback(async (isManual = false) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        if (isMountedRef.current) router.replace('/login');
        return;
      }

      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (res.ok) {
        // Ban lifted — clear all ban context and redirect to dashboard
        try {
          sessionStorage.removeItem('is_banned');
          sessionStorage.removeItem('ban_reason');
          sessionStorage.removeItem('ban_until');
          sessionStorage.removeItem('ban_username');
        } catch {
          // ignore
        }
        if (isManual) {
          showSuccess(t('statusUnbanned'));
        }
        if (isMountedRef.current) {
          router.replace('/');
        }
        return;
      }

      if (res.status === 403) {
        // Still banned — refresh latest reason, expiration, and username
        const d = await res.json().catch(() => ({}));
        const newReason = d?.details?.reason !== undefined ? String(d.details.reason) : '';
        const newUntil = d?.details?.until !== undefined ? (d.details.until ? String(d.details.until) : null) : null;
        let newUsername = d?.details?.username ? String(d.details.username) : '';

        if (!newUsername) {
          newUsername = extractUsernameFromJwt();
        }

        if (isMountedRef.current) {
          setReason(newReason);
          setUntil(newUntil);
          if (newUsername) setUsername(newUsername);
        }

        try {
          sessionStorage.setItem('is_banned', 'true');
          sessionStorage.setItem('ban_reason', newReason);
          if (newUntil) sessionStorage.setItem('ban_until', newUntil);
          else sessionStorage.removeItem('ban_until');
          if (newUsername) sessionStorage.setItem('ban_username', newUsername);
        } catch {
          // ignore
        }

        if (isManual) {
          showError(t('statusStillBanned'));
        }
        return;
      }

      if (res.status === 401) {
        // Token revoked or session dead — clear all context and redirect to login
        try {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('is_banned');
          sessionStorage.removeItem('ban_reason');
          sessionStorage.removeItem('ban_until');
          sessionStorage.removeItem('ban_username');
        } catch {
          // ignore
        }
        if (isMountedRef.current) {
          router.replace('/login');
        }
      }
    } catch {
      // Network drop — don't boot user, wait for next poll
    }
  }, [router, showSuccess, showError, t]);

  // Poll every 5 seconds to detect ban lift
  useEffect(() => {
    check(false);
    const intervalId = setInterval(() => {
      check(false);
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [check]);

  const checkNow = useCallback(async () => {
    setChecking(true);
    try {
      await check(true);
    } finally {
      if (isMountedRef.current) {
        setChecking(false);
      }
    }
  }, [check]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('is_banned');
      sessionStorage.removeItem('ban_reason');
      sessionStorage.removeItem('ban_until');
      sessionStorage.removeItem('ban_username');
    } catch {
      // ignore
    }
    router.replace('/login');
  }, [router]);

  const untilText = useMemo(() => {
    if (!until) return null;
    try {
      return new Date(until).toLocaleString(locale);
    } catch {
      return until;
    }
  }, [until, locale]);

  return {
    reason,
    untilText,
    username,
    checking,
    checkNow,
    logout,
    loading,
  };
}
