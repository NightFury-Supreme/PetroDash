import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { adminUsersApi } from '@/utils/api/adminUsers';
import type { AdminUserListItem } from './types';
import {
  type UserTab,
  type AdminUserPagination,
  type TabDataState,
  memoryTabCache,
  inFlightRequests,
  applyBanToTabCache,
  applyDeleteToTabCache,
} from './adminUsersCache';

export type { UserTab, AdminUserPagination };

export function useAdminUsers(
  initialTab: UserTab = 'all',
  initialSearch = '',
  initialPage = 1,
  initialPageSize = 10
) {
  const [activeTab, setActiveTab] = useState<UserTab>(initialTab);
  const [search, setSearch] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortBy, setSortBy] = useState('newest');

  const [tabCache, setTabCache] = useState<Record<UserTab, TabDataState>>(memoryTabCache);
  const tabCacheRef = useRef(tabCache);
  tabCacheRef.current = tabCache;

  const [tabLoading, setTabLoading] = useState<Record<UserTab, boolean>>({
    all: false,
    active: false,
    banned: false,
    admins: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const getAuthToken = (): string => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '');

  const fetchTabData = useCallback(
    async (
      targetTab: UserTab,
      targetPage: number,
      querySearch: string,
      querySort: string
    ) => {
      const token = getAuthToken();
      if (!token) return;

      const cacheKey = `${targetTab}:${targetPage}:${querySearch.trim()}:${querySort}:${pageSize}`;
      if (inFlightRequests.has(cacheKey)) {
        await inFlightRequests.get(cacheKey);
        return;
      }

      setTabLoading((prev) => ({ ...prev, [targetTab]: true }));

      const fetchPromise = (async () => {
        try {
          const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users`);
          if (querySearch.trim()) url.searchParams.set('search', querySearch.trim());
          if (targetTab === 'active') url.searchParams.set('status', 'active');
          if (targetTab === 'banned') url.searchParams.set('status', 'banned');
          if (targetTab === 'admins') url.searchParams.set('role', 'admin');
          if (querySort) url.searchParams.set('sortBy', querySort);
          url.searchParams.set('paginate', 'true');
          url.searchParams.set('page', targetPage.toString());
          url.searchParams.set('pageSize', pageSize.toString());

          const res = await fetchWithRetry(url.toString(), {
            headers: { Authorization: `Bearer ${token}` },
          });

          const d = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(d?.error || d?.code || 'ERR_FETCH_FAILED');
          }

          const fetchedUsers: AdminUserListItem[] = d.data || d.users || [];
          const fetchedPagination: AdminUserPagination = {
            page: d.meta?.currentPage || d.page || targetPage,
            totalPages: d.meta?.totalPages || d.totalPages || 1,
            total: d.meta?.total || d.total || 0,
          };

          const newTabState: TabDataState = {
            users: fetchedUsers,
            pagination: fetchedPagination,
            loaded: true,
          };

          memoryTabCache[targetTab] = newTabState;
          setTabCache((prev) => ({ ...prev, [targetTab]: newTabState }));
          setError(null);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'ERR_FETCH_FAILED';
          setError(msg);
        } finally {
          inFlightRequests.delete(cacheKey);
          setTabLoading((prev) => ({ ...prev, [targetTab]: false }));
        }
      })();

      inFlightRequests.set(cacheKey, fetchPromise);
      await fetchPromise;
    },
    [pageSize]
  );

  const switchTab = useCallback(
    (newTab: UserTab) => {
      if (newTab === activeTab) return;
      setActiveTab(newTab);
      setCurrentPage(1);
      setSearch('');

      if (!tabCacheRef.current[newTab].loaded) {
        fetchTabData(newTab, 1, '', sortBy);
      }
    },
    [activeTab, sortBy, fetchTabData]
  );

  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      fetchTabData(initialTab, 1, initialSearch, sortBy);
    }
  }, [initialTab, initialSearch, sortBy, fetchTabData]);

  const prevSearchRef = useRef(search);
  const prevSortRef = useRef(sortBy);
  const prevPageRef = useRef(currentPage);

  useEffect(() => {
    if (!hasMountedRef.current) return;
    const searchChanged = prevSearchRef.current !== search;
    const sortChanged = prevSortRef.current !== sortBy;
    const pageChanged = prevPageRef.current !== currentPage;

    prevSearchRef.current = search;
    prevSortRef.current = sortBy;
    prevPageRef.current = currentPage;

    if (searchChanged || sortChanged || pageChanged) {
      fetchTabData(activeTab, currentPage, search, sortBy);
    }
  }, [activeTab, currentPage, search, sortBy, fetchTabData]);

  const toggleBanUser = async (
    user: AdminUserListItem,
    options?: { reason?: string; durationMinutes?: number }
  ) => {
    const token = getAuthToken();
    if (!token) return;

    const isCurrentlyBanned = Boolean(user.ban?.isBanned);
    setBanningUserId(user.id);

    try {
      const payload = isCurrentlyBanned
        ? { isBanned: false }
        : {
            isBanned: true,
            reason: options?.reason || '',
            durationMinutes: options?.durationMinutes,
          };

      const res = await adminUsersApi.banUser(user.id, payload, token);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || d.code || 'ERR_BAN_USER_FAILED');
      }

      setTabCache((prev) => applyBanToTabCache(prev, user, isCurrentlyBanned, options));
    } finally {
      setBanningUserId(null);
    }
  };

  const deleteUser = async (userId: string) => {
    const token = getAuthToken();
    if (!token) return;

    setDeletingUserId(userId);
    try {
      const { res, data } = await adminUsersApi.deleteUser(userId, token);
      if (!res.ok) {
        throw new Error(data?.error || data?.code || 'ERR_DELETE_USER_FAILED');
      }

      setTabCache((prev) => applyDeleteToTabCache(prev, userId));
      fetchTabData(activeTab, currentPage, search, sortBy);
    } finally {
      setDeletingUserId(null);
    }
  };

  const currentTabData = tabCache[activeTab];
  const users = currentTabData.users;
  const pagination = currentTabData.pagination;
  const loading = tabLoading[activeTab];
  const isInitialLoading = !tabCache.all.loaded && tabLoading.all && tabCache.all.users.length === 0;

  return {
    activeTab,
    setActiveTab: switchTab,
    users,
    pagination,
    error,
    loading,
    isInitialLoading,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    banningUserId,
    deletingUserId,
    refreshUsers: () => fetchTabData(activeTab, currentPage, search, sortBy),
    toggleBanUser,
    deleteUser,
  };
}
