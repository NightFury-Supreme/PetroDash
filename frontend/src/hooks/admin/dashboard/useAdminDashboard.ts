import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export function useAdminDashboard(range: string) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (force = false) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/admin';
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    setRefreshing(true);
    setError(null);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/stats?range=${range}${force ? '&refresh=true' : ''}`;
      const r = await fetchWithRetry(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (r.status === 401) {
        localStorage.removeItem('auth_token');
        const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/admin';
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      if (r.status === 403) {
        router.replace('/dashboard');
        return;
      }

      const d = await r.json();
      if (r.ok) {
        setStats(d);
      } else {
        const errCode = d?.error?.code || (typeof d?.error === 'string' ? d.error : 'ERR_STATS_FETCH_FAILED');
        throw new Error(errCode);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'ERR_STATS_FETCH_FAILED');
    } finally {
      setRefreshing(false);
    }
  }, [range, router]);

  useEffect(() => {
    fetchStats(false);
  }, [fetchStats]);

  return { stats, error, refreshing, refresh: (force = true) => fetchStats(force) };
}
