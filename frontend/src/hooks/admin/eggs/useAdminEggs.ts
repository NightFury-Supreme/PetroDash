'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { AdminEgg } from '@/components/admin/eggs/types';

export type { AdminEgg as Egg };

export function useAdminEggs() {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [eggs, setEggs] = useState<AdminEgg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);
  const inFlightRef = useRef(false);

  const fetchEggs = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/admin/eggs';
      routerRef.current.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      inFlightRef.current = false;
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
        routerRef.current.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      if (res.status === 403) {
        routerRef.current.replace('/dashboard');
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errCode = data?.error?.code || data?.error?.message || data?.error || 'ERR_EGGS_FETCH_FAILED';
        throw new Error(typeof errCode === 'string' ? errCode : 'ERR_EGGS_FETCH_FAILED');
      }
      if (Array.isArray(data)) {
        setEggs(data);
        hasLoadedRef.current = true;
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
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      fetchEggs();
    }
    const handleUpdate = () => {
      fetchEggs();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('servers:update', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('servers:update', handleUpdate);
      }
    };
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
