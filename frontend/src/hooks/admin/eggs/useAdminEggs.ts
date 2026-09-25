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
      router.replace('/login');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'ERR_STATS_FETCH_FAILED');
      }
      if (Array.isArray(data)) {
        setEggs(data);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'ERR_STATS_FETCH_FAILED');
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
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d?.error || 'ERR_EGG_NOT_FOUND');
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
