import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export interface RedemptionRecord {
  user: {
    id?: string;
    username?: string;
    email?: string;
    profilePicture?: string;
  };
  redeemedAt: string;
}

interface RedemptionsCacheEntry {
  code: string;
  redemptions: RedemptionRecord[];
  pagination: { page: number; totalPages: number; total: number };
  timestamp: number;
}

const redemptionsCache = new Map<string, RedemptionsCacheEntry>();

export function useGiftRedemptions(giftId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [giftCode, setGiftCode] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const resolvedGiftId = typeof giftId === 'string' ? giftId.trim() : null;
  const loadedKeyRef = useRef<string | null>(null);
  const inFlightRef = useRef<string | null>(null);

  const loadRedemptions = useCallback(async (page: number, force = false) => {
    if (!resolvedGiftId) return;
    const key = `${resolvedGiftId}:${page}`;

    if (!force) {
      const cached = redemptionsCache.get(key);
      if (cached && Date.now() - cached.timestamp < 30000) {
        setGiftCode(cached.code);
        setRedemptions(cached.redemptions);
        setPagination(cached.pagination);
        loadedKeyRef.current = key;
        return;
      }
    }

    if (inFlightRef.current === key) return;
    inFlightRef.current = key;

    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/gifts/${resolvedGiftId}/redemptions?page=${page}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errKey = data.error || 'ERR_GIFT_NOT_FOUND';
        setError(errKey);
        return;
      }

      const entry = {
        code: data.code || '',
        redemptions: data.redemptions || [],
        pagination: data.pagination || { page: 1, totalPages: 1, total: 0 },
        timestamp: Date.now(),
      };

      redemptionsCache.set(key, entry);
      setGiftCode(entry.code);
      setRedemptions(entry.redemptions);
      setPagination(entry.pagination);
      loadedKeyRef.current = key;
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'ERR_INTERNAL_SERVER_ERROR';
      setError(errMsg);
    } finally {
      inFlightRef.current = null;
      setLoading(false);
    }
  }, [resolvedGiftId]);

  useEffect(() => {
    if (resolvedGiftId) {
      const key = `${resolvedGiftId}:${currentPage}`;
      if (loadedKeyRef.current === key) return;
      loadRedemptions(currentPage);
    } else {
      setRedemptions([]);
      setGiftCode('');
      setCurrentPage(1);
      setError(null);
      loadedKeyRef.current = null;
    }
  }, [resolvedGiftId, currentPage, loadRedemptions]);

  useEffect(() => {
    const handleRefresh = () => {
      redemptionsCache.clear();
      if (resolvedGiftId) loadRedemptions(currentPage, true);
    };
    window.addEventListener('admin:gifts:refresh', handleRefresh);
    window.addEventListener('gifts:refresh', handleRefresh);
    window.addEventListener('user:refresh', handleRefresh);
    return () => {
      window.removeEventListener('admin:gifts:refresh', handleRefresh);
      window.removeEventListener('gifts:refresh', handleRefresh);
      window.removeEventListener('user:refresh', handleRefresh);
    };
  }, [resolvedGiftId, currentPage, loadRedemptions]);

  return {
    redemptions,
    giftCode,
    loading,
    error,
    currentPage,
    setCurrentPage,
    pagination,
    refresh: () => loadRedemptions(currentPage, true),
  };
}
