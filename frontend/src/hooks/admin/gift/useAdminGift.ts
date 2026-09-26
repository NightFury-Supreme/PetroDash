/* ==========================================================================
   Admin Gift Hook: List & Query Management
   Compliance: ISO/IEC 25010, Strong Typing, SoC
========================================================================== */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { AdminGiftItem, GiftPagination, GiftListResponse } from '@/components/admin/gifts/types';

export function useAdminGift(currentPage: number, query: string, tab: string, sortBy: string) {
  const router = useRouter();
  const [gifts, setGifts] = useState<AdminGiftItem[]>([]);
  const [pagination, setPagination] = useState<GiftPagination>({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/gifts`);
      url.searchParams.set('page', currentPage.toString());
      url.searchParams.set('limit', '10');
      url.searchParams.set('tab', tab);
      url.searchParams.set('sort', sortBy);
      if (query.trim()) url.searchParams.set('search', query.trim());

      const res = await fetchWithRetry(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const d: GiftListResponse | AdminGiftItem[] = await res.json().catch(() => ({ gifts: [], total: 0, page: 1, limit: 10, totalPages: 1 }));
        if (Array.isArray(d)) {
          setGifts(d);
          setPagination({ page: 1, totalPages: 1, total: d.length });
        } else {
          setGifts(d.gifts || []);
          setPagination({
            page: d.page || 1,
            totalPages: d.totalPages || 1,
            total: d.total || 0,
          });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'ERR_GIFT_NOT_FOUND');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'ERR_UNKNOWN';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, query, tab, sortBy, router]);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  return { gifts, pagination, loading, error, fetchGifts, setLoading };
}
