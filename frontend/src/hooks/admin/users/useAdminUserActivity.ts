'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminUsersApi } from '@/utils/api/adminUsers';
import type { LogEntry } from '@/components/ui/SharedLogsTable';

export type AdminUserActivityLogItem = LogEntry;

export function useAdminUserActivity(userId: string, limit: number = 10) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = useCallback(async (p: number) => {
    if (!userId) return;
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { res, data } = await adminUsersApi.getUserActivity(userId, p, limit, token);
      if (res.ok && data?.success) {
        setLogs(data.data || []);
        setTotalLogs(data.pagination?.total || 0);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  const refresh = useCallback(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  return {
    logs,
    loading,
    page,
    setPage,
    totalPages,
    totalLogs,
    refresh,
  };
}

export default useAdminUserActivity;
