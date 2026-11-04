'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';

export interface ActivityLogItem {
  id: string;
  action: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  success?: boolean;
}

interface CachedActivityLogs {
  logs: ActivityLogItem[];
  total: number;
  pages: number;
}

const memoryCache: Record<string, CachedActivityLogs> = {};
const inFlightFetches: Record<string, Promise<CachedActivityLogs | null>> = {};

export function clearActivityLogsCache(): void {
  for (const k of Object.keys(memoryCache)) {
    delete memoryCache[k];
  }
}

export interface UseActivityLogsResult {
  logs: ActivityLogItem[];
  loading: boolean;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  totalPages: number;
  totalLogs: number;
  refetch: (options?: { force?: boolean }) => Promise<void>;
}

export function useActivityLogs(limit: number = 10): UseActivityLogsResult {
  const tErrorBackend = useTranslations('BackendErrors');
  const tCommon = useTranslations('Common');
  const { showError } = useToast();

  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;
  const tErrorBackendRef = useRef(tErrorBackend);
  tErrorBackendRef.current = tErrorBackend;
  const tCommonRef = useRef(tCommon);
  tCommonRef.current = tCommon;

  const [page, setPage] = useState(1);
  const cacheKey = `${page}:${limit}`;
  const cached = memoryCache[cacheKey];

  const [logs, setLogs] = useState<ActivityLogItem[]>(() => cached?.logs ?? []);
  const [totalLogs, setTotalLogs] = useState<number>(() => cached?.total ?? 0);
  const [totalPages, setTotalPages] = useState<number>(() => cached?.pages ?? 1);
  const [loading, setLoading] = useState<boolean>(() => !cached);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handlePageChange = useCallback((newPage: number | ((prev: number) => number)) => {
    setPage((prev) => {
      const resolved = typeof newPage === 'function' ? newPage(prev) : newPage;
      const cachedPage = memoryCache[`${resolved}:${limit}`];
      if (cachedPage) {
        setLogs(cachedPage.logs);
        setTotalLogs(cachedPage.total);
        setTotalPages(cachedPage.pages);
        setLoading(false);
      } else {
        setLoading(true);
      }
      return resolved;
    });
  }, [limit]);

  const fetchLogs = useCallback(
    async (options?: { force?: boolean }) => {
      const key = `${page}:${limit}`;
      if (options?.force) {
        clearActivityLogsCache();
      }

      const currentCached = memoryCache[key];
      if (currentCached && !options?.force) {
        setLogs(currentCached.logs);
        setTotalLogs(currentCached.total);
        setTotalPages(currentCached.pages);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const base = process.env.NEXT_PUBLIC_API_BASE || '';

      try {
        if (!inFlightFetches[key]) {
          inFlightFetches[key] = (async () => {
            const res = await fetchWithRetry(`${base}/api/activity?page=${page}&limit=${limit}`, {
              headers: {
                Authorization: `Bearer ${token || ''}`,
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
              },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              const errCode = data?.code || data?.error || 'ERR_ACTIVITY_FETCH_FAILED';
              const msg = tErrorBackendRef.current.has(errCode)
                ? tErrorBackendRef.current(errCode)
                : data?.message || tCommonRef.current('somethingWentWrong');
              throw new Error(msg);
            }
            if (data.success) {
              const result: CachedActivityLogs = {
                logs: Array.isArray(data.data) ? data.data : [],
                total: Number(data.pagination?.total) || 0,
                pages: Number(data.pagination?.pages) || 1,
              };
              memoryCache[key] = result;
              return result;
            }
            return null;
          })().finally(() => {
            delete inFlightFetches[key];
          });
        }

        const result = await inFlightFetches[key];
        if (isMountedRef.current && result) {
          setLogs(result.logs);
          setTotalLogs(result.total);
          setTotalPages(result.pages);
        }
      } catch (e: unknown) {
        if (isMountedRef.current) {
          const errMsg = e instanceof Error ? e.message : tCommonRef.current('error');
          showErrorRef.current(
            tErrorBackendRef.current.has(errMsg)
              ? tErrorBackendRef.current(errMsg)
              : errMsg || tCommonRef.current('error')
          );
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [page, limit]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    page,
    setPage: handlePageChange,
    totalPages,
    totalLogs,
    refetch: fetchLogs,
  };
}
