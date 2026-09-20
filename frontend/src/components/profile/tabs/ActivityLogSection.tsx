
import React from 'react';
import { useTranslations } from 'next-intl';
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { SharedLogsTable } from '@/components/ui/SharedLogsTable';
import { Pagination } from '@/components/Pagination';


export function ActivityLogSection() {
  const t = useTranslations('Profile');

  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalLogs, setTotalLogs] = React.useState(0);
  const LOGS_PER_PAGE = 10;

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/activity?page=${page}&limit=${LOGS_PER_PAGE}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    .then(r => r.json())
    .then(data => {
      if (active && data.success) {
        setLogs(data.data);
        setTotalLogs(data.pagination?.total || 0);
        setTotalPages(data.pagination?.pages || 1);
      }
      if (active) setLoading(false);
    })
    .catch(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [page]);

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

