import { useState, useCallback, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export function useAdminGift(currentPage: number, query: string, tab: string, sortBy: string) {
  const router = useRouter();
  const [gifts, setGifts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/gifts`);
      url.searchParams.set('page', currentPage.toString());
      url.searchParams.set('limit', '10');
      url.searchParams.set('tab', tab);
      url.searchParams.set('sort', sortBy);
      if (query.trim()) url.searchParams.set('search', query.trim());

      const res = await fetchWithRetry(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        let d: any = {}; try { d = await res.json(); } catch {}
        if (Array.isArray(d)) {
          setGifts(d);
          setPagination({ page: 1, totalPages: 1, total: d.length });
        } else {
          setGifts(d.gifts || []);
          setPagination({
            page: d.page || 1,
            totalPages: d.totalPages || 1,
            total: d.total || 0
          });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "fetch_failed");
      }
    } catch (err: any) {
      setError(err.message || 'fetch_failed');
    } finally {
      setLoading(false);
    }
  }, [currentPage, query, tab, sortBy, router]);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  return { gifts, pagination, loading, error, fetchGifts, setLoading };
}
