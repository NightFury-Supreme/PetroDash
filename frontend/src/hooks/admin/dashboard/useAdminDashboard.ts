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

  const fetchStats = useCallback(async () => {
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
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/stats?range=${range}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const d = await r.json();
      if (r.ok) {
        setStats(d);
      } else {
        throw new Error(d?.error || 'Failed to fetch dashboard stats');
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'fetch_failed');
    } finally {
      setRefreshing(false);
    }
  }, [range, router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, error, refreshing, refresh: fetchStats };
}
