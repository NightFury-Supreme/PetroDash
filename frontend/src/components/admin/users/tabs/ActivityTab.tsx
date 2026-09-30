'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { SharedLogsTable, type LogEntry } from '@/components/ui/SharedLogsTable';
import { Pagination } from '@/components/Pagination';
import { useAdminUserActivity } from '@/hooks/admin/users';

const LOGS_PER_PAGE = 10;

export interface ActivityTabProps {
  userId: string;
  logs?: LogEntry[];
  loading?: boolean;
  page?: number;
  totalPages?: number;
  totalLogs?: number;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
}

export function ActivityTab({
  userId,
  logs: propLogs,
  loading: propLoading,
  page: propPage,
  totalPages: propTotalPages,
  totalLogs: propTotalLogs,
  onPageChange: propOnPageChange,
}: ActivityTabProps) {
  const t = useTranslations('admin.users');
  const hookResult = useAdminUserActivity(propLogs !== undefined ? '' : userId, LOGS_PER_PAGE);

  const logs = propLogs !== undefined ? propLogs : hookResult.logs;
  const loading = propLoading !== undefined ? propLoading : hookResult.loading;
  const page = propPage !== undefined ? propPage : hookResult.page;
  const totalPages = propTotalPages !== undefined ? propTotalPages : hookResult.totalPages;
  const totalLogs = propTotalLogs !== undefined ? propTotalLogs : hookResult.totalLogs;
  const setPage = propOnPageChange || hookResult.setPage;

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">{t('activityLog')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('activityLogDesc')}</p>
          </div>
        </div>

        <div className="mt-2">
          <SharedLogsTable logs={logs} loading={loading} variant="user" />
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalLogs}
          pageSize={LOGS_PER_PAGE}
          onPageChange={setPage}
          loading={loading}
          itemName={t('events')}
        />
      </section>
    </div>
  );
}

export default ActivityTab;
