"use client";

import { useEffect, useState, useCallback } from 'react';
import { AdminLogsHeader, AdminLogsContent } from '@/components/admin/logs';
import { useModal } from '@/components/Modal';

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
  const [filters, setFilters] = useState({
    action: '',
    actorId: '',
    resourceType: ''
  });
  const modal = useModal();

  const loadLogs = useCallback(async (pageNum = 1, filterParams = filters) => {
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
      
      if (filterParams.action) params.set('action', filterParams.action);
      if (filterParams.actorId) params.set('actorId', filterParams.actorId);
      if (filterParams.resourceType) params.set('resourceType', filterParams.resourceType);

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
      const errorMessage = e instanceof Error ? e.message : 'Failed to load logs';
      setError(errorMessage);
      await modal.error({
        title: "Failed to Load Logs",
        body: errorMessage || 'An error occurred while loading the audit logs.'
      });
    } finally {
      setLoading(false);
    }
  }, [pageSize, filters, modal]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadLogs(newPage);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPage(1); // Reset to first page when filtering
    loadLogs(1, newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = { action: '', actorId: '', resourceType: '' };
    setFilters(clearedFilters);
    setPage(1);
    loadLogs(1, clearedFilters);
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
            onPageChange={handlePageChange}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>
    );
  }

  if (error) throw new Error(error);

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
          onPageChange={handlePageChange}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>
    </div>
  );
}


