/* ==========================================================================
   Admin Eggs Data Hook
   Compliance: ISO/IEC 25010, Separation of Concerns (<300 lines)
========================================================================== */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { AdminEgg } from '@/components/admin/eggs/types';

export type { AdminEgg as Egg };

export function useAdminEggs() {
  const router = useRouter();
  const [eggs, setEggs] = useState<AdminEgg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEggs = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/admin/eggs';
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs`, {
        headers: { Authorization: `Bearer ${token}` },
        timeoutMs: 20000,
      });

      if (res.status === 401) {
        localStorage.removeItem('auth_token');
        const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/admin/eggs';
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      if (res.status === 403) {
        router.replace('/dashboard');
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errCode = data?.error?.code || data?.error?.message || data?.error || 'ERR_EGGS_FETCH_FAILED';
        throw new Error(typeof errCode === 'string' ? errCode : 'ERR_EGGS_FETCH_FAILED');
      }
      if (Array.isArray(data)) {
        setEggs(data);
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        if (e.name === 'AbortError' || e.message?.toLowerCase().includes('aborted') || e.message === 'ERR_SERVER_TIMEOUT') {
          setError('ERR_SERVER_TIMEOUT');
        } else {
          setError(e.message || 'ERR_EGGS_FETCH_FAILED');
        }
      } else {
        setError('ERR_EGGS_FETCH_FAILED');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchEggs();
  }, [fetchEggs]);

  const deleteEgg = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      timeoutMs: 15000,
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      const errCode = d?.error?.code || d?.error?.message || d?.error || 'ERR_EGG_NOT_FOUND';
      throw new Error(typeof errCode === 'string' ? errCode : 'ERR_EGG_NOT_FOUND');
    }
    await fetchEggs();
  };

  return {
    eggs,
    loading,
    error,
    fetchEggs,
    deleteEgg,
  };
}
