'use client';

import { useEffect } from 'react';
import { ScrollText, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import { AdminLogsHeader, AdminLogsContent, useAdminLogs } from '@/components/admin/logs';

export default function AdminLogsPage() {
  const {
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
  } = useAdminLogs();

  useEffect(() => {
    loadLogs(1, filters, sortBy);
  }, [loadLogs]);

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

