import { useState, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';
import { AuditLog, LogsResponse, LogFilters } from './types';

const INITIAL_FILTERS: LogFilters = {
  q: '',
  action: '',
  actorId: '',
  resourceType: '',
  requestId: '',
  severity: '',
};

export function useAdminLogs() {
  const tError = useTranslations('GlobalErrors');
  const tErrorBackend = useTranslations('BackendErrors');
  const tCommon = useTranslations('Common');
  const { showError } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(50);
  const [sortBy, setSortBy] = useState('date_desc');
  const [filters, setFilters] = useState<LogFilters>(INITIAL_FILTERS);

  const loadLogs = useCallback(
    async (pageNum = 1, filterParams = filters, sortParam = sortBy) => {
      setError(null);
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setError(tError('authenticationRequired'));
          return;
        }

        const params = new URLSearchParams();
        params.set('page', pageNum.toString());
        params.set('pageSize', pageSize.toString());
        params.set('sortBy', sortParam);

        if (filterParams.q) params.set('q', filterParams.q);
        if (filterParams.action) params.set('action', filterParams.action);
        if (filterParams.actorId) params.set('actorId', filterParams.actorId);
        if (filterParams.resourceType) params.set('resourceType', filterParams.resourceType);
        if (filterParams.requestId) params.set('requestId', filterParams.requestId);
        if (filterParams.severity) params.set('severity', filterParams.severity);

        const apiBase = process.env.NEXT_PUBLIC_API_BASE || '';
        const response = await fetchWithRetry(`${apiBase}/api/admin/logs?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errCode = errorData?.code || errorData?.error || 'ERR_FAILED_TO_LOAD_LOGS';
          const msg = tErrorBackend.has(errCode)
            ? tErrorBackend(errCode)
            : errorData?.message || errorData?.error || tCommon('somethingWentWrong');
          throw new Error(msg);
        }

        const data: LogsResponse = await response.json();
        setLogs(data.list || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : tError('unknownError');
        setError(msg);
        if (logs.length > 0) {
          showError(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [pageSize, logs.length, filters, sortBy, showError, tError, tErrorBackend, tCommon]
  );

  const handlePageChange = (newPage: number) => {
    loadLogs(newPage, filters, sortBy);
  };

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadLogs(1, newFilters, sortBy);
  };

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, q: value };
    setFilters(newFilters);
    loadLogs(1, newFilters, sortBy);
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    loadLogs(1, INITIAL_FILTERS, sortBy);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    loadLogs(1, filters, newSort);
  };

  return {
    logs,
    loading,
    error,
    page,
    total,
    pageSize,
    filters,
    sortBy,
    loadLogs,
    handlePageChange,
    handleFilterChange,
    handleSearchChange,
    handleClearFilters,
    handleSortChange,
  };
}
