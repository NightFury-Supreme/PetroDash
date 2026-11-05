'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

function clearBanSession() {
  try {
    sessionStorage.removeItem('is_banned');
    sessionStorage.removeItem('ban_reason');
    sessionStorage.removeItem('ban_until');
    sessionStorage.removeItem('ban_username');
  } catch {}
}

function extractUsernameFromJwt(): string {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return '';
    const parts = token.split('.');
    if (parts.length < 2) return '';
    const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr) as { username?: string };
    return typeof payload.username === 'string' ? payload.username : '';
  } catch {
    return '';
  }
}

export function useBannedStatus() {
  const router = useRouter();
  const locale = useLocale();

  const [reason, setReason] = useState<string>('');
  const [until, setUntil] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const isMountedRef = useRef<boolean>(true);

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
    } finally {
      setLoading(false);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const check = useCallback(async () => {
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
        clearBanSession();
        if (isMountedRef.current) {
          router.replace('/');
        }
        return;
      }

      if (res.status === 403) {
        const d = (await res.json().catch(() => ({}))) as {
          details?: { reason?: string; until?: string | null; username?: string };
        };
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
        } catch {}
        return;
      }

      if (res.status === 401) {
        try {
          localStorage.removeItem('auth_token');
          clearBanSession();
        } catch {}
        if (isMountedRef.current) {
          router.replace('/login');
        }
      }
    } catch {}
  }, [router]);

  useEffect(() => {
    check();
    const intervalId = setInterval(check, 10000);
    const onFocus = () => check();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [check]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('auth_token');
      clearBanSession();
    } catch {}
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
    logout,
    loading,
  };
}
