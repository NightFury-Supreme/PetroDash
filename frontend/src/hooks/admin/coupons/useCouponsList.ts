/* ==========================================================================
   Admin Coupons Hook: List Management
   Compliance: ISO/IEC 25010, Strong Typing, SoC
========================================================================== */

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { AdminCouponItem, CouponPagination, CouponsListResponse } from '@/components/admin/coupons/types';

export function useCouponsList(initialPage = 1, limit = 10) {
  const router = useRouter();
  const [coupons, setCoupons] = useState<AdminCouponItem[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [page, setPage] = useState(initialPage);
  const [pagination, setPagination] = useState<CouponPagination>({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = useCallback(async (currentPage = page) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const [couponsRes, plansRes, brandingRes] = await Promise.all([
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/coupons?page=${currentPage}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/branding`),
      ]);

      if (couponsRes.ok) {
        const cData: CouponsListResponse = await couponsRes.json().catch(() => ({ coupons: [], total: 0, page: 1, limit, totalPages: 1 }));
        setCoupons(cData.coupons || []);
        setPagination({
          page: cData.page || 1,
          totalPages: cData.totalPages || 1,
          total: cData.total || 0,
        });
      } else {
        const errData = await couponsRes.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'ERR_INTERNAL_SERVER_ERROR');
      }

      if (plansRes.ok) {
        const pData = await plansRes.json().catch(() => ({}));
        setPlans(pData.plans || pData || []);
      }

      if (brandingRes.ok) {
        const bData = await brandingRes.json().catch(() => ({}));
        if (bData?.currency) setCurrency(bData.currency);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'ERR_UNKNOWN';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, router]);

  useEffect(() => {
    fetchCoupons(page);
  }, [page, fetchCoupons]);

  return {
    coupons,
    plans,
    currency,
    page,
    setPage,
    handlePageChange: setPage,
    pagination,
    loading,
    error,
    refresh: () => fetchCoupons(page),
    refetch: () => fetchCoupons(page),
  };
}
