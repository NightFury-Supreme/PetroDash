import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { fetchBrandingData, getCachedBrandingSync } from '@/utils/configCache';
import type { AdminCouponItem, CouponPagination, CouponsListResponse } from '@/components/admin/coupons/types';

interface CouponPlanOption {
  id: string;
  name: string;
  pricePerMonth?: number;
  currency?: string;
}

export function useCouponsList(initialPage = 1, limit = 10) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [coupons, setCoupons] = useState<AdminCouponItem[]>([]);
  const [plans, setPlans] = useState<CouponPlanOption[]>([]);
  const [currency, setCurrency] = useState<string>(() => getCachedBrandingSync().currency || 'USD');
  const [page, setPage] = useState(initialPage);
  const [pagination, setPagination] = useState<CouponPagination>({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  const inFlightRef = useRef<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter, sort]);

  const fetchCoupons = useCallback(async (
    currentPage = page,
    search = debouncedSearch,
    status = statusFilter,
    type = typeFilter,
    sortOrder = sort
  ) => {
    const flightKey = `${currentPage}:${search}:${status}:${type}:${sortOrder}`;
    if (inFlightRef.current === flightKey) return;
    inFlightRef.current = flightKey;

    setLoading(true);
    setError(null);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/admin/coupons';
      routerRef.current.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      inFlightRef.current = null;
      return;
    }

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(limit),
        search: search.trim(),
        status,
        type,
        sort: sortOrder,
      });

      const [couponsRes, plansRes, brandingData] = await Promise.all([
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/coupons?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchBrandingData(),
      ]);

      if (couponsRes.status === 401 || plansRes.status === 401) {
        if (typeof window !== 'undefined') localStorage.removeItem('auth_token');
        const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/admin/coupons';
        routerRef.current.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      if (couponsRes.status === 403 || plansRes.status === 403) {
        routerRef.current.replace('/dashboard');
        return;
      }

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
        const rawPlans = pData.plans || pData || [];
        setPlans(Array.isArray(rawPlans) ? rawPlans : []);
      }

      if (brandingData?.currency) {
        setCurrency(brandingData.currency);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'ERR_UNKNOWN';
      setError(errMsg);
    } finally {
      inFlightRef.current = null;
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, typeFilter, sort]);

  useEffect(() => {
    fetchCoupons(page, debouncedSearch, statusFilter, typeFilter, sort);
  }, [page, debouncedSearch, statusFilter, typeFilter, sort, fetchCoupons]);

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
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    sort,
    setSort,
    refresh: () => fetchCoupons(page, debouncedSearch, statusFilter, typeFilter, sort),
    refetch: () => fetchCoupons(page, debouncedSearch, statusFilter, typeFilter, sort),
  };
}
