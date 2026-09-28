/* ==========================================================================
   Admin Users Table Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AdminUserTableRow } from './AdminUserTableRow';

interface UsersTableProps {
  users: any[];
  onDelete: (id: string, username: string) => void;
  onToggleBan?: (user: any) => void;
  onOpenBan?: (user: any) => void;
  onOpenUnban?: (user: any) => void;
  banningUserId: string | null;
  deletingUserId: string | null;
  loading?: boolean;
}

export function UsersTable({
  users,
  onDelete,
  onToggleBan,
  onOpenBan,
  onOpenUnban,
  banningUserId,
  deletingUserId,
  loading = false,
}: UsersTableProps) {
  const t = useTranslations('admin.users');

  return (
    <div>
      <div className="w-full">
        {/* TABLE HEADER (Desktop) */}
        <div className="hidden gap-4 lg:grid lg:grid-cols-[1.8fr_1.2fr_90px_90px_100px_120px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30">
          <span>{t('user')}</span>
          <span>{t('userId')}</span>
          <span>{t('status')}</span>
          <span>{t('servers')}</span>
          <span>{t('coins')}</span>
          <span className="text-right">{t('actions')}</span>
        </div>

        {/* TABLE LIST */}
        <div className={`divide-y divide-[#222] ${loading && users.length > 0 ? 'opacity-60 transition-opacity pointer-events-none' : ''}`}>
          {loading && users.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 px-5 py-3.5 lg:grid lg:grid-cols-[1.8fr_1.2fr_90px_90px_100px_120px] lg:items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/[0.04] animate-pulse shrink-0" />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="h-3 w-28 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-2 w-36 bg-white/[0.03] rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-2.5 w-24 bg-white/[0.04] rounded animate-pulse" />
                <div className="h-5 w-16 bg-white/[0.04] rounded-full animate-pulse" />
                <div className="h-3 w-8 bg-white/[0.04] rounded animate-pulse" />
                <div className="h-3 w-12 bg-white/[0.04] rounded animate-pulse" />
                <div className="flex justify-end gap-2">
                  <div className="w-8 h-8 bg-white/[0.04] rounded-lg animate-pulse" />
                  <div className="w-8 h-8 bg-white/[0.04] rounded-lg animate-pulse" />
                  <div className="w-8 h-8 bg-white/[0.04] rounded-lg animate-pulse" />
                </div>
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-xs text-[#555]">
              {t('noUsersFound')}
            </div>
          ) : (
            users.map((user) => (
              <AdminUserTableRow
                key={user._id}
                user={user}
                onDelete={onDelete}
                onToggleBan={onToggleBan}
                onOpenBan={onOpenBan}
                onOpenUnban={onOpenUnban}
                banningUserId={banningUserId}
                deletingUserId={deletingUserId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default UsersTable;
