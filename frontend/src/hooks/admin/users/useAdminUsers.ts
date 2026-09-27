/* ==========================================================================
   Admin Users Hook
   Compliance: ISO/IEC 25010, Separation of Concerns (<300 lines)
========================================================================== */

import { useState, useEffect, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { adminUsersApi } from '@/utils/api/adminUsers';

export interface AdminUserPagination {
  page: number;
  totalPages: number;
  total: number;
}

export function useAdminUsers(initialSearch = '', initialPage = 1, initialPageSize = 10) {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<AdminUserPagination>({
    page: initialPage,
    totalPages: 1,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const getAuthToken = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('auth_token') || '';
  };

  const loadUsers = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users`);
      if (search.trim()) url.searchParams.set('search', search.trim());
      if (roleFilter && roleFilter !== 'all') url.searchParams.set('role', roleFilter);
      if (statusFilter && statusFilter !== 'all') url.searchParams.set('status', statusFilter);
      if (sortBy) url.searchParams.set('sortBy', sortBy);

      url.searchParams.set('paginate', 'true');
      url.searchParams.set('page', currentPage.toString());
      url.searchParams.set('pageSize', pageSize.toString());

      const res = await fetchWithRetry(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(d?.error || d?.code || 'ERR_FETCH_FAILED');
      }

      setUsers(d.data || d.users || []);
      setPagination({
        page: d.meta?.currentPage || d.page || 1,
        totalPages: d.meta?.totalPages || d.totalPages || 1,
        total: d.meta?.total || d.total || 0,
      });
      setError(null);
    } catch (e: any) {
      setError(e.message || 'ERR_FETCH_FAILED');
    } finally {
      setLoading(false);
    }
  }, [search, currentPage, pageSize, roleFilter, statusFilter, sortBy]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const toggleBanUser = async (user: any) => {
    const token = getAuthToken();
    if (!token) return;

    const isCurrentlyBanned = Boolean(user.ban?.isBanned);
    setBanningUserId(user._id);

    try {
      const payload = isCurrentlyBanned
        ? { isBanned: false }
        : { isBanned: true, reason: 'Suspended by Administrator' };

      const res = await adminUsersApi.banUser(user._id, payload, token);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || d.code || 'ERR_BAN_USER_FAILED');
      }

      // Optimistically update list
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id
            ? {
                ...u,
                ban: {
                  ...u.ban,
                  isBanned: !isCurrentlyBanned,
                  reason: !isCurrentlyBanned ? 'Suspended by Administrator' : '',
                },
              }
            : u
        )
      );
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
      await loadUsers();
    } finally {
      setDeletingUserId(null);
    }
  };

  return {
    users,
    pagination,
    error,
    loading,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    banningUserId,
    deletingUserId,
    refreshUsers: loadUsers,
    toggleBanUser,
    deleteUser,
    setLoading,
  };
}
