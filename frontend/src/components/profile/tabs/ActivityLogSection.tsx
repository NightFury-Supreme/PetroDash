'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { SharedLogsTable } from '@/components/ui/SharedLogsTable';
import { Pagination } from '@/components/Pagination';
import { useActivityLogs } from '@/hooks/profile';

const LOGS_PER_PAGE = 10;

export function ActivityLogSection() {
  const t = useTranslations('Profile');
  const { logs, loading, page, setPage, totalPages, totalLogs } = useActivityLogs(LOGS_PER_PAGE);

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

        {/* PAGINATION */}
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
