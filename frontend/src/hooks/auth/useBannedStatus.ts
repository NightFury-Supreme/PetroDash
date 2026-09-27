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

function extractFromJwt(): { username: string; userId: string } {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return { username: '', userId: '' };
    const parts = token.split('.');
    if (parts.length >= 2) {
      const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadStr);
      return {
        username: typeof payload.username === 'string' ? payload.username : '',
        userId: typeof payload.sub === 'string' ? payload.sub : (typeof payload.userId === 'string' ? payload.userId : ''),
      };
    }
  } catch {
    // Ignore decode errors
  }
  return { username: '', userId: '' };
}

export function useBannedStatus() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Banned');
  const { showSuccess, showError } = useToast();

  const [reason, setReason] = useState<string>('');
  const [until, setUntil] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [checking, setChecking] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const isMountedRef = useRef<boolean>(true);

  // Read initial cache from sessionStorage and JWT on mount
  useEffect(() => {
    isMountedRef.current = true;
    try {
      const r = sessionStorage.getItem('ban_reason') || '';
      const u = sessionStorage.getItem('ban_until') || null;
      let uname = sessionStorage.getItem('ban_username') || '';
      let uid = sessionStorage.getItem('ban_user_id') || '';

      if (!uname || !uid) {
        const fromJwt = extractFromJwt();
        if (!uname) uname = fromJwt.username;
        if (!uid) uid = fromJwt.userId;
      }

      if (r) setReason(r);
      if (u) setUntil(u);
      if (uname) setUsername(uname);
      if (uid) setUserId(uid);
    } catch {
      // sessionStorage unavailable
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
        // Ban lifted or account active
        try {
          sessionStorage.removeItem('is_banned');
          sessionStorage.removeItem('ban_reason');
          sessionStorage.removeItem('ban_until');
          sessionStorage.removeItem('ban_username');
          sessionStorage.removeItem('ban_user_id');
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
        // Still banned — refresh latest reason, expiration, username, and userId
        const d = await res.json().catch(() => ({}));
        const newReason = d?.reason !== undefined ? String(d.reason) : '';
        const newUntil = d?.until !== undefined ? (d.until ? String(d.until) : null) : null;
        let newUsername = d?.username ? String(d.username) : '';
        let newUserId = d?.userId ? String(d.userId) : '';

        if (!newUsername || !newUserId) {
          const fromJwt = extractFromJwt();
          if (!newUsername) newUsername = fromJwt.username;
          if (!newUserId) newUserId = fromJwt.userId;
        }

        if (isMountedRef.current) {
          setReason(newReason);
          setUntil(newUntil);
          if (newUsername) setUsername(newUsername);
          if (newUserId) setUserId(newUserId);
        }

        try {
          sessionStorage.setItem('is_banned', 'true');
          sessionStorage.setItem('ban_reason', newReason);
          if (newUntil) sessionStorage.setItem('ban_until', newUntil);
          else sessionStorage.removeItem('ban_until');
          if (newUsername) sessionStorage.setItem('ban_username', newUsername);
          if (newUserId) sessionStorage.setItem('ban_user_id', newUserId);
        } catch {
          // ignore
        }

        if (isManual) {
          showError(t('statusStillBanned'));
        }
        return;
      }

      if (res.status === 401) {
        // Token revoked or session dead
        try {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('is_banned');
          sessionStorage.removeItem('ban_reason');
          sessionStorage.removeItem('ban_until');
          sessionStorage.removeItem('ban_username');
          sessionStorage.removeItem('ban_user_id');
        } catch {
          // ignore
        }
        if (isMountedRef.current) {
          router.replace('/login');
        }
      }
    } catch {
      // Network drop — don't boot user immediately
    }
  }, [router, showSuccess, showError, t]);

  // Periodic polling every 5 seconds
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
      sessionStorage.removeItem('ban_user_id');
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
    userId,
    checking,
    checkNow,
    logout,
    loading,
  };
}
