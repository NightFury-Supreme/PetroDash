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
  onToggleBan: (user: any) => void;
  banningUserId: string | null;
  deletingUserId: string | null;
}

export function UsersTable({
  users,
  onDelete,
  onToggleBan,
  banningUserId,
  deletingUserId,
}: UsersTableProps) {
  const t = useTranslations('admin.users');

  return (
    <div>
      <div className="w-full">
        {/* TABLE HEADER (Desktop) */}
        <div className="hidden gap-4 lg:grid lg:grid-cols-[1.5fr_1.2fr_90px_90px_90px_100px_110px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30">
          <span>{t('user')}</span>
          <span>{t('userId')}</span>
          <span>{t('role')}</span>
          <span>{t('status')}</span>
          <span>{t('servers')}</span>
          <span>{t('coins')}</span>
          <span className="text-right">{t('actions')}</span>
        </div>

        {/* TABLE LIST */}
        <div className="divide-y divide-[#222]">
          {users.length === 0 ? (
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
