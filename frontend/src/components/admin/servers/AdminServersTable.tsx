'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Server } from 'lucide-react';
import { AdminServerTableRow } from './AdminServerTableRow';
import type { AdminServersTableProps } from './types';

export default function AdminServersTable({
  servers,
  onDelete,
  onEdit,
  onSuspend,
  onUnsuspend,
  deleting,
  hideOwner = false,
}: AdminServersTableProps) {
  const t = useTranslations('admin.servers');

  const cols = hideOwner
    ? 'lg:grid-cols-[1fr_1fr_1fr_100px_80px_100px_100px_160px]'
    : 'lg:grid-cols-[1fr_1.5fr_1fr_1fr_100px_80px_100px_100px_160px]';

  return (
    <div>
      <div className="w-full">
        <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}>
          <span>{t('serverName')}</span>
          {!hideOwner && <span>{t('owner')}</span>}
          <span>{t('node')}</span>
          <span>{t('egg')}</span>
          <span>{t('status')}</span>
          <span>{t('cpu')}</span>
          <span>{t('ram')}</span>
          <span>{t('disk')}</span>
          <span className="text-right">{t('actions')}</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {servers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Server className="mb-3 h-8 w-8 text-white/20" strokeWidth={1.5} />
              <p className="text-xs text-[#555]">{t('noServers')}</p>
            </div>
          ) : (
            servers.map((server) => (
              <AdminServerTableRow
                key={server.id}
                server={server}
                onDelete={onDelete}
                onEdit={onEdit}
                onSuspend={onSuspend}
                onUnsuspend={onUnsuspend}
                deleting={deleting}
                hideOwner={hideOwner}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export { AdminServersTable };
