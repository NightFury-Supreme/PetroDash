/* ==========================================================================
   Admin Servers List Tab View
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Server as ServerIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminServersTable from './AdminServersTable';
import AdminServersSkeleton from '@/components/skeletons/admin/servers/AdminServersSkeleton';
import type { AdminServer } from './types';

interface AdminServersListTabProps {
  servers: AdminServer[];
  loading: boolean;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  totalServers: number;
  serversPerPage: number;
  onDelete: (id: string, name: string) => void;
  onEdit: (id: string) => void;
  deleting: string | null;
}

export function AdminServersListTab({
  servers,
  loading,
  page,
  setPage,
  totalPages,
  totalServers,
  serversPerPage,
  onDelete,
  onEdit,
  deleting,
}: AdminServersListTabProps) {
  const t = useTranslations('admin.servers');
  const tCommon = useTranslations('Common');

  if (loading) {
    return <AdminServersSkeleton />;
  }

  if (servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#161616] border border-[#2A2A2A] flex items-center justify-center">
          <ServerIcon size={28} className="text-[#444]" />
        </div>
        <h3 className="text-lg font-semibold text-[#D4D4D4] mb-2">{t('empty.serversTitle')}</h3>
        <p className="text-sm text-[#888] max-w-sm">{t('empty.serversDescription')}</p>
      </div>
    );
  }

  return (
    <div>
      <AdminServersTable
        servers={servers}
        onDelete={onDelete}
        onEdit={onEdit}
        deleting={deleting}
      />
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
          <p className="text-[11px] text-white/20">
            {tCommon('pagination.showing')} {servers.length > 0 ? (page - 1) * serversPerPage + 1 : 0}
            {' - '}
            {Math.min(page * serversPerPage, totalServers)} {tCommon('pagination.of')} {totalServers}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 1 || loading}
              onClick={() => setPage((c) => Math.max(1, c - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={tCommon('pagination.previous')}
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center px-2">
              <span className="text-xs font-medium text-white/40">
                {page} <span className="text-white/20 mx-1">/</span> {totalPages}
              </span>
            </div>
            <button
              type="button"
              disabled={page === totalPages || loading}
              onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
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
