'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Clock, FileText, PlayCircle, ShieldAlert } from 'lucide-react';
import type { AdminServer } from './types';

interface AdminServerSuspendedNoticeProps {
  server: AdminServer;
  onUnsuspend?: (server: AdminServer) => void;
}

export function AdminServerSuspendedNotice({
  server,
  onUnsuspend,
}: AdminServerSuspendedNoticeProps) {
  const t = useTranslations('admin.servers');

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
        <ShieldAlert size={40} className="text-red-400 mb-1" strokeWidth={1.5} />
        <div>
          <p className="text-base font-semibold text-white">{t('serverSuspended')}</p>
          <p className="text-xs text-[#888] mt-1 max-w-[320px]">
            {t('serverSuspendedDesc')}
          </p>
        </div>

        <div className="w-full max-w-sm rounded-lg border border-[#222] bg-[#141414] p-4 text-xs space-y-2.5 text-left mt-3">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[#888] flex items-center gap-1.5 shrink-0">
              <FileText size={13} className="text-[#666]" />
              {t('currentReason')}:
            </span>
            <span className="text-right text-[#DDD] font-medium break-all">
              {server.suspensionReason || t('noReasonProvided')}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3 pt-2 border-t border-[#222]">
            <span className="text-[#888] flex items-center gap-1.5 shrink-0">
              <Clock size={13} className="text-[#666]" />
              {t('currentExpiry')}:
            </span>
            <span className="text-right text-[#DDD] font-mono">
              {server.suspendedUntil ? new Date(server.suspendedUntil).toUTCString() : t('permanentSuspension')}
            </span>
          </div>
        </div>

        {onUnsuspend && (
          <button
            type="button"
            onClick={() => onUnsuspend(server)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#222] bg-transparent px-5 py-2.5 text-sm font-medium text-[#888] hover:border-[#333] hover:text-[#D4D4D4] hover:bg-white/5 transition-colors"
          >
            <PlayCircle size={16} />
            <span>{t('unsuspendServer')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
