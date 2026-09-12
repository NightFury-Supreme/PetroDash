"use client";

import { useEffect, useState, useCallback } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import { ScrollText, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import { AdminLogsHeader, AdminLogsContent } from '@/components/admin/logs';

interface AuditLog {
  _id: string;
  actorId?: string;
  actorRole: 'user' | 'admin';
  actorUsername?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  targetUserId?: string;
  meta: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  success?: boolean;
  durationMs?: number;
  responsePreview?: string;
  createdAt: string;
}

interface LogsResponse {
  list: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(50);
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load logs' }));
        throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
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
  }, [pageSize, logs.length]);

  useEffect(() => {
    loadLogs(1, filters, sortBy);
  }, [loadLogs]);

  const handlePageChange = (newPage: number) => {
    loadLogs(newPage, filters, sortBy);
  };

  const handleFilterChange = (key: 'action' | 'actorId' | 'resourceType' | 'requestId' | 'severity', value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadLogs(1, newFilters, sortBy);
  };

  const handleSearchChange = (value: string) => {
    // Check if it looks like a UUID (Request ID)
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

  if (loading && logs.length === 0) {
    return (
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
        <div className="flex flex-col space-y-6">
          <AdminLogsHeader />
          <AdminLogsContent
            logs={[]}
            loading={true}
            error={null}
            page={page}
            total={0}
            pageSize={pageSize}
            filters={filters}
            sortBy={sortBy}
            onPageChange={handlePageChange}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            onClearFilters={handleClearFilters}
            onSortChange={handleSortChange}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<ScrollText strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker="Load Error"
          title="Failed to Load Logs"
          errorString={error}
          description={<ErrorDescription error={error} topic="Logs" />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                Retry
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <AdminLogsHeader />

        {/* Main Content */}
        <AdminLogsContent
          logs={logs}
          loading={loading}
          error={error}
          page={page}
          total={total}
          pageSize={pageSize}
          filters={filters}
          sortBy={sortBy}
          onPageChange={handlePageChange}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          onClearFilters={handleClearFilters}
          onSortChange={handleSortChange}
        />
      </div>
    </div>
  );
}


