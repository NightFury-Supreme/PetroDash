'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { SharedLogsTable } from '@/components/ui/SharedLogsTable';
import { Pagination } from '@/components/Pagination';
import { useAdminUserActivity } from '@/hooks/admin/users';

const LOGS_PER_PAGE = 10;

export interface ActivityTabProps {
  userId: string;
}

export function ActivityTab({ userId }: ActivityTabProps) {
  const t = useTranslations('admin.users');
  const { logs, loading, page, setPage, totalPages, totalLogs } = useAdminUserActivity(userId, LOGS_PER_PAGE);

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
