'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export function useBannedStatus() {
  const router = useRouter();
  const t = useTranslations('Banned');
  const [reason, setReason] = useState<string>('');
  const [until, setUntil] = useState<string | null>(null);

  useEffect(() => {
    try {
      const r = sessionStorage.getItem('ban_reason') || t('title');
      const u = sessionStorage.getItem('ban_until');
      setReason(r);
      setUntil(u);
    } catch {
      // sessionStorage unavailable
    }

    let active = true;
    const check = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) {
          if (active) router.replace('/login');
          return;
        }
        const base = process.env.NEXT_PUBLIC_API_BASE || '';
        const res = await fetchWithRetry(`${base}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (res.ok) {
          if (!active) return;
          try {
            sessionStorage.removeItem('ban_reason');
            sessionStorage.removeItem('ban_until');
          } catch {
            // ignore
          }
          router.replace('/');
        } else if (res.status === 401) {
          if (active) router.replace('/login');
        }
      } catch {
        if (active) router.replace('/login');
      }
    };

    check();
    const id = setInterval(check, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [router, t]);

  const untilText = useMemo(() => (until ? new Date(until).toLocaleString() : null), [until]);

  return { reason, untilText };
}
