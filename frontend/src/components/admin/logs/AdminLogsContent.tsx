import { AdminLogsFilters } from './AdminLogsFilters';
import { AdminLogsSort } from './AdminLogsSort';
import { AdminLogsError } from './AdminLogsError';
import { AdminLogsTable } from './AdminLogsTable';
import { AdminLogsPagination } from './AdminLogsPagination';
import type { AuditLog, LogFilters } from '@/hooks/admin/logs';

interface AdminLogsContentProps {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  page: number;
  total: number;
  pageSize: number;
  filters: LogFilters;
  sortBy: string;
  onPageChange: (page: number) => void;
  onFilterChange: (key: keyof LogFilters, value: string) => void;
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
  onSortChange,
}: AdminLogsContentProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
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

      <AdminLogsError error={error} />

      <AdminLogsTable logs={logs} loading={loading} />

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
