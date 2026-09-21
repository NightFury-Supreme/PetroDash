/* ==========================================================================
   Admin Servers Queue Tab View
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminServersTable from './AdminServersTable';
import AdminServersSkeleton from '@/components/skeletons/admin/servers/AdminServersSkeleton';
import type { AdminServer } from './types';

interface AdminServersQueueTabProps {
  queueServers: AdminServer[];
  queueLoading: boolean;
  queueError: string | null;
  queuePage: number;
  setQueuePage: React.Dispatch<React.SetStateAction<number>>;
  totalQueuePages: number;
  totalQueueServers: number;
  serversPerPage: number;
  onDelete: (id: string, name: string) => void;
  deleting: string | null;
}

export function AdminServersQueueTab({
  queueServers,
  queueLoading,
  queueError,
  queuePage,
  setQueuePage,
  totalQueuePages,
  totalQueueServers,
  serversPerPage,
  onDelete,
  deleting,
}: AdminServersQueueTabProps) {
  const t = useTranslations('admin.servers');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  if (queueLoading) {
    return <AdminServersSkeleton />;
  }

  if (queueError) {
    const displayError = tErrorBackend.has(queueError) ? tErrorBackend(queueError) : queueError;
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
        {tCommon('error')}: {displayError}
      </div>
    );
  }

  if (queueServers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#161616] border border-[#2A2A2A] flex items-center justify-center">
          <Clock size={28} className="text-[#444]" />
        </div>
        <h3 className="text-lg font-semibold text-[#D4D4D4] mb-2">{t('empty.queueTitle')}</h3>
        <p className="text-sm text-[#888] max-w-sm">{t('empty.queueDescription')}</p>
      </div>
    );
  }

  return (
    <div>
      <AdminServersTable
        servers={queueServers}
        onDelete={onDelete}
        onEdit={() => {}}
        deleting={deleting}
      />
      {totalQueuePages > 1 && (
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
          <p className="text-[11px] text-white/20">
            {tCommon('pagination.showing')} {queueServers.length > 0 ? (queuePage - 1) * serversPerPage + 1 : 0}
            {' - '}
            {Math.min(queuePage * serversPerPage, totalQueueServers)} {tCommon('pagination.of')} {totalQueueServers}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={queuePage === 1 || queueLoading}
              onClick={() => setQueuePage((c) => Math.max(1, c - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={tCommon('pagination.previous')}
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center px-2">
              <span className="text-xs font-medium text-white/40">
                {queuePage} <span className="text-white/20 mx-1">/</span> {totalQueuePages}
              </span>
            </div>
            <button
              type="button"
              disabled={queuePage === totalQueuePages || queueLoading}
              onClick={() => setQueuePage((c) => Math.min(totalQueuePages, c + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={tCommon('pagination.next')}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
