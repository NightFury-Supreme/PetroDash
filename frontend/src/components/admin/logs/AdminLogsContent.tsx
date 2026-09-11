import { AdminLogsFilters } from './AdminLogsFilters';
import { AdminLogsError } from './AdminLogsError';
import { AdminLogsTable } from './AdminLogsTable';
import { AdminLogsPagination } from './AdminLogsPagination';

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

interface AdminLogsContentProps {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  page: number;
  total: number;
  pageSize: number;
  filters: {
    action: string;
    actorId: string;
    resourceType: string;
  };
  onPageChange: (page: number) => void;
  onFilterChange: (key: 'action' | 'actorId' | 'resourceType', value: string) => void;
  onClearFilters: () => void;
}

export function AdminLogsContent({
  logs,
  loading,
  error,
  page,
  total,
  pageSize,
  filters,
  onPageChange,
  onFilterChange,
  onClearFilters
}: AdminLogsContentProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      {/* Filters */}
      <AdminLogsFilters
        filters={filters}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        loading={loading}
      />

      {/* Error Display */}
      <AdminLogsError error={error} />

      {/* Table */}
      <AdminLogsTable
        logs={logs}
        loading={loading}
      />

      {/* Pagination */}
      <AdminLogsPagination
        currentPage={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
        loading={loading}
      />
    </>
  );
}
