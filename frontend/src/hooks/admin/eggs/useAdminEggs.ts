import { useState, useCallback, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export interface Egg {
  _id: string;
  name: string;
  description: string;
  pterodactylEggId: string;
  pterodactylNestId: string;
  recommended: boolean;
  allowedPlans: string[];
  category?: string;
  serversCount?: number;
}

export function useAdminEggs() {
  const router = useRouter();
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEggs = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) { 
      router.replace('/login'); 
      return; 
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/eggs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to fetch eggs');
      if (Array.isArray(data)) setEggs(data);
    } catch (e: any) {
      setError(e.message || 'fetch_failed');
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
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      let d: any = {}; try { d = await res.json(); } catch {}
      throw new Error(d?.error || 'Failed to delete egg');
    }
    await fetchEggs();
  };

  return { eggs, loading, error, fetchEggs, deleteEgg };
}
