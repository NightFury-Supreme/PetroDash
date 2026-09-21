import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

function decodeJwt(token: string): { userId?: string; username?: string; role?: string } | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(Array.prototype.map.call(json, (c: string) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')));
  } catch {
    try {
      const [, payload] = token.split('.');
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}

export function useAdminDashboard(range: string) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (force = false) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    
    const decoded = decodeJwt(token);
    if (decoded?.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    setRefreshing(true);
    setError(null);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/stats?range=${range}${force ? '&refresh=true' : ''}`;
      const r = await fetchWithRetry(url, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
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
