import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { AdminGiftItem, GiftPagination, GiftListResponse } from '@/components/admin/gifts/types';

interface CacheEntry {
  data: GiftListResponse;
  timestamp: number;
}

const CACHE_TTL_MS = 60000;
const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<GiftListResponse>>();

export function invalidateAdminGiftsCache() {
  memoryCache.clear();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin:gifts:refresh'));
  }
}

export function useAdminGift(currentPage: number, query: string, tab: string, sortBy: string) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const currentKey = `${currentPage}:${query.trim()}:${tab}:${sortBy}`;
  const initialCache = memoryCache.get(currentKey);
  const isCacheFresh = initialCache ? Date.now() - initialCache.timestamp < CACHE_TTL_MS : false;

  const [gifts, setGifts] = useState<AdminGiftItem[]>(() => (initialCache ? initialCache.data.gifts : []));
  const [pagination, setPagination] = useState<GiftPagination>(() =>
    initialCache
      ? { page: initialCache.data.page, totalPages: initialCache.data.totalPages, total: initialCache.data.total }
      : { page: 1, totalPages: 1, total: 0 }
  );
  const [loading, setLoading] = useState<boolean>(!isCacheFresh);
  const [error, setError] = useState<string | null>(null);

  const loadedKeyRef = useRef<string | null>(initialCache ? currentKey : null);

  const fetchGifts = useCallback(async (options?: { force?: boolean }) => {
    const key = `${currentPage}:${query.trim()}:${tab}:${sortBy}`;

    if (!options?.force) {
      const cached = memoryCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        setGifts(cached.data.gifts);
        setPagination({
          page: cached.data.page,
          totalPages: cached.data.totalPages,
          total: cached.data.total,
        });
        setLoading(false);
        loadedKeyRef.current = key;
        return;
      }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/admin/gift';
      routerRef.current.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    let requestPromise = inFlightRequests.get(key);
    if (!requestPromise) {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/gifts`);
      url.searchParams.set('page', currentPage.toString());
      url.searchParams.set('limit', '10');
      url.searchParams.set('tab', tab);
      url.searchParams.set('sort', sortBy);
      if (query.trim()) url.searchParams.set('search', query.trim());

      requestPromise = (async () => {
        const res = await fetchWithRetry(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
          const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/admin/gift';
          routerRef.current.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
          throw new Error('ERR_UNAUTHORIZED');
        }

        if (res.status === 403) {
          routerRef.current.replace('/dashboard');
          throw new Error('ERR_FORBIDDEN');
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || errData.message || 'ERR_GIFT_NOT_FOUND');
        }

        const rawData = await res.json().catch(() => ({ gifts: [], total: 0, page: 1, limit: 10, totalPages: 1 }));
        const responseData: GiftListResponse = Array.isArray(rawData)
          ? { gifts: rawData, total: rawData.length, page: 1, limit: 10, totalPages: 1 }
          : {
              gifts: rawData.gifts || [],
              total: rawData.total || 0,
              page: rawData.page || 1,
              limit: rawData.limit || 10,
              totalPages: rawData.totalPages || 1,
            };

        memoryCache.set(key, { data: responseData, timestamp: Date.now() });
        return responseData;
      })();

      inFlightRequests.set(key, requestPromise);
    }

    try {
      if (!initialCache && !memoryCache.has(key)) {
        setLoading(true);
      }
      setError(null);

      const d = await requestPromise;
      setGifts(d.gifts);
      setPagination({
        page: d.page,
        totalPages: d.totalPages,
        total: d.total,
      });
      loadedKeyRef.current = key;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'ERR_UNKNOWN';
      if (errMsg !== 'ERR_UNAUTHORIZED' && errMsg !== 'ERR_FORBIDDEN') {
        setError(errMsg);
      }
    } finally {
      inFlightRequests.delete(key);
      setLoading(false);
    }
  }, [currentPage, query, tab, sortBy, initialCache]);

  useEffect(() => {
    if (loadedKeyRef.current === currentKey && memoryCache.has(currentKey)) {
      const cached = memoryCache.get(currentKey);
      if (cached) {
        setGifts(cached.data.gifts);
        setPagination({
          page: cached.data.page,
          totalPages: cached.data.totalPages,
          total: cached.data.total,
        });
        setLoading(false);
      }
      return;
    }
    fetchGifts();
  }, [currentKey, fetchGifts]);

  useEffect(() => {
    const handleRefresh = () => {
      memoryCache.clear();
      fetchGifts({ force: true });
    };
    window.addEventListener('admin:gifts:refresh', handleRefresh);
    window.addEventListener('gifts:refresh', handleRefresh);
    window.addEventListener('user:refresh', handleRefresh);
    return () => {
      window.removeEventListener('admin:gifts:refresh', handleRefresh);
      window.removeEventListener('gifts:refresh', handleRefresh);
      window.removeEventListener('user:refresh', handleRefresh);
    };
  }, [fetchGifts]);

  return { gifts, pagination, loading, error, fetchGifts, setLoading };
}
