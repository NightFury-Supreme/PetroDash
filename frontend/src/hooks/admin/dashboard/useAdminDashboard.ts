import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { AdminStatsResponse } from './adminDashboard.types';

const memoryCache = new Map<string, { data: AdminStatsResponse; timestamp: number }>();
const inFlightPromises = new Map<string, Promise<AdminStatsResponse>>();
const CACHE_TTL_MS = 60000;

export function useAdminDashboard(range: string) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStatsResponse | null>(() => memoryCache.get(range)?.data || null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const loadedRangeRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchStats = useCallback(async (force = false) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/admin';
      routerRef.current.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    const cached = memoryCache.get(range);
    const isFresh = cached && (Date.now() - cached.timestamp < CACHE_TTL_MS);

    if (!force && isFresh) {
      if (mountedRef.current) {
        setStats(cached.data);
        setError(null);
        setRefreshing(false);
        loadedRangeRef.current = range;
      }
      return;
    }

    if (!force && inFlightPromises.has(range)) {
      try {
        const promisedData = await inFlightPromises.get(range)!;
        if (mountedRef.current) {
          setStats(promisedData);
          setError(null);
          setRefreshing(false);
          loadedRangeRef.current = range;
        }
      } catch (err: unknown) {
        if (mountedRef.current) {
          const message = err instanceof Error ? err.message : 'ERR_STATS_FETCH_FAILED';
          setError(message);
          setRefreshing(false);
        }
      }
      return;
    }

    if (mountedRef.current) {
      setRefreshing(true);
      setError(null);
    }

    const fetchPromise = (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || '';
        const url = `${base}/api/admin/stats?range=${range}${force ? '&refresh=true' : ''}`;
        const r = await fetchWithRetry(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (r.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
          }
          const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/admin';
          routerRef.current.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
          throw new Error('ERR_UNAUTHORIZED');
        }

        if (r.status === 403) {
          routerRef.current.replace('/dashboard');
          throw new Error('ERR_FORBIDDEN');
        }

        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          const errCode = d?.error?.code || (typeof d?.error === 'string' ? d.error : 'ERR_STATS_FETCH_FAILED');
          throw new Error(errCode);
        }

        const data = d as AdminStatsResponse;
        memoryCache.set(range, { data, timestamp: Date.now() });
        return data;
      } finally {
        inFlightPromises.delete(range);
      }
    })();

    inFlightPromises.set(range, fetchPromise);

    try {
      const data = await fetchPromise;
      if (mountedRef.current) {
        setStats(data);
        loadedRangeRef.current = range;
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'ERR_STATS_FETCH_FAILED';
        if (message !== 'ERR_UNAUTHORIZED' && message !== 'ERR_FORBIDDEN') {
          setError(message);
        }
      }
    } finally {
      if (mountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [range]);

  useEffect(() => {
    const cached = memoryCache.get(range);
    if (cached) {
      setStats(cached.data);
    }
    if (loadedRangeRef.current === range && cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return;
    }
    fetchStats(false);
  }, [range, fetchStats]);

  return {
    stats,
    error,
    refreshing,
    refresh: (force = true) => fetchStats(force),
  };
}
