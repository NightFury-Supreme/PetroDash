/* ==========================================================================
   Admin User Table Row Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { Server, Coins, User as UserIcon } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { RankBadge, StatusBadge } from '@/components/ui';
import { AdminUserRowActions } from './AdminUserRowActions';

interface AdminUserTableRowProps {
  user: any;
  onDelete: (id: string, username: string) => void;
  onToggleBan?: (user: any) => void;
  onOpenBan?: (user: any) => void;
  onOpenUnban?: (user: any) => void;
  banningUserId: string | null;
  deletingUserId: string | null;
}

export function AdminUserTableRow({
  user,
  onDelete,
  onToggleBan,
  onOpenBan,
  onOpenUnban,
  banningUserId,
  deletingUserId,
}: AdminUserTableRowProps) {
  const t = useTranslations('admin.users');

  const isBanned = Boolean(user.ban?.isBanned);
  const userAvatar =
    user.profilePicture ||
    user.oauthProviders?.discord?.avatar ||
    user.oauthProviders?.google?.picture;

  return (
    <div className="group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] lg:grid-cols-[1.5fr_1.2fr_90px_90px_90px_100px_120px] lg:items-center">
      {/* User (Avatar, Name, Email) */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('user')}
        </p>
        <Link
          href={`/admin/users/${user._id}`}
          className="flex items-center gap-2.5 group/link w-fit max-w-full"
        >
          <div className="w-7 h-7 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] flex items-center justify-center shrink-0 overflow-hidden">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={user.username || t('user')}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon size={12} className="text-[#666]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#D4D4D4] group-hover/link:text-[#FF5722] transition-colors truncate">
              {user.username}
            </p>
            <p className="text-[10px] text-[#666] truncate">
              {user.email}
            </p>
          </div>
        </Link>
      </div>

      {/* User ID */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('userId')}
        </p>
        <span className="block truncate font-mono text-[11px] text-[#888]">
          {user._id}
        </span>
      </div>

      {/* Role */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('role')}
        </p>
        <div className="flex items-center">
          <RankBadge rank={user.role || 'user'} />
        </div>
      </div>

      {/* Status */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('status')}
        </p>
        <div>
          <StatusBadge variant={isBanned ? 'danger' : 'success'}>
            {isBanned ? t('banned') : t('active')}
          </StatusBadge>
        </div>
      </div>

      {/* Servers */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('servers')}
        </p>
        <div className="flex items-center gap-1.5 font-normal text-[#E0E0E0] text-sm">
          <Server size={14} strokeWidth={1.5} className="text-white" />
          <span className="truncate">{user.serverCount ?? user.serversCount ?? 0}</span>
        </div>
      </div>

      {/* Coins */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('coins')}
        </p>
        <div className="flex items-center gap-1.5 font-normal text-[#E0E0E0] text-sm">
          <Coins size={14} strokeWidth={1.5} className="text-white" />
          <span className="truncate">{(user.coins ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Actions */}
      <AdminUserRowActions
        user={user}
        onDelete={onDelete}
        onToggleBan={onToggleBan}
        onOpenBan={onOpenBan}
        onOpenUnban={onOpenUnban}
        banningUserId={banningUserId}
        deletingUserId={deletingUserId}
      />
    </div>
  );
}
