/* ==========================================================================
   Admin Gift Redemptions Hook
   Compliance: ISO/IEC 25010, SoC (Decoupled Network Layer)
========================================================================== */

import { useState, useEffect, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useTranslations } from 'next-intl';

export interface RedemptionRecord {
  user: {
    _id?: string;
    username?: string;
    email?: string;
    profilePicture?: string;
  };
  redeemedAt: string;
}

export function useGiftRedemptions(giftId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [giftCode, setGiftCode] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const tError = useTranslations('BackendErrors');

  const loadRedemptions = useCallback(async (page: number) => {
    if (!giftId) return;
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/gifts/${giftId}/redemptions?page=${page}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errKey = data.error || 'ERR_GIFT_NOT_FOUND';
        const localizedMsg = tError.has(errKey) ? tError(errKey) : (data.error || tError('ERR_INTERNAL_SERVER_ERROR'));
        setError(localizedMsg);
        return;
      }

      setGiftCode(data.code || '');
      setRedemptions(data.redemptions || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'ERR_INTERNAL_SERVER_ERROR';
      const localizedMsg = tError.has(errMsg) ? tError(errMsg) : (errMsg || tError('ERR_INTERNAL_SERVER_ERROR'));
      setError(localizedMsg);
    } finally {
      setLoading(false);
    }
  }, [giftId, tError]);

  useEffect(() => {
    if (giftId) {
      loadRedemptions(currentPage);
    } else {
      setRedemptions([]);
      setGiftCode('');
      setCurrentPage(1);
      setError(null);
    }
  }, [giftId, currentPage, loadRedemptions]);

  return {
    redemptions,
    giftCode,
    loading,
    error,
    currentPage,
    setCurrentPage,
    pagination,
    refresh: () => loadRedemptions(currentPage),
  };
}
