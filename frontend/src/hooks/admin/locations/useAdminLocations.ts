/**
 * Admin Locations Hook
 */

import { useState, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { AdminLocation } from '@/components/admin/locations';

export const useAdminLocations = () => {
  const router = useRouter();
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errCode =
            data?.error?.code || data?.error?.message || data?.error || 'ERR_LOCATIONS_FETCH_FAILED';
          throw new Error(errCode);
        }
        if (Array.isArray(data)) setLocations(data);
      })
      .catch((e: any) => setError(e.message || 'ERR_LOCATIONS_FETCH_FAILED'))
      .finally(() => setLoading(false));
  }, [router]);

  const deleteLocation = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations/${id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) {
      let d: any = {};
      try {
        d = await res.json();
      } catch {}
      const errCode =
        d?.error?.code || d?.error?.message || d?.error || 'ERR_LOCATION_DELETE_FAILED';
      throw new Error(errCode);
    }
    fetchLocations();
  };

  return {
    locations,
    loading,
    error,
    fetchLocations,
    deleteLocation,
  };
};
