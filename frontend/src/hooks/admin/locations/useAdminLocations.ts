import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { AdminLocation } from '@/components/admin/locations';

export const useAdminLocations = () => {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);
  const inFlightRef = useRef(false);

  const fetchLocations = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/admin/locations';
      routerRef.current.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      inFlightRef.current = false;
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
        const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/admin/locations';
        routerRef.current.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }
      if (res.status === 403) {
        routerRef.current.replace('/dashboard');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errCode =
          data?.error?.code || data?.error?.message || data?.error || 'ERR_LOCATIONS_FETCH_FAILED';
        throw new Error(errCode);
      }
      if (Array.isArray(data)) {
        setLocations(data);
        hasLoadedRef.current = true;
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'ERR_LOCATIONS_FETCH_FAILED');
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      fetchLocations();
    }
    const handleUpdate = () => {
      fetchLocations();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('servers:update', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('servers:update', handleUpdate);
      }
    };
  }, [fetchLocations]);

  const deleteLocation = async (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations/${id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      const errCode =
        d?.error?.code || d?.error?.message || d?.error || 'ERR_LOCATION_DELETE_FAILED';
      throw new Error(errCode);
    }
    await fetchLocations();
  };

  return {
    locations,
    loading,
    error,
    fetchLocations,
    deleteLocation,
  };
};
