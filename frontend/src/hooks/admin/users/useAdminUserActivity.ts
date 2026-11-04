'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { adminUsersApi } from '@/utils/api/adminUsers';
import { useToast } from '@/components/ui/ToastProvider';
import type { LogEntry } from '@/components/ui/SharedLogsTable';

export type AdminUserActivityLogItem = LogEntry;

export function useAdminUserActivity(userId: string, limit: number = 10) {
  const resolvedUserId = Array.isArray(userId) ? (userId[0] || '') : (typeof userId === 'string' ? userId.trim() : '');
  const tErrorBackend = useTranslations('BackendErrors');
  const tCommon = useTranslations('Common');
  const { showError } = useToast();
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(resolvedUserId));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const loadedKeyRef = useRef<string | null>(null);

  const fetchLogs = useCallback(
    async (p: number) => {
      if (!resolvedUserId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { res, data } = await adminUsersApi.getUserActivity(resolvedUserId, p, limit, token);
        if (!res.ok) {
          const errCode = data?.code || data?.error || 'ERR_ACTIVITY_FETCH_FAILED';
          const msg = tErrorBackend.has(errCode)
            ? tErrorBackend(errCode)
            : data?.message || tCommon('somethingWentWrong');
          throw new Error(msg);
        }
        if (data?.success) {
          setLogs(data.data || []);
          setTotalLogs(data.pagination?.total || 0);
          setTotalPages(data.pagination?.pages || 1);
        }
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : tCommon('error');
        showErrorRef.current(
          tErrorBackend.has(errMsg) ? tErrorBackend(errMsg) : errMsg || tCommon('error')
        );
      } finally {
        setLoading(false);
      }
    },
    [resolvedUserId, limit, tErrorBackend, tCommon]
  );

  useEffect(() => {
    if (!resolvedUserId) {
      setLoading(false);
      return;
    }
    const key = `${resolvedUserId}:${page}:${limit}`;
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    fetchLogs(page);
  }, [resolvedUserId, page, limit, fetchLogs]);

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
