import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { AuditLog, LogsResponse, LogFilters } from './types';

export function useAdminLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(50);
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState<LogFilters>({
    action: '',
    actorId: '',
    resourceType: '',
    requestId: '',
    severity: ''
  });

  const { showSuccess, showError } = useToast();

  const loadLogs = useCallback(async (pageNum = 1, filterParams = filters, sortParam = sortBy) => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('pageSize', pageSize.toString());
      params.set('sortBy', sortParam);
      
      if (filterParams.action) params.set('action', filterParams.action);
      if (filterParams.actorId) params.set('actorId', filterParams.actorId);
      if (filterParams.resourceType) params.set('resourceType', filterParams.resourceType);
      if (filterParams.requestId) params.set('requestId', filterParams.requestId);
      if (filterParams.severity) params.set('severity', filterParams.severity);

      const response = await fetch(\\/api/admin/logs?\\, {
        headers: { Authorization: \Bearer \\ }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load logs' }));
        throw new Error(errorData?.error || \HTTP \: \\);
      }

      const data: LogsResponse = await response.json();
      setLogs(data.list || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      if (logs.length > 0) {
        showError(e instanceof Error ? e.message : 'An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [pageSize, logs.length, filters, sortBy, showError]);

  const handlePageChange = (newPage: number) => {
    loadLogs(newPage, filters, sortBy);
  };

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadLogs(1, newFilters, sortBy);
  };

  const handleSearchChange = (value: string) => {
    const isRequestId = value.length === 36 && value.includes('-');
    const newFilters = { 
      ...filters, 
      actorId: isRequestId ? '' : value,
      requestId: isRequestId ? value : '' 
    };
    setFilters(newFilters);
    loadLogs(1, newFilters, sortBy);
  };

  const handleClearFilters = () => {
    const emptyFilters = { action: '', actorId: '', resourceType: '', requestId: '', severity: '' };
    setFilters(emptyFilters);
    loadLogs(1, emptyFilters, sortBy);
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
    handleSortChange
  };
}

