import { AdminLogsFilters } from './AdminLogsFilters';
import { AdminLogsSort } from './AdminLogsSort';
import { AdminLogsError } from './AdminLogsError';
import { AdminLogsTable } from './AdminLogsTable';
import { AdminLogsPagination } from './AdminLogsPagination';

import { AuditLog } from './types';

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
    requestId: string;
    severity: string;
  };
  sortBy: string;
  onPageChange: (page: number) => void;
  onFilterChange: (key: 'action' | 'actorId' | 'resourceType' | 'requestId' | 'severity', value: string) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  onSortChange: (sort: string) => void;
}

export function AdminLogsContent({
  logs,
  loading,
  error,
  page,
  total,
  pageSize,
  filters,
  sortBy,
  onPageChange,
  onFilterChange,
  onSearchChange,
  onClearFilters,
  onSortChange
}: AdminLogsContentProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-[10px] w-full">
        <div className="flex-1 w-full">
          <AdminLogsFilters
            filters={filters}
            onFilterChange={onFilterChange}
            onSearchChange={onSearchChange}
            onClearFilters={onClearFilters}
            loading={loading}
          />
        </div>
        <div className="mt-[25px] flex-shrink-0">
          <AdminLogsSort 
            sortBy={sortBy} 
            setSortBy={onSortChange} 
            loading={loading} 
          />
        </div>
      </div>

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
