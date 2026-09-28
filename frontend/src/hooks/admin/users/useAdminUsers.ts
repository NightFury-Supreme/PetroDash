/* ==========================================================================
   Admin Users Hook
   Compliance: ISO/IEC 25010, Separation of Concerns (<300 lines)
========================================================================== */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { adminUsersApi } from '@/utils/api/adminUsers';

export type UserTab = 'all' | 'active' | 'banned' | 'admins';

export interface AdminUserPagination {
  page: number;
  totalPages: number;
  total: number;
}

interface TabDataState {
  users: any[];
  pagination: AdminUserPagination;
  loaded: boolean;
}

const emptyTab = (): TabDataState => ({ users: [], pagination: { page: 1, totalPages: 1, total: 0 }, loaded: false });
const initialTabCache: Record<UserTab, TabDataState> = {
  all: emptyTab(),
  active: emptyTab(),
  banned: emptyTab(),
  admins: emptyTab(),
};

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

  // Cache per tab to prevent destroying old data and prevent re-fetching on tab switch
  const [tabCache, setTabCache] = useState<Record<UserTab, TabDataState>>(initialTabCache);
  const tabCacheRef = useRef(tabCache);
  tabCacheRef.current = tabCache;

  const [tabLoading, setTabLoading] = useState<Record<UserTab, boolean>>({
    all: false, active: false, banned: false, admins: false,
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

      setTabLoading((prev) => ({ ...prev, [targetTab]: true }));
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

        const fetchedUsers = d.data || d.users || [];
        const fetchedPagination: AdminUserPagination = {
          page: d.meta?.currentPage || d.page || targetPage,
          totalPages: d.meta?.totalPages || d.totalPages || 1,
          total: d.meta?.total || d.total || 0,
        };

        setTabCache((prev) => ({
          ...prev,
          [targetTab]: {
            users: fetchedUsers,
            pagination: fetchedPagination,
            loaded: true,
          },
        }));

        setError(null);
      } catch (e: any) {
        setError(e.message || 'ERR_FETCH_FAILED');
      } finally {
        setTabLoading((prev) => ({ ...prev, [targetTab]: false }));
      }
    },
    [pageSize]
  );

  // Switch tab: changes active tab and resets page/search without fetching if tab is already loaded
  const switchTab = useCallback(
    (newTab: UserTab) => {
      if (newTab === activeTab) return;
      setActiveTab(newTab);
      setCurrentPage(1);
      setSearch('');

      // Only fetch from server if this tab was not previously loaded
      if (!tabCacheRef.current[newTab].loaded) {
        fetchTabData(newTab, 1, '', sortBy);
      }
    },
    [activeTab, sortBy, fetchTabData]
  );

  // Load initial tab on mount once
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      fetchTabData(initialTab, 1, initialSearch, sortBy);
    }
  }, [initialTab, initialSearch, sortBy, fetchTabData]);

  // Track search, sort, and page changes on active tab
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
    user: any,
    options?: { reason?: string; durationMinutes?: number }
  ) => {
    const token = getAuthToken();
    if (!token) return;

    const isCurrentlyBanned = Boolean(user.ban?.isBanned);
    setBanningUserId(user._id);

    try {
      const payload: {
        isBanned: boolean;
        reason?: string;
        durationMinutes?: number;
      } = isCurrentlyBanned
        ? { isBanned: false }
        : {
            isBanned: true,
            reason: options?.reason || 'Suspended by Administrator',
            durationMinutes: options?.durationMinutes,
          };

      const res = await adminUsersApi.banUser(user._id, payload, token);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || d.code || 'ERR_BAN_USER_FAILED');
      }

      setTabCache((prev) => {
        const next = { ...prev };
        for (const tabKey of ['all', 'active', 'banned', 'admins'] as UserTab[]) {
          const tabData = next[tabKey];
          if (!tabData.loaded) continue;

          if (tabKey === 'active' && !isCurrentlyBanned) {
            next.active = {
              ...tabData,
              users: tabData.users.filter((u) => u._id !== user._id),
              pagination: { ...tabData.pagination, total: Math.max(0, tabData.pagination.total - 1) },
            };
          } else if (tabKey === 'banned' && isCurrentlyBanned) {
            next.banned = {
              ...tabData,
              users: tabData.users.filter((u) => u._id !== user._id),
              pagination: { ...tabData.pagination, total: Math.max(0, tabData.pagination.total - 1) },
            };
          } else {
            next[tabKey] = {
              ...tabData,
              users: tabData.users.map((u) =>
                u._id === user._id
                  ? {
                      ...u,
                      ban: {
                        ...u.ban,
                        isBanned: !isCurrentlyBanned,
                        reason: !isCurrentlyBanned ? (options?.reason || 'Suspended by Administrator') : '',
                        until:
                          !isCurrentlyBanned && options?.durationMinutes
                            ? new Date(Date.now() + options.durationMinutes * 60000).toISOString()
                            : null,
                      },
                    }
                  : u
              ),
            };
          }
        }
        return next;
      });
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

      setTabCache((prev) => {
        const next = { ...prev };
        for (const tabKey of ['all', 'active', 'banned', 'admins'] as UserTab[]) {
          const tabData = next[tabKey];
          if (!tabData.loaded) continue;
          next[tabKey] = {
            ...tabData,
            users: tabData.users.filter((u) => u._id !== userId),
            pagination: { ...tabData.pagination, total: Math.max(0, tabData.pagination.total - 1) },
          };
        }
        return next;
      });

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
