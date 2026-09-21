import { useState, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export const useAdminLocations = () => {
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);
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
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to fetch locations');
        if (Array.isArray(data)) setLocations(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const deleteLocation = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      let d: any = {};
      try { d = await res.json(); } catch {}
      throw new Error(d?.error || 'Failed to delete location');
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
