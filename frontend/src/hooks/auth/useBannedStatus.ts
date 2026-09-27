/* ==========================================================================
   Banned Status Hook
   Compliance: ISO/IEC 25010, Separation of Concerns (<300 lines)
========================================================================== */

'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';

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

  const [reason, setReason] = useState<string>('');
  const [until, setUntil] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
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
    logout,
    loading,
  };
}
